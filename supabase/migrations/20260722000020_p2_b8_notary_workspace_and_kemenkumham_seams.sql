-- P2-B8: expand-only notary workspace and government submission seam.
-- Existing government_submission_jobs columns remain for backward compatibility.

CREATE TYPE public.notary_submission_target_system AS ENUM ('AHU_SABH', 'AHU_SABU', 'AHU_BO', 'OSS_RBA');
CREATE TYPE public.notary_submission_status AS ENUM ('DRAFT', 'SUBMITTED', 'REJECTED', 'APPROVED');

ALTER TABLE public.government_submission_jobs
    ADD COLUMN target_system public.notary_submission_target_system,
    ADD COLUMN submission_status public.notary_submission_status,
    ADD COLUMN authorized_notary_id UUID,
    ADD COLUMN external_registration_number VARCHAR(192),
    ADD COLUMN submission_payload_digest_sha256 TEXT,
    ADD COLUMN decided_at TIMESTAMPTZ;

UPDATE public.government_submission_jobs
SET target_system = CASE system
        WHEN 'OSS' THEN 'OSS_RBA'::public.notary_submission_target_system
        ELSE system::public.notary_submission_target_system
    END,
    submission_status = CASE
        WHEN status = 'SUBMITTED' THEN 'SUBMITTED'::public.notary_submission_status
        WHEN status = 'ACCEPTED' THEN 'APPROVED'::public.notary_submission_status
        WHEN status IN ('REJECTED', 'FAILED', 'CANCELLED') THEN 'REJECTED'::public.notary_submission_status
        ELSE 'DRAFT'::public.notary_submission_status
    END,
    authorized_notary_id = authorized_submitter_id,
    external_registration_number = external_reference_id,
    submission_payload_digest_sha256 = request_digest,
    decided_at = responded_at;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.government_submission_jobs
        WHERE target_system IS NULL OR submission_status IS NULL
           OR authorized_notary_id IS NULL OR submission_payload_digest_sha256 IS NULL
    ) THEN
        RAISE EXCEPTION 'NOTARY_SEAM_BACKFILL_REQUIRED: Legacy submission rows require a real request_digest before this migration can continue.';
    END IF;
END;
$$;

ALTER TABLE public.government_submission_jobs
    ALTER COLUMN target_system SET NOT NULL,
    ALTER COLUMN submission_status SET NOT NULL,
    ALTER COLUMN submission_status SET DEFAULT 'DRAFT',
    ALTER COLUMN authorized_notary_id SET NOT NULL,
    ALTER COLUMN submission_payload_digest_sha256 SET NOT NULL,
    ADD CONSTRAINT fk_government_jobs_authorized_notary
        FOREIGN KEY (authorized_notary_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
    ADD CONSTRAINT chk_government_jobs_payload_digest
        CHECK (submission_payload_digest_sha256 ~ '^[0-9a-f]{64}$'),
    ADD CONSTRAINT chk_government_jobs_decision_time
        CHECK (decided_at IS NULL OR submitted_at IS NOT NULL);

CREATE OR REPLACE FUNCTION public.fn_sync_notary_submission_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_system IS NULL THEN
            NEW.target_system := CASE NEW.system WHEN 'OSS' THEN 'OSS_RBA'::public.notary_submission_target_system ELSE NEW.system::public.notary_submission_target_system END;
        ELSE
            NEW.system := CASE NEW.target_system WHEN 'OSS_RBA' THEN 'OSS' ELSE NEW.target_system::TEXT END;
        END IF;
        IF NEW.submission_status IS NULL OR (NEW.submission_status = 'DRAFT' AND NEW.status <> 'PENDING') THEN
            NEW.submission_status := CASE WHEN NEW.status = 'SUBMITTED' THEN 'SUBMITTED'::public.notary_submission_status WHEN NEW.status = 'ACCEPTED' THEN 'APPROVED'::public.notary_submission_status WHEN NEW.status IN ('REJECTED', 'FAILED', 'CANCELLED') THEN 'REJECTED'::public.notary_submission_status ELSE 'DRAFT'::public.notary_submission_status END;
        ELSE
            NEW.status := CASE NEW.submission_status WHEN 'APPROVED' THEN 'ACCEPTED' WHEN 'DRAFT' THEN 'PENDING' ELSE NEW.submission_status::TEXT END;
        END IF;
        NEW.authorized_notary_id := coalesce(NEW.authorized_notary_id, NEW.authorized_submitter_id);
        NEW.authorized_submitter_id := coalesce(NEW.authorized_submitter_id, NEW.authorized_notary_id);
        NEW.submission_payload_digest_sha256 := coalesce(NEW.submission_payload_digest_sha256, NEW.request_digest);
        NEW.request_digest := coalesce(NEW.request_digest, NEW.submission_payload_digest_sha256);
        NEW.external_registration_number := coalesce(NEW.external_registration_number, NEW.external_reference_id);
        NEW.external_reference_id := coalesce(NEW.external_reference_id, NEW.external_registration_number);
        NEW.decided_at := coalesce(NEW.decided_at, NEW.responded_at);
        NEW.responded_at := coalesce(NEW.responded_at, NEW.decided_at);
        IF NEW.idempotency_key IS NULL THEN
            NEW.idempotency_key := encode(extensions.digest(concat_ws('|', NEW.case_id::TEXT, NEW.target_system::TEXT, NEW.authorized_notary_id::TEXT, NEW.submission_payload_digest_sha256), 'sha256'), 'hex');
        END IF;
    ELSE
        IF NEW.target_system IS DISTINCT FROM OLD.target_system THEN NEW.system := CASE NEW.target_system WHEN 'OSS_RBA' THEN 'OSS' ELSE NEW.target_system::TEXT END;
        ELSIF NEW.system IS DISTINCT FROM OLD.system THEN NEW.target_system := CASE NEW.system WHEN 'OSS' THEN 'OSS_RBA'::public.notary_submission_target_system ELSE NEW.system::public.notary_submission_target_system END; END IF;
        IF NEW.submission_status IS DISTINCT FROM OLD.submission_status THEN NEW.status := CASE NEW.submission_status WHEN 'APPROVED' THEN 'ACCEPTED' WHEN 'DRAFT' THEN 'PENDING' ELSE NEW.submission_status::TEXT END;
        ELSIF NEW.status IS DISTINCT FROM OLD.status THEN NEW.submission_status := CASE WHEN NEW.status = 'SUBMITTED' THEN 'SUBMITTED'::public.notary_submission_status WHEN NEW.status = 'ACCEPTED' THEN 'APPROVED'::public.notary_submission_status WHEN NEW.status IN ('REJECTED', 'FAILED', 'CANCELLED') THEN 'REJECTED'::public.notary_submission_status ELSE 'DRAFT'::public.notary_submission_status END; END IF;
        IF NEW.authorized_notary_id IS DISTINCT FROM OLD.authorized_notary_id THEN NEW.authorized_submitter_id := NEW.authorized_notary_id;
        ELSIF NEW.authorized_submitter_id IS DISTINCT FROM OLD.authorized_submitter_id THEN NEW.authorized_notary_id := NEW.authorized_submitter_id; END IF;
        IF NEW.submission_payload_digest_sha256 IS DISTINCT FROM OLD.submission_payload_digest_sha256 THEN NEW.request_digest := NEW.submission_payload_digest_sha256;
        ELSIF NEW.request_digest IS DISTINCT FROM OLD.request_digest THEN NEW.submission_payload_digest_sha256 := NEW.request_digest; END IF;
        IF NEW.external_registration_number IS DISTINCT FROM OLD.external_registration_number THEN NEW.external_reference_id := NEW.external_registration_number;
        ELSIF NEW.external_reference_id IS DISTINCT FROM OLD.external_reference_id THEN NEW.external_registration_number := NEW.external_reference_id; END IF;
        IF NEW.decided_at IS DISTINCT FROM OLD.decided_at THEN NEW.responded_at := NEW.decided_at;
        ELSIF NEW.responded_at IS DISTINCT FROM OLD.responded_at THEN NEW.decided_at := NEW.responded_at; END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_notary_submission_contract
BEFORE INSERT OR UPDATE ON public.government_submission_jobs
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_notary_submission_contract();

ALTER TABLE public.document_integrity_anchors
    ADD COLUMN case_id UUID,
    ADD CONSTRAINT fk_document_integrity_anchor_case
        FOREIGN KEY (case_id) REFERENCES public.corporate_service_cases(case_id) ON DELETE RESTRICT;

ALTER TABLE public.document_integrity_anchors DROP CONSTRAINT chk_integrity_document_type;
ALTER TABLE public.document_integrity_anchors ADD CONSTRAINT chk_integrity_document_type
    CHECK (document_type IN ('LEGAL_OPINION', 'CORPORATE_DEED', 'MOU', 'NIB', 'KEMENKUMHAM_DECISION'));
ALTER TABLE public.document_integrity_anchors ADD CONSTRAINT chk_corporate_anchor_case
    CHECK (document_type NOT IN ('CORPORATE_DEED', 'NIB', 'KEMENKUMHAM_DECISION') OR case_id IS NOT NULL) NOT VALID;

ALTER TABLE public.government_submission_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_submission_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_integrity_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_integrity_anchors FORCE ROW LEVEL SECURITY;

DROP POLICY rls_government_jobs_professional_read ON public.government_submission_jobs;

CREATE POLICY rls_government_jobs_assigned_notary_read
ON public.government_submission_jobs FOR SELECT TO authenticated
USING (authorized_notary_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    WHERE cases.case_id = government_submission_jobs.case_id AND cases.assigned_notary_id = auth.uid()
));
CREATE POLICY rls_government_jobs_client_read
ON public.government_submission_jobs FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
    WHERE cases.case_id = government_submission_jobs.case_id AND orders.client_id = auth.uid()
));
CREATE POLICY rls_government_jobs_assigned_notary_insert
ON public.government_submission_jobs FOR INSERT TO authenticated
WITH CHECK (authorized_notary_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    WHERE cases.case_id = government_submission_jobs.case_id AND cases.assigned_notary_id = auth.uid()
));
CREATE POLICY rls_government_jobs_assigned_notary_update
ON public.government_submission_jobs FOR UPDATE TO authenticated
USING (authorized_notary_id = auth.uid())
WITH CHECK (authorized_notary_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    WHERE cases.case_id = government_submission_jobs.case_id AND cases.assigned_notary_id = auth.uid()
));

CREATE POLICY rls_document_anchors_assigned_notary_read
ON public.document_integrity_anchors FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    WHERE cases.case_id = document_integrity_anchors.case_id AND cases.assigned_notary_id = auth.uid()
));
CREATE POLICY rls_document_anchors_client_read
ON public.document_integrity_anchors FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
    WHERE cases.case_id = document_integrity_anchors.case_id AND orders.client_id = auth.uid()
));
CREATE POLICY rls_document_anchors_assigned_notary_insert
ON public.document_integrity_anchors FOR INSERT TO authenticated
WITH CHECK (case_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.corporate_service_cases AS cases
    WHERE cases.case_id = document_integrity_anchors.case_id AND cases.assigned_notary_id = auth.uid()
));

REVOKE ALL ON FUNCTION public.fn_sync_notary_submission_contract() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_sync_notary_submission_contract() TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.government_submission_jobs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.document_integrity_anchors TO authenticated;

COMMENT ON COLUMN public.document_integrity_anchors.case_id IS
    'Corporate-case ownership seam used for strict assigned-notary and client-owner RLS. Corporate deed, NIB, and Kemenkumham decision anchors require this value.';
