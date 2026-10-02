-- ============================================================================
-- P2-B4: expand-only corporate concierge and beneficial ownership seam
-- PostgreSQL 17 / Supabase
-- Existing booking_sessions and escrow_transactions are intentionally untouched.
-- ============================================================================

CREATE TABLE public.corporate_service_cases (
    case_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    order_id UUID NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    proposed_name VARCHAR(256) NOT NULL,
    domicile_city VARCHAR(128) NOT NULL,
    domicile_province VARCHAR(128) NOT NULL,
    kbli_snapshot JSONB NOT NULL DEFAULT '[]'::JSONB,
    authorized_capital_idr NUMERIC(18,2),
    paid_up_capital_idr NUMERIC(18,2),
    current_stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    target_sla_at TIMESTAMPTZ,
    legal_scope_version VARCHAR(32) NOT NULL,
    assigned_notary_id UUID,
    assigned_compliance_reviewer_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_corporate_service_cases_order UNIQUE (order_id),
    CONSTRAINT fk_corporate_cases_order FOREIGN KEY (order_id)
        REFERENCES public.service_orders(order_id) ON DELETE RESTRICT,
    CONSTRAINT fk_corporate_cases_notary FOREIGN KEY (assigned_notary_id)
        REFERENCES public.users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT fk_corporate_cases_compliance_reviewer FOREIGN KEY (assigned_compliance_reviewer_id)
        REFERENCES public.users_admin(admin_id) ON DELETE RESTRICT,
    CONSTRAINT chk_corporate_cases_entity_type CHECK (
        entity_type IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV')
    ),
    CONSTRAINT chk_corporate_cases_kbli_array CHECK (
        jsonb_typeof(kbli_snapshot) = 'array'
    ),
    CONSTRAINT chk_corporate_cases_capital CHECK (
        (authorized_capital_idr IS NULL OR authorized_capital_idr >= 0)
        AND (paid_up_capital_idr IS NULL OR paid_up_capital_idr >= 0)
        AND (authorized_capital_idr IS NULL OR paid_up_capital_idr IS NULL
             OR paid_up_capital_idr <= authorized_capital_idr)
    ),
    CONSTRAINT chk_corporate_cases_stage CHECK (current_stage IN (
        'DRAFT', 'IDENTITY_PENDING', 'CDD_REVIEW', 'DOCUMENTS_PENDING',
        'NOTARY_REVIEW', 'AHU_SUBMITTED', 'AHU_APPROVED', 'OSS_PENDING',
        'NIB_ISSUED', 'COMPLETED', 'COMPLIANCE_HOLD',
        'CUSTOMER_ACTION_REQUIRED', 'CANCELLED', 'AHU_REJECTED', 'OSS_REJECTED'
    ))
);

COMMENT ON COLUMN public.corporate_service_cases.assigned_notary_id IS
    'Compatibility seam to the current verified professional registry (users_advocate) until a dedicated notary profile registry is expanded.';
COMMENT ON TABLE public.corporate_service_cases IS
    'Client-readable corporate workflow snapshot. Never add STR, LTKM, goAML, red-flag, or tipping-off state here.';

CREATE TABLE public.corporate_parties (
    party_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    case_id UUID NOT NULL,
    party_type VARCHAR(20) NOT NULL DEFAULT 'NATURAL_PERSON',
    role VARCHAR(24) NOT NULL,
    display_name VARCHAR(256) NOT NULL,
    identity_reference VARCHAR(128) NOT NULL,
    ownership_percentage NUMERIC(5,2),
    voting_percentage NUMERIC(5,2),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_corporate_parties_case FOREIGN KEY (case_id)
        REFERENCES public.corporate_service_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT chk_corporate_parties_type CHECK (
        party_type IN ('NATURAL_PERSON', 'LEGAL_ENTITY')
    ),
    CONSTRAINT chk_corporate_parties_role CHECK (role IN (
        'FOUNDER', 'SHAREHOLDER', 'DIRECTOR', 'COMMISSIONER',
        'ACTIVE_PARTNER', 'PASSIVE_PARTNER'
    )),
    CONSTRAINT chk_corporate_parties_ownership CHECK (
        ownership_percentage IS NULL OR ownership_percentage BETWEEN 0 AND 100
    ),
    CONSTRAINT chk_corporate_parties_voting CHECK (
        voting_percentage IS NULL OR voting_percentage BETWEEN 0 AND 100
    ),
    CONSTRAINT chk_corporate_parties_effective_dates CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

COMMENT ON COLUMN public.corporate_parties.identity_reference IS
    'Opaque reference to protected identity evidence; raw NIK, KTP image, biometric, and government credentials are prohibited.';

CREATE TABLE public.beneficial_owners (
    beneficial_owner_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    case_id UUID NOT NULL,
    declaration_version SMALLINT NOT NULL DEFAULT 1,
    person_type VARCHAR(20) NOT NULL DEFAULT 'NATURAL_PERSON',
    natural_person_name VARCHAR(256) NOT NULL,
    identity_reference VARCHAR(128) NOT NULL,
    control_basis VARCHAR(32) NOT NULL,
    percentage NUMERIC(5,2),
    evidence_digest CHAR(64) NOT NULL,
    verification_status VARCHAR(24) NOT NULL DEFAULT 'DECLARED',
    reviewer_id UUID,
    reviewer_role VARCHAR(24),
    verified_at TIMESTAMPTZ,
    ahu_submission_reference VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_beneficial_owners_case FOREIGN KEY (case_id)
        REFERENCES public.corporate_service_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT chk_beneficial_owners_natural_person_only CHECK (
        person_type = 'NATURAL_PERSON'
    ),
    CONSTRAINT chk_beneficial_owners_version CHECK (declaration_version > 0),
    CONSTRAINT chk_beneficial_owners_control_basis CHECK (control_basis IN (
        'OWNERSHIP', 'VOTING_RIGHTS', 'APPOINTMENT_REMOVAL',
        'EFFECTIVE_CONTROL', 'BENEFICIAL_ENTITLEMENT'
    )),
    CONSTRAINT chk_beneficial_owners_percentage CHECK (
        percentage IS NULL OR percentage BETWEEN 0 AND 100
    ),
    CONSTRAINT chk_beneficial_owners_digest CHECK (
        evidence_digest ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT chk_beneficial_owners_verification CHECK (verification_status IN (
        'DECLARED', 'PENDING', 'HUMAN_REVIEW', 'VERIFIED', 'REJECTED'
    )),
    CONSTRAINT chk_beneficial_owners_reviewer_role CHECK (
        (reviewer_id IS NULL AND reviewer_role IS NULL)
        OR (reviewer_id IS NOT NULL AND reviewer_role IN (
            'ADVOCATE', 'NOTARY', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN'
        ))
    ),
    CONSTRAINT chk_beneficial_owners_verified_at CHECK (
        (verification_status = 'VERIFIED' AND reviewer_id IS NOT NULL AND verified_at IS NOT NULL)
        OR verification_status <> 'VERIFIED'
    )
);

COMMENT ON TABLE public.beneficial_owners IS
    'Perpres 13/2018 declaration seam. BO records are natural persons only and evidence is stored by SHA-256 digest.';
COMMENT ON COLUMN public.beneficial_owners.identity_reference IS
    'Opaque identity-evidence reference. Never store raw NIK, KTP image, biometric, or credential in this column.';

CREATE TABLE public.compliance_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    case_id UUID NOT NULL,
    assessment_level VARCHAR(8) NOT NULL,
    pep_check_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sanctions_check_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    risk_score NUMERIC(5,2),
    rules_version VARCHAR(32) NOT NULL,
    reviewer_decision VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    reviewer_rationale TEXT,
    reviewer_id UUID NOT NULL,
    reviewer_role VARCHAR(24) NOT NULL,
    assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_compliance_assessments_case FOREIGN KEY (case_id)
        REFERENCES public.corporate_service_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT chk_compliance_assessments_level CHECK (
        assessment_level IN ('CDD', 'EDD')
    ),
    CONSTRAINT chk_compliance_assessments_pep CHECK (
        pep_check_status IN ('PENDING', 'NO_MATCH', 'POTENTIAL_MATCH', 'CONFIRMED_MATCH', 'NOT_APPLICABLE')
    ),
    CONSTRAINT chk_compliance_assessments_sanctions CHECK (
        sanctions_check_status IN ('PENDING', 'NO_MATCH', 'POTENTIAL_MATCH', 'CONFIRMED_MATCH', 'NOT_APPLICABLE')
    ),
    CONSTRAINT chk_compliance_assessments_risk_score CHECK (
        risk_score IS NULL OR risk_score BETWEEN 0 AND 100
    ),
    CONSTRAINT chk_compliance_assessments_decision CHECK (
        reviewer_decision IN ('PENDING', 'APPROVED', 'EDD_REQUIRED', 'CUSTOMER_ACTION_REQUIRED', 'DECLINED')
    ),
    CONSTRAINT chk_compliance_assessments_reviewer_role CHECK (
        reviewer_role IN ('ADVOCATE', 'NOTARY', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    ),
    CONSTRAINT chk_compliance_assessments_assessed_at CHECK (
        (reviewer_decision = 'PENDING' AND assessed_at IS NULL)
        OR (reviewer_decision <> 'PENDING' AND assessed_at IS NOT NULL)
    )
);

COMMENT ON TABLE public.compliance_assessments IS
    'Restricted CDD/EDD work product. Clients have no policy or grant path. STR/LTKM/goAML status and references are intentionally not modeled to enforce anti-tipping-off.';

CREATE TABLE public.government_submission_jobs (
    job_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    case_id UUID NOT NULL,
    system VARCHAR(16) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    authorized_submitter_id UUID NOT NULL,
    external_reference_id VARCHAR(128),
    request_digest CHAR(64),
    response_digest CHAR(64),
    idempotency_key VARCHAR(128) NOT NULL,
    attempt_count SMALLINT NOT NULL DEFAULT 0,
    last_error_code VARCHAR(64),
    submitted_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_government_submission_jobs_case FOREIGN KEY (case_id)
        REFERENCES public.corporate_service_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT fk_government_submission_jobs_submitter FOREIGN KEY (authorized_submitter_id)
        REFERENCES public.users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT uq_government_submission_jobs_idempotency UNIQUE (idempotency_key),
    CONSTRAINT chk_government_submission_jobs_system CHECK (
        system IN ('AHU_SABH', 'AHU_SABU', 'AHU_BO', 'OSS')
    ),
    CONSTRAINT chk_government_submission_jobs_status CHECK (status IN (
        'PENDING', 'READY', 'SUBMITTED', 'ACCEPTED', 'REJECTED',
        'RETRY_PENDING', 'FAILED', 'CANCELLED'
    )),
    CONSTRAINT chk_government_submission_jobs_digests CHECK (
        (request_digest IS NULL OR request_digest ~ '^[0-9a-f]{64}$')
        AND (response_digest IS NULL OR response_digest ~ '^[0-9a-f]{64}$')
    ),
    CONSTRAINT chk_government_submission_jobs_attempts CHECK (attempt_count >= 0),
    CONSTRAINT chk_government_submission_jobs_timestamps CHECK (
        (submitted_at IS NULL OR status NOT IN ('PENDING', 'READY'))
        AND (responded_at IS NULL OR submitted_at IS NOT NULL)
    )
);

COMMENT ON TABLE public.government_submission_jobs IS
    'AHU/OSS submission metadata only. Credentials, API keys, access tokens, cookies, raw request bodies, and raw response bodies are prohibited.';

CREATE INDEX idx_corporate_cases_stage ON public.corporate_service_cases(current_stage, updated_at DESC);
CREATE INDEX idx_corporate_cases_notary ON public.corporate_service_cases(assigned_notary_id, current_stage)
    WHERE assigned_notary_id IS NOT NULL;
CREATE INDEX idx_corporate_cases_reviewer ON public.corporate_service_cases(assigned_compliance_reviewer_id, current_stage)
    WHERE assigned_compliance_reviewer_id IS NOT NULL;
CREATE INDEX idx_corporate_parties_case_role ON public.corporate_parties(case_id, role, effective_from DESC);
CREATE INDEX idx_beneficial_owners_case_status ON public.beneficial_owners(case_id, verification_status, declaration_version DESC);
CREATE INDEX idx_beneficial_owners_reviewer ON public.beneficial_owners(reviewer_id, verification_status)
    WHERE reviewer_id IS NOT NULL;
CREATE INDEX idx_beneficial_owners_evidence_digest ON public.beneficial_owners(evidence_digest);
CREATE INDEX idx_compliance_assessments_case_created ON public.compliance_assessments(case_id, created_at DESC);
CREATE INDEX idx_compliance_assessments_reviewer ON public.compliance_assessments(reviewer_id, reviewer_decision);
CREATE INDEX idx_government_jobs_case_system ON public.government_submission_jobs(case_id, system, created_at DESC);
CREATE INDEX idx_government_jobs_external_reference ON public.government_submission_jobs(system, external_reference_id)
    WHERE external_reference_id IS NOT NULL;
CREATE INDEX idx_government_jobs_retry ON public.government_submission_jobs(status, next_retry_at)
    WHERE status = 'RETRY_PENDING';

CREATE OR REPLACE FUNCTION public.fn_validate_corporate_service_case_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_service_type VARCHAR(32);
BEGIN
    SELECT service_type
    INTO v_service_type
    FROM public.service_orders
    WHERE order_id = NEW.order_id
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_ORDER_NOT_FOUND: Service order does not exist.';
    END IF;
    IF v_service_type NOT IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV')
       OR v_service_type <> NEW.entity_type THEN
        RAISE EXCEPTION 'CORPORATE_ORDER_TYPE_MISMATCH: order service_type must equal entity_type.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_corporate_service_case_order
BEFORE INSERT OR UPDATE OF order_id, entity_type ON public.corporate_service_cases
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_corporate_service_case_order();

CREATE OR REPLACE FUNCTION public.fn_touch_corporate_record_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_corporate_service_cases
BEFORE UPDATE ON public.corporate_service_cases
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_record_updated_at();
CREATE TRIGGER trg_touch_corporate_parties
BEFORE UPDATE ON public.corporate_parties
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_record_updated_at();
CREATE TRIGGER trg_touch_beneficial_owners
BEFORE UPDATE ON public.beneficial_owners
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_record_updated_at();
CREATE TRIGGER trg_touch_compliance_assessments
BEFORE UPDATE ON public.compliance_assessments
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_record_updated_at();
CREATE TRIGGER trg_touch_government_submission_jobs
BEFORE UPDATE ON public.government_submission_jobs
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_record_updated_at();

CREATE OR REPLACE FUNCTION public.fn_guard_corporate_case_stage_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.current_stage IS DISTINCT FROM OLD.current_stage
       AND coalesce(current_setting('app.corporate_stage_transition', true), '') <> 'allowed' THEN
        RAISE EXCEPTION 'CORPORATE_STAGE_RPC_REQUIRED: use fn_transition_corporate_service_case.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_corporate_case_stage_mutation
BEFORE UPDATE OF current_stage ON public.corporate_service_cases
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_corporate_case_stage_mutation();

CREATE OR REPLACE FUNCTION public.fn_transition_corporate_service_case(
    p_case_id UUID,
    p_expected_stage VARCHAR,
    p_next_stage VARCHAR
)
RETURNS public.corporate_service_cases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_case public.corporate_service_cases%ROWTYPE;
    v_allowed BOOLEAN := false;
BEGIN
    SELECT * INTO v_case
    FROM public.corporate_service_cases
    WHERE case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_CASE_NOT_FOUND: Case does not exist.';
    END IF;
    IF v_case.current_stage <> p_expected_stage THEN
        RAISE EXCEPTION 'CORPORATE_STAGE_CONFLICT: expected %, found %.',
            p_expected_stage, v_case.current_stage;
    END IF;

    v_allowed := CASE v_case.current_stage
        WHEN 'DRAFT' THEN p_next_stage IN ('IDENTITY_PENDING', 'CANCELLED')
        WHEN 'IDENTITY_PENDING' THEN p_next_stage IN ('CDD_REVIEW', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'CDD_REVIEW' THEN p_next_stage IN ('DOCUMENTS_PENDING', 'COMPLIANCE_HOLD', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'COMPLIANCE_HOLD' THEN p_next_stage IN ('CDD_REVIEW', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'CUSTOMER_ACTION_REQUIRED' THEN p_next_stage IN ('IDENTITY_PENDING', 'CDD_REVIEW', 'DOCUMENTS_PENDING', 'NOTARY_REVIEW', 'OSS_PENDING', 'CANCELLED')
        WHEN 'DOCUMENTS_PENDING' THEN p_next_stage IN ('NOTARY_REVIEW', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'NOTARY_REVIEW' THEN p_next_stage IN ('AHU_SUBMITTED', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'AHU_SUBMITTED' THEN p_next_stage IN ('AHU_APPROVED', 'AHU_REJECTED')
        WHEN 'AHU_REJECTED' THEN p_next_stage IN ('NOTARY_REVIEW', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'AHU_APPROVED' THEN p_next_stage = 'OSS_PENDING'
        WHEN 'OSS_PENDING' THEN p_next_stage IN ('NIB_ISSUED', 'OSS_REJECTED', 'CUSTOMER_ACTION_REQUIRED')
        WHEN 'OSS_REJECTED' THEN p_next_stage IN ('OSS_PENDING', 'CUSTOMER_ACTION_REQUIRED', 'CANCELLED')
        WHEN 'NIB_ISSUED' THEN p_next_stage = 'COMPLETED'
        ELSE false
    END;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'CORPORATE_STAGE_TRANSITION_FORBIDDEN: % -> %.',
            v_case.current_stage, p_next_stage;
    END IF;

    PERFORM set_config('app.corporate_stage_transition', 'allowed', true);
    UPDATE public.corporate_service_cases
    SET current_stage = p_next_stage
    WHERE case_id = p_case_id
    RETURNING * INTO v_case;
    RETURN v_case;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_transition_corporate_service_case(UUID, VARCHAR, VARCHAR)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_transition_corporate_service_case(UUID, VARCHAR, VARCHAR)
    TO service_role;

ALTER TABLE public.corporate_service_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_service_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_parties FORCE ROW LEVEL SECURITY;
ALTER TABLE public.beneficial_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficial_owners FORCE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.government_submission_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_submission_jobs FORCE ROW LEVEL SECURITY;

CREATE POLICY rls_corporate_cases_participant_read
ON public.corporate_service_cases FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_orders AS orders
        WHERE orders.order_id = corporate_service_cases.order_id
          AND (
              orders.client_id = auth.uid()
              OR orders.assigned_professional_id = auth.uid()
          )
    )
    OR assigned_notary_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users_admin AS admins
        WHERE admins.admin_id = auth.uid()
          AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    )
);

CREATE POLICY rls_corporate_parties_participant_read
ON public.corporate_parties FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = corporate_parties.case_id
          AND (
              orders.client_id = auth.uid()
              OR orders.assigned_professional_id = auth.uid()
              OR cases.assigned_notary_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

CREATE POLICY rls_beneficial_owners_participant_read
ON public.beneficial_owners FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = beneficial_owners.case_id
          AND (
              orders.client_id = auth.uid()
              OR orders.assigned_professional_id = auth.uid()
              OR cases.assigned_notary_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

CREATE POLICY rls_compliance_assessments_restricted_read
ON public.compliance_assessments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = compliance_assessments.case_id
          AND (
              orders.assigned_professional_id = auth.uid()
              OR cases.assigned_notary_id = auth.uid()
              OR cases.assigned_compliance_reviewer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

CREATE POLICY rls_compliance_assessments_restricted_insert
ON public.compliance_assessments FOR INSERT TO authenticated
WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = compliance_assessments.case_id
          AND (
              (orders.assigned_professional_id = auth.uid()
                  AND compliance_assessments.reviewer_role = 'ADVOCATE')
              OR (cases.assigned_notary_id = auth.uid()
                  AND compliance_assessments.reviewer_role = 'NOTARY')
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
                    AND admins.role_group = compliance_assessments.reviewer_role
              )
          )
    )
);

CREATE POLICY rls_compliance_assessments_restricted_update
ON public.compliance_assessments FOR UPDATE TO authenticated
USING (
    reviewer_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = compliance_assessments.case_id
          AND (
              orders.assigned_professional_id = auth.uid()
              OR cases.assigned_notary_id = auth.uid()
              OR cases.assigned_compliance_reviewer_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
)
WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = compliance_assessments.case_id
          AND (
              (orders.assigned_professional_id = auth.uid()
                  AND compliance_assessments.reviewer_role = 'ADVOCATE')
              OR (cases.assigned_notary_id = auth.uid()
                  AND compliance_assessments.reviewer_role = 'NOTARY')
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
                    AND admins.role_group = compliance_assessments.reviewer_role
              )
          )
    )
);

CREATE POLICY rls_government_jobs_professional_read
ON public.government_submission_jobs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders ON orders.order_id = cases.order_id
        WHERE cases.case_id = government_submission_jobs.case_id
          AND (
              orders.assigned_professional_id = auth.uid()
              OR cases.assigned_notary_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admins
                  WHERE admins.admin_id = auth.uid()
                    AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

REVOKE ALL ON TABLE public.corporate_service_cases FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.corporate_parties FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.beneficial_owners FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.compliance_assessments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.government_submission_jobs FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.corporate_service_cases TO authenticated;
GRANT SELECT ON TABLE public.corporate_parties TO authenticated;
GRANT SELECT ON TABLE public.beneficial_owners TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.compliance_assessments TO authenticated;
GRANT SELECT ON TABLE public.government_submission_jobs TO authenticated;

GRANT ALL ON TABLE public.corporate_service_cases TO service_role;
GRANT ALL ON TABLE public.corporate_parties TO service_role;
GRANT ALL ON TABLE public.beneficial_owners TO service_role;
GRANT ALL ON TABLE public.compliance_assessments TO service_role;
GRANT ALL ON TABLE public.government_submission_jobs TO service_role;

-- End P2-B4. No ALTER/DROP/UPDATE targets booking_sessions or escrow_transactions.
