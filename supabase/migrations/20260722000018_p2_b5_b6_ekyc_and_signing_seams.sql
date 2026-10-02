-- P2-B5/B6: expand-only e-KYC and multi-party signing seams.
-- No raw KTP, selfie, liveness media, biometric template, private key, credential,
-- provider payload, or internal object path is permitted in these relations.

CREATE TYPE public.ekyc_user_role AS ENUM ('client', 'advocate');
CREATE TYPE public.ekyc_verification_type AS ENUM ('LIVENESS_OCR', 'SIPP_BIOMETRIC');
CREATE TYPE public.ekyc_verification_status AS ENUM (
    'PENDING', 'PASSED', 'REJECTED', 'REQUIRES_MANUAL_REVIEW'
);
CREATE TYPE public.signing_case_type AS ENUM ('CONSULTATION', 'CORPORATE');
CREATE TYPE public.signing_envelope_status AS ENUM (
    'DRAFT', 'SENT', 'PARTIALLY_SIGNED', 'COMPLETED', 'VOIDED', 'EXPIRED'
);
CREATE TYPE public.signing_party_role AS ENUM ('CLIENT', 'ADVOCATE', 'NOTARY', 'WITNESS');
CREATE TYPE public.signing_party_status AS ENUM ('PENDING', 'SIGNED', 'REJECTED');

CREATE TABLE public.ekyc_verification_logs (
    verification_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    user_role public.ekyc_user_role NOT NULL,
    provider_name VARCHAR(64) NOT NULL,
    verification_type public.ekyc_verification_type NOT NULL,
    status public.ekyc_verification_status NOT NULL DEFAULT 'PENDING',
    provider_reference_id VARCHAR(192),
    result_digest_sha256 TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_ekyc_provider_name CHECK (btrim(provider_name) <> ''),
    CONSTRAINT chk_ekyc_provider_reference CHECK (
        provider_reference_id IS NULL OR btrim(provider_reference_id) <> ''
    ),
    CONSTRAINT chk_ekyc_result_digest CHECK (
        result_digest_sha256 IS NULL OR result_digest_sha256 ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT chk_ekyc_terminal_evidence CHECK (
        (status = 'PENDING' AND verified_at IS NULL)
        OR (status <> 'PENDING' AND provider_reference_id IS NOT NULL
            AND result_digest_sha256 IS NOT NULL AND verified_at IS NOT NULL)
    )
);

CREATE TABLE public.signing_envelopes (
    envelope_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    case_type public.signing_case_type NOT NULL,
    case_id UUID NOT NULL,
    provider_name VARCHAR(64) NOT NULL,
    external_envelope_id VARCHAR(192) NOT NULL,
    document_title VARCHAR(256) NOT NULL,
    document_sha256_hash TEXT NOT NULL,
    status public.signing_envelope_status NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_signing_envelopes_external UNIQUE (external_envelope_id),
    CONSTRAINT chk_signing_provider_name CHECK (btrim(provider_name) <> ''),
    CONSTRAINT chk_signing_external_id CHECK (btrim(external_envelope_id) <> ''),
    CONSTRAINT chk_signing_document_title CHECK (btrim(document_title) <> ''),
    CONSTRAINT chk_signing_document_digest CHECK (document_sha256_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_signing_completed_at CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL)
        OR (status <> 'COMPLETED' AND completed_at IS NULL)
    )
);

CREATE TABLE public.signing_envelope_parties (
    party_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    envelope_id UUID NOT NULL REFERENCES public.signing_envelopes(envelope_id) ON DELETE RESTRICT,
    party_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    party_role public.signing_party_role NOT NULL,
    signer_email VARCHAR(254) NOT NULL,
    signing_order INTEGER NOT NULL,
    signing_status public.signing_party_status NOT NULL DEFAULT 'PENDING',
    signed_at TIMESTAMPTZ,
    provider_recipient_id VARCHAR(192),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_signing_party_identity UNIQUE (envelope_id, party_user_id, party_role),
    CONSTRAINT uq_signing_party_recipient UNIQUE (envelope_id, provider_recipient_id),
    CONSTRAINT chk_signing_party_email CHECK (
        signer_email = btrim(signer_email) AND signer_email LIKE '%_@_%._%'
    ),
    CONSTRAINT chk_signing_order CHECK (signing_order > 0),
    CONSTRAINT chk_signing_recipient_id CHECK (
        provider_recipient_id IS NULL OR btrim(provider_recipient_id) <> ''
    ),
    CONSTRAINT chk_signing_party_timestamp CHECK (
        (signing_status = 'SIGNED' AND signed_at IS NOT NULL)
        OR (signing_status <> 'SIGNED' AND signed_at IS NULL)
    )
);

COMMENT ON TABLE public.ekyc_verification_logs IS
    'Metadata-only e-KYC ledger. Raw KTP/liveness/biometric media and provider payloads are prohibited.';
COMMENT ON TABLE public.signing_envelopes IS
    'Provider-neutral signing envelope metadata. Never stores document bytes, credentials, private keys, or raw callbacks.';
COMMENT ON COLUMN public.ekyc_verification_logs.result_digest_sha256 IS
    'Lowercase SHA-256 digest of minimized provider evidence/audit bundle; never a digest of bare NIK.';

CREATE UNIQUE INDEX uq_ekyc_provider_reference
    ON public.ekyc_verification_logs(provider_name, provider_reference_id)
    WHERE provider_reference_id IS NOT NULL;
CREATE INDEX idx_ekyc_user_status
    ON public.ekyc_verification_logs(user_id, status, created_at DESC);
CREATE INDEX idx_ekyc_manual_review
    ON public.ekyc_verification_logs(created_at)
    WHERE status = 'REQUIRES_MANUAL_REVIEW';
CREATE INDEX idx_signing_envelopes_case
    ON public.signing_envelopes(case_type, case_id, created_at DESC);
CREATE INDEX idx_signing_envelopes_status
    ON public.signing_envelopes(status, updated_at DESC);
CREATE INDEX idx_signing_parties_user
    ON public.signing_envelope_parties(party_user_id, signing_status, created_at DESC);
CREATE INDEX idx_signing_parties_route
    ON public.signing_envelope_parties(envelope_id, signing_order, signing_status);

CREATE OR REPLACE FUNCTION public.fn_validate_signing_envelope_case()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.case_type = 'CONSULTATION' AND NOT EXISTS (
        SELECT 1 FROM public.booking_sessions WHERE booking_id = NEW.case_id
    ) THEN
        RAISE EXCEPTION 'SIGNING_CONSULTATION_NOT_FOUND';
    ELSIF NEW.case_type = 'CORPORATE' AND NOT EXISTS (
        SELECT 1 FROM public.corporate_service_cases WHERE case_id = NEW.case_id
    ) THEN
        RAISE EXCEPTION 'SIGNING_CORPORATE_CASE_NOT_FOUND';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_guard_ekyc_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'EKYC_LOG_APPEND_ONLY';
    END IF;
    IF OLD.status IN ('PASSED', 'REJECTED') THEN
        RAISE EXCEPTION 'EKYC_TERMINAL_RECORD_IMMUTABLE';
    END IF;
    IF (NEW.user_id, NEW.user_role, NEW.provider_name, NEW.verification_type, NEW.created_at)
       IS DISTINCT FROM
       (OLD.user_id, OLD.user_role, OLD.provider_name, OLD.verification_type, OLD.created_at) THEN
        RAISE EXCEPTION 'EKYC_IDENTITY_FIELDS_IMMUTABLE';
    END IF;
    IF OLD.status = 'REQUIRES_MANUAL_REVIEW'
       AND NEW.status NOT IN ('REQUIRES_MANUAL_REVIEW', 'PASSED', 'REJECTED') THEN
        RAISE EXCEPTION 'EKYC_STATUS_TRANSITION_FORBIDDEN';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_guard_signing_envelope_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'SIGNING_ENVELOPE_APPEND_ONLY';
    END IF;
    IF OLD.status IN ('COMPLETED', 'VOIDED', 'EXPIRED') THEN
        RAISE EXCEPTION 'SIGNING_ENVELOPE_TERMINAL_IMMUTABLE';
    END IF;
    IF OLD.status <> 'DRAFT' AND
       (NEW.case_type, NEW.case_id, NEW.provider_name, NEW.external_envelope_id,
        NEW.document_title, NEW.document_sha256_hash, NEW.created_by, NEW.created_at)
       IS DISTINCT FROM
       (OLD.case_type, OLD.case_id, OLD.provider_name, OLD.external_envelope_id,
        OLD.document_title, OLD.document_sha256_hash, OLD.created_by, OLD.created_at) THEN
        RAISE EXCEPTION 'SIGNING_DOCUMENT_IDENTITY_IMMUTABLE_AFTER_SEND';
    END IF;
    IF NOT (CASE OLD.status
        WHEN 'DRAFT' THEN NEW.status IN ('DRAFT', 'SENT', 'VOIDED')
        WHEN 'SENT' THEN NEW.status IN ('SENT', 'PARTIALLY_SIGNED', 'COMPLETED', 'VOIDED', 'EXPIRED')
        WHEN 'PARTIALLY_SIGNED' THEN NEW.status IN ('PARTIALLY_SIGNED', 'COMPLETED', 'VOIDED', 'EXPIRED')
        ELSE false
    END) THEN
        RAISE EXCEPTION 'SIGNING_ENVELOPE_STATUS_TRANSITION_FORBIDDEN';
    END IF;
    IF NEW.status = 'COMPLETED' AND (
        NOT EXISTS (
            SELECT 1 FROM public.signing_envelope_parties
            WHERE envelope_id = NEW.envelope_id
        )
        OR EXISTS (
            SELECT 1 FROM public.signing_envelope_parties
            WHERE envelope_id = NEW.envelope_id AND signing_status <> 'SIGNED'
        )
    ) THEN
        RAISE EXCEPTION 'SIGNING_ENVELOPE_PARTIES_INCOMPLETE';
    END IF;
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_guard_signing_party_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_envelope_status public.signing_envelope_status;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT status INTO v_envelope_status
        FROM public.signing_envelopes WHERE envelope_id = NEW.envelope_id;
        IF v_envelope_status IS DISTINCT FROM 'DRAFT' THEN
            RAISE EXCEPTION 'SIGNING_PARTIES_LOCKED_AFTER_SEND';
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'SIGNING_PARTY_APPEND_ONLY';
    END IF;
    SELECT status INTO v_envelope_status
    FROM public.signing_envelopes WHERE envelope_id = OLD.envelope_id;
    IF v_envelope_status IN ('COMPLETED', 'VOIDED', 'EXPIRED') OR OLD.signing_status <> 'PENDING' THEN
        RAISE EXCEPTION 'SIGNING_PARTY_TERMINAL_IMMUTABLE';
    END IF;
    IF (NEW.envelope_id, NEW.party_user_id, NEW.party_role, NEW.signer_email,
        NEW.signing_order, NEW.created_at)
       IS DISTINCT FROM
       (OLD.envelope_id, OLD.party_user_id, OLD.party_role, OLD.signer_email,
        OLD.signing_order, OLD.created_at) THEN
        RAISE EXCEPTION 'SIGNING_PARTY_IDENTITY_FIELDS_IMMUTABLE';
    END IF;
    IF NEW.signing_status = 'SIGNED' AND EXISTS (
        SELECT 1 FROM public.signing_envelope_parties AS earlier_party
        WHERE earlier_party.envelope_id = OLD.envelope_id
          AND earlier_party.signing_order < OLD.signing_order
          AND earlier_party.signing_status <> 'SIGNED'
    ) THEN
        RAISE EXCEPTION 'SIGNING_ORDER_PREDECESSOR_INCOMPLETE';
    END IF;
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_signing_envelope_case
BEFORE INSERT OR UPDATE OF case_type, case_id ON public.signing_envelopes
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_signing_envelope_case();
CREATE TRIGGER trg_guard_ekyc_log_mutation
BEFORE UPDATE OR DELETE ON public.ekyc_verification_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_ekyc_log_mutation();
CREATE TRIGGER trg_guard_signing_envelope_mutation
BEFORE UPDATE OR DELETE ON public.signing_envelopes
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_signing_envelope_mutation();
CREATE TRIGGER trg_guard_signing_party_mutation
BEFORE INSERT OR UPDATE OR DELETE ON public.signing_envelope_parties
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_signing_party_mutation();

CREATE OR REPLACE FUNCTION public.fn_can_read_signing_envelope(p_envelope_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.signing_envelopes AS envelope
        WHERE envelope.envelope_id = p_envelope_id
          AND (
              EXISTS (
                  SELECT 1 FROM public.signing_envelope_parties AS party
                  WHERE party.envelope_id = envelope.envelope_id
                    AND party.party_user_id = auth.uid()
              )
              OR (envelope.case_type = 'CONSULTATION' AND EXISTS (
                  SELECT 1 FROM public.booking_sessions AS booking
                  WHERE booking.booking_id = envelope.case_id
                    AND booking.advocate_id = auth.uid()
              ))
              OR (envelope.case_type = 'CORPORATE' AND EXISTS (
                  SELECT 1
                  FROM public.corporate_service_cases AS corporate_case
                  JOIN public.service_orders AS service_order
                    ON service_order.order_id = corporate_case.order_id
                  WHERE corporate_case.case_id = envelope.case_id
                    AND (corporate_case.assigned_notary_id = auth.uid()
                         OR service_order.assigned_professional_id = auth.uid())
              ))
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admin_user
                  WHERE admin_user.admin_id = auth.uid()
                    AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    );
$$;

REVOKE ALL ON FUNCTION public.fn_validate_signing_envelope_case() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_guard_ekyc_log_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_guard_signing_envelope_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_guard_signing_party_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_validate_signing_envelope_case() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_guard_ekyc_log_mutation() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_guard_signing_envelope_mutation() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_guard_signing_party_mutation() TO service_role;
REVOKE ALL ON FUNCTION public.fn_can_read_signing_envelope(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_can_read_signing_envelope(UUID) TO authenticated, service_role;

ALTER TABLE public.ekyc_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekyc_verification_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.signing_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.signing_envelope_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_envelope_parties FORCE ROW LEVEL SECURITY;

CREATE POLICY rls_ekyc_logs_subject_read
ON public.ekyc_verification_logs FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users_admin AS admin_user
        WHERE admin_user.admin_id = auth.uid()
          AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    )
);

CREATE POLICY rls_signing_envelopes_authorized_read
ON public.signing_envelopes FOR SELECT TO authenticated
USING (public.fn_can_read_signing_envelope(envelope_id));

CREATE POLICY rls_signing_parties_authorized_read
ON public.signing_envelope_parties FOR SELECT TO authenticated
USING (public.fn_can_read_signing_envelope(envelope_id));

REVOKE ALL ON TABLE public.ekyc_verification_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signing_envelopes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signing_envelope_parties FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ekyc_verification_logs TO authenticated;
GRANT SELECT ON TABLE public.signing_envelopes TO authenticated;
GRANT SELECT ON TABLE public.signing_envelope_parties TO authenticated;
GRANT ALL ON TABLE public.ekyc_verification_logs TO service_role;
GRANT ALL ON TABLE public.signing_envelopes TO service_role;
GRANT ALL ON TABLE public.signing_envelope_parties TO service_role;

-- Existing consultation, corporate, escrow, opinion, and e-Meterai tables remain untouched.
