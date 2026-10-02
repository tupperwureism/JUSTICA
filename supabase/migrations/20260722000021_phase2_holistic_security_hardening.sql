-- Phase 2 holistic security hardening.
-- This roll-forward keeps provider and file-processing writes behind service_role.

ALTER TABLE public.document_integrity_anchors
    ADD COLUMN signing_envelope_id UUID,
    ADD COLUMN public_verification_token UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    ADD CONSTRAINT fk_document_integrity_anchor_envelope
        FOREIGN KEY (signing_envelope_id)
        REFERENCES public.signing_envelopes(envelope_id) ON DELETE RESTRICT,
    ADD CONSTRAINT chk_psre_anchor_envelope
        CHECK (anchor_source <> 'PSRE_DIGITAL_SIGN' OR signing_envelope_id IS NOT NULL)
        NOT VALID;

CREATE UNIQUE INDEX uq_document_integrity_anchor_public_token
    ON public.document_integrity_anchors(public_verification_token);
CREATE INDEX idx_document_integrity_anchor_envelope
    ON public.document_integrity_anchors(signing_envelope_id)
    WHERE signing_envelope_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_validate_document_integrity_anchor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_envelope public.signing_envelopes%ROWTYPE;
BEGIN
    IF NEW.signing_envelope_id IS NOT NULL THEN
        SELECT * INTO v_envelope
        FROM public.signing_envelopes
        WHERE envelope_id = NEW.signing_envelope_id
        FOR KEY SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INTEGRITY_ANCHOR_ENVELOPE_NOT_FOUND';
        END IF;
        IF NEW.document_id <> v_envelope.envelope_id THEN
            RAISE EXCEPTION 'INTEGRITY_ANCHOR_DOCUMENT_ID_MISMATCH';
        END IF;
        IF NEW.sha256_document_hash <> v_envelope.document_sha256_hash THEN
            RAISE EXCEPTION 'INTEGRITY_ANCHOR_DIGEST_MISMATCH';
        END IF;
        IF v_envelope.status NOT IN ('SENT', 'PARTIALLY_SIGNED', 'COMPLETED') THEN
            RAISE EXCEPTION 'INTEGRITY_ANCHOR_ENVELOPE_STATE_INVALID';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_document_integrity_anchor
BEFORE INSERT ON public.document_integrity_anchors
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_document_integrity_anchor();

CREATE OR REPLACE FUNCTION public.fn_assert_completed_envelope_anchor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND NOT EXISTS (
        SELECT 1
        FROM public.document_integrity_anchors AS anchor
        WHERE anchor.signing_envelope_id = NEW.envelope_id
          AND anchor.document_id = NEW.envelope_id
          AND anchor.sha256_document_hash = NEW.document_sha256_hash
          AND anchor.anchor_source = 'PSRE_DIGITAL_SIGN'
    ) THEN
        RAISE EXCEPTION 'COMPLETED_ENVELOPE_PSRE_ANCHOR_REQUIRED';
    END IF;
    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_assert_completed_envelope_anchor
AFTER INSERT OR UPDATE OF status, document_sha256_hash ON public.signing_envelopes
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.fn_assert_completed_envelope_anchor();

ALTER TABLE public.document_integrity_anchors
    ENABLE ALWAYS TRIGGER trg_worm_document_integrity_anchors;
ALTER TABLE public.document_integrity_anchors
    ENABLE ALWAYS TRIGGER trg_validate_document_integrity_anchor;
ALTER TABLE public.signing_envelopes
    ENABLE ALWAYS TRIGGER trg_guard_signing_envelope_mutation;
ALTER TABLE public.signing_envelopes
    ENABLE ALWAYS TRIGGER trg_assert_completed_envelope_anchor;
ALTER TABLE public.signing_envelope_parties
    ENABLE ALWAYS TRIGGER trg_guard_signing_party_mutation;
ALTER TABLE public.ekyc_verification_logs
    ENABLE ALWAYS TRIGGER trg_guard_ekyc_log_mutation;

-- Browser callers must never assert that they scanned or hashed server-side files.
-- Preserve the named policies as explicit deny entries so the declaration map also
-- represents the effective contract; service_role remains the only write path.
DROP POLICY IF EXISTS rls_government_jobs_assigned_notary_insert
    ON public.government_submission_jobs;
CREATE POLICY rls_government_jobs_assigned_notary_insert
ON public.government_submission_jobs FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS rls_government_jobs_assigned_notary_update
    ON public.government_submission_jobs;
CREATE POLICY rls_government_jobs_assigned_notary_update
ON public.government_submission_jobs FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS rls_document_anchors_assigned_notary_insert
    ON public.document_integrity_anchors;
CREATE POLICY rls_document_anchors_assigned_notary_insert
ON public.document_integrity_anchors FOR INSERT TO authenticated
WITH CHECK (false);

REVOKE INSERT, UPDATE ON TABLE public.government_submission_jobs FROM authenticated;
REVOKE INSERT ON TABLE public.document_integrity_anchors FROM authenticated;

CREATE OR REPLACE FUNCTION public.fn_verify_public_legal_document(p_sha256_hash TEXT)
RETURNS TABLE (
    verification_id UUID,
    digest_match BOOLEAN,
    document_type VARCHAR,
    document_title VARCHAR,
    finalized_at TIMESTAMPTZ,
    signature_provider_status VARCHAR,
    emeterai_serial VARCHAR,
    emeterai_status VARCHAR,
    warning VARCHAR
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '2s'
AS $$
DECLARE
    v_digest TEXT := lower(trim(p_sha256_hash));
BEGIN
    IF v_digest !~ '^[0-9a-f]{64}$' THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH candidates AS (
        SELECT anchor.public_verification_token AS candidate_id,
               anchor.document_type::VARCHAR AS candidate_type,
               coalesce(envelope.document_title,
                   replace(anchor.document_type, '_', ' '))::VARCHAR AS candidate_title,
               anchor.anchored_at AS candidate_finalized_at,
               CASE WHEN anchor.anchor_source = 'PSRE_DIGITAL_SIGN'
                   THEN 'ANCHORED' ELSE 'NOT_RECORDED' END::VARCHAR AS candidate_signature_status,
               CASE WHEN anchor.anchor_source = 'PERURI_EMETERAI'
                   THEN anchor.serial_number ELSE NULL END::VARCHAR AS candidate_emeterai_serial,
               CASE WHEN anchor.anchor_source = 'PERURI_EMETERAI'
                   THEN 'ANCHORED' ELSE 'NOT_RECORDED' END::VARCHAR AS candidate_emeterai_status,
               1 AS candidate_priority
        FROM public.document_integrity_anchors AS anchor
        LEFT JOIN public.signing_envelopes AS envelope
          ON envelope.envelope_id = anchor.signing_envelope_id
        WHERE anchor.sha256_document_hash = v_digest

        UNION ALL

        SELECT stamp.public_verification_token,
               'LEGAL_OPINION'::VARCHAR,
               opinion.document_title,
               stamp.stamped_at,
               'NOT_RECORDED'::VARCHAR,
               stamp.peruri_serial_number,
               stamp.status,
               2
        FROM public.emeterai_stamping_logs AS stamp
        JOIN public.legal_opinions AS opinion ON opinion.opinion_id = stamp.opinion_id
        WHERE lower(stamp.sha256_document_hash) = v_digest
    )
    SELECT candidate_id,
           true,
           candidate_type,
           candidate_title,
           candidate_finalized_at,
           candidate_signature_status,
           candidate_emeterai_serial,
           candidate_emeterai_status,
           'Kecocokan digest tidak dengan sendirinya membuktikan keabsahan transaksi.'::VARCHAR
    FROM candidates
    ORDER BY candidate_priority, candidate_finalized_at DESC
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.fn_verify_public_legal_document(TEXT) IS
    'Public allow-list over legacy e-Meterai and generic integrity anchors; never returns ownership IDs, storage paths, PII, biometric, BO/CDD, or provider payloads.';

REVOKE ALL ON FUNCTION public.fn_validate_document_integrity_anchor()
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_assert_completed_envelope_anchor()
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_validate_document_integrity_anchor() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_assert_completed_envelope_anchor() TO postgres;
REVOKE ALL ON FUNCTION public.fn_verify_public_legal_document(TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_verify_public_legal_document(TEXT)
    TO anon, authenticated;

-- Freeze the effective search path of security-sensitive functions to one exact,
-- catalog-verifiable value. All non-public references are schema-qualified.
ALTER FUNCTION public.fn_book_consultation_slot_mutex(UUID, TEXT, VARCHAR)
    SET search_path = public;
ALTER FUNCTION public.fn_release_escrow_to_advocate_mutex(UUID)
    SET search_path = public;
ALTER FUNCTION public.fn_webhook_settle_escrow_mutex(VARCHAR, UUID, NUMERIC)
    SET search_path = public;
ALTER FUNCTION public.fn_verify_public_legal_document(TEXT)
    SET search_path = public;
ALTER FUNCTION public.fn_can_read_signing_envelope(UUID)
    SET search_path = public;
ALTER FUNCTION public.fn_transition_corporate_service_case(UUID, VARCHAR, VARCHAR)
    SET search_path = public;
ALTER FUNCTION public.fn_sync_notary_submission_contract()
    SET search_path = public;
