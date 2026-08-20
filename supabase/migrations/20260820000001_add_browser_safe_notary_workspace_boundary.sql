-- ============================================================================
-- Batch 3.C: Browser-safe Notary Assignment and CDD Approval Workspace Boundary
-- PostgreSQL 17 / Supabase
-- ============================================================================

-- 1. Minimal Verified Notary Qualification Profile Registry
CREATE TABLE IF NOT EXISTS public.notary_profiles (
    notary_id UUID PRIMARY KEY,
    license_number VARCHAR(128) NOT NULL,
    jurisdiction_city VARCHAR(128) NOT NULL,
    jurisdiction_province VARCHAR(128) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    verified_by_admin_id UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_notary_profiles_advocate FOREIGN KEY (notary_id)
        REFERENCES public.users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT fk_notary_profiles_admin FOREIGN KEY (verified_by_admin_id)
        REFERENCES public.users_admin(admin_id) ON DELETE SET NULL,
    CONSTRAINT chk_notary_profiles_status CHECK (
        status IN ('PENDING', 'VERIFIED_ACTIVE', 'SUSPENDED', 'REVOKED')
    ),
    CONSTRAINT chk_notary_profiles_verified CHECK (
        (status = 'VERIFIED_ACTIVE' AND verified_by_admin_id IS NOT NULL AND verified_at IS NOT NULL)
        OR status <> 'VERIFIED_ACTIVE'
    )
);

COMMENT ON TABLE public.notary_profiles IS
    'Verified notary qualification and licensing registry. Browser mutation is strictly forbidden.';

CREATE INDEX IF NOT EXISTS idx_notary_profiles_status ON public.notary_profiles(status);

CREATE OR REPLACE FUNCTION public.fn_touch_notary_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_notary_profiles ON public.notary_profiles;
CREATE TRIGGER trg_touch_notary_profiles
BEFORE UPDATE ON public.notary_profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_notary_profiles();

ALTER TABLE public.notary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_notary_profiles_admin_read ON public.notary_profiles;
CREATE POLICY rls_notary_profiles_admin_read
ON public.notary_profiles FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users_admin AS admins
        WHERE admins.admin_id = auth.uid()
          AND admins.is_active = true
          AND admins.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    )
);

DROP POLICY IF EXISTS rls_notary_profiles_self_read ON public.notary_profiles;
CREATE POLICY rls_notary_profiles_self_read
ON public.notary_profiles FOR SELECT TO authenticated
USING (notary_id = auth.uid());

REVOKE ALL ON TABLE public.notary_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.notary_profiles TO authenticated;
GRANT ALL ON TABLE public.notary_profiles TO service_role;


-- 2. Notary Workspace Idempotency Records
CREATE TABLE IF NOT EXISTS public.notary_workspace_idempotency_records (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    operation_type VARCHAR(32) NOT NULL,
    case_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    payload_digest CHAR(64) NOT NULL,
    result_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_notary_idempotency_case FOREIGN KEY (case_id)
        REFERENCES public.corporate_service_cases(case_id) ON DELETE CASCADE,
    CONSTRAINT chk_notary_idempotency_op CHECK (
        operation_type IN ('ASSIGN_NOTARY', 'APPROVE_CDD')
    ),
    CONSTRAINT chk_notary_idempotency_digest CHECK (
        payload_digest ~ '^[0-9a-f]{64}$'
    )
);

ALTER TABLE public.notary_workspace_idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_workspace_idempotency_records FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notary_workspace_idempotency_records FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.notary_workspace_idempotency_records TO service_role;


-- 3. Atomic Notary Assignment RPC
CREATE OR REPLACE FUNCTION public.fn_assign_corporate_notary_atomic(
    p_case_id UUID,
    p_notary_id UUID,
    p_admin_id UUID,
    p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_admin public.users_admin%ROWTYPE;
    v_notary_profile public.notary_profiles%ROWTYPE;
    v_advocate public.users_advocate%ROWTYPE;
    v_case public.corporate_service_cases%ROWTYPE;
    v_order public.service_orders%ROWTYPE;
    v_existing_idempotency public.notary_workspace_idempotency_records%ROWTYPE;
    v_payload_digest CHAR(64);
    v_result JSONB;
BEGIN
    IF p_case_id IS NULL OR p_notary_id IS NULL OR p_admin_id IS NULL OR p_idempotency_key IS NULL OR trim(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS';
    END IF;

    -- Validate Admin identity and role
    SELECT * INTO v_admin
    FROM public.users_admin
    WHERE admin_id = p_admin_id AND is_active = true
    FOR KEY SHARE;

    IF NOT FOUND OR v_admin.role_group NOT IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN') THEN
        RAISE EXCEPTION 'FORBIDDEN_ADMIN_ROLE_REQUIRED';
    END IF;

    -- Validate Notary profile qualification
    SELECT * INTO v_notary_profile
    FROM public.notary_profiles
    WHERE notary_id = p_notary_id AND status = 'VERIFIED_ACTIVE'
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOTARY_NOT_VERIFIED';
    END IF;

    -- Validate advocate account verification
    SELECT * INTO v_advocate
    FROM public.users_advocate
    WHERE advocate_id = p_notary_id AND is_verified = true
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOTARY_NOT_VERIFIED';
    END IF;

    -- Compute payload digest
    v_payload_digest := encode(extensions.digest(concat_ws('|', p_case_id::TEXT, p_notary_id::TEXT, p_admin_id::TEXT), 'sha256'), 'hex');

    -- Check Idempotency Record
    SELECT * INTO v_existing_idempotency
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing_idempotency.payload_digest = v_payload_digest THEN
            RETURN v_existing_idempotency.result_payload || '{"replayed": true}'::JSONB;
        ELSE
            RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';
        END IF;
    END IF;

    -- Lock Case row deterministically
    SELECT * INTO v_case
    FROM public.corporate_service_cases
    WHERE case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND';
    END IF;

    IF v_case.current_stage = 'CANCELLED' THEN
        RAISE EXCEPTION 'CASE_CANCELLED';
    END IF;

    -- Lock Service Order & verify escrow state
    SELECT * INTO v_order
    FROM public.service_orders
    WHERE order_id = v_case.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND';
    END IF;

    IF v_order.escrow_status <> 'HELD_IN_ESCROW' OR v_order.funds_locked_at IS NULL THEN
        RAISE EXCEPTION 'ESCROW_NOT_HELD';
    END IF;

    -- Handle Case Assignment Replay vs Conflict
    IF v_case.assigned_notary_id IS NOT NULL THEN
        IF v_case.assigned_notary_id = p_notary_id THEN
            v_result := jsonb_build_object(
                'case_id', p_case_id,
                'assigned_notary_id', p_notary_id,
                'replayed', true
            );
            RETURN v_result;
        ELSE
            RAISE EXCEPTION 'ASSIGNMENT_CONFLICT';
        END IF;
    END IF;

    IF v_case.current_stage <> 'ESCROW_LOCKED' THEN
        RAISE EXCEPTION 'STAGE_CONFLICT';
    END IF;

    -- Execute Atomic Assignment
    UPDATE public.corporate_service_cases
    SET assigned_notary_id = p_notary_id,
        current_stage = 'CDD_REVIEW',
        updated_at = clock_timestamp()
    WHERE case_id = p_case_id;

    v_result := jsonb_build_object(
        'case_id', p_case_id,
        'assigned_notary_id', p_notary_id,
        'current_stage', 'CDD_REVIEW',
        'replayed', false
    );

    INSERT INTO public.notary_workspace_idempotency_records (
        idempotency_key,
        operation_type,
        case_id,
        actor_id,
        payload_digest,
        result_payload
    ) VALUES (
        p_idempotency_key,
        'ASSIGN_NOTARY',
        p_case_id,
        p_admin_id,
        v_payload_digest,
        v_result
    );

    RETURN v_result;
END;
$$;


-- 4. Atomic CDD Approval and Stage Transition RPC
CREATE OR REPLACE FUNCTION public.fn_approve_notary_cdd_atomic(
    p_case_id UUID,
    p_assessment_id UUID,
    p_notary_id UUID,
    p_rules_version VARCHAR(32),
    p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_case public.corporate_service_cases%ROWTYPE;
    v_notary_profile public.notary_profiles%ROWTYPE;
    v_assessment public.compliance_assessments%ROWTYPE;
    v_existing_idempotency public.notary_workspace_idempotency_records%ROWTYPE;
    v_unverified_bo_count INT;
    v_total_bo_count INT;
    v_payload_digest CHAR(64);
    v_result JSONB;
BEGIN
    IF p_case_id IS NULL OR p_assessment_id IS NULL OR p_notary_id IS NULL OR p_rules_version IS NULL OR trim(p_rules_version) = '' OR p_idempotency_key IS NULL OR trim(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS';
    END IF;

    -- Compute payload digest
    v_payload_digest := encode(extensions.digest(concat_ws('|', p_case_id::TEXT, p_assessment_id::TEXT, p_notary_id::TEXT, p_rules_version), 'sha256'), 'hex');

    -- Check Idempotency Record
    SELECT * INTO v_existing_idempotency
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing_idempotency.payload_digest = v_payload_digest THEN
            RETURN v_existing_idempotency.result_payload || '{"replayed": true}'::JSONB;
        ELSE
            RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';
        END IF;
    END IF;

    -- Lock Case row deterministically
    SELECT * INTO v_case
    FROM public.corporate_service_cases
    WHERE case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND';
    END IF;

    IF v_case.assigned_notary_id IS NULL OR v_case.assigned_notary_id <> p_notary_id THEN
        RAISE EXCEPTION 'FORBIDDEN_NOT_ASSIGNED_NOTARY';
    END IF;

    -- Validate Notary profile
    SELECT * INTO v_notary_profile
    FROM public.notary_profiles
    WHERE notary_id = p_notary_id AND status = 'VERIFIED_ACTIVE'
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOTARY_NOT_VERIFIED';
    END IF;

    -- Lock Assessment row deterministically
    SELECT * INTO v_assessment
    FROM public.compliance_assessments
    WHERE assessment_id = p_assessment_id AND case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND';
    END IF;

    -- Exact Replay check if already approved
    IF v_assessment.reviewer_decision = 'APPROVED' AND v_case.current_stage IN ('DOCUMENTS_PENDING', 'NOTARY_REVIEW', 'AHU_SUBMITTED', 'AHU_APPROVED', 'OSS_PENDING', 'NIB_ISSUED', 'COMPLETED') THEN
        v_result := jsonb_build_object(
            'case_id', p_case_id,
            'assessment_id', p_assessment_id,
            'current_stage', v_case.current_stage,
            'replayed', true
        );
        RETURN v_result;
    END IF;

    -- Validate Stage & Rules Version
    IF v_case.current_stage <> 'CDD_REVIEW' THEN
        RAISE EXCEPTION 'STAGE_CONFLICT';
    END IF;

    IF v_assessment.rules_version <> p_rules_version THEN
        RAISE EXCEPTION 'RULES_VERSION_MISMATCH';
    END IF;

    -- Validate Screening statuses
    IF v_assessment.pep_check_status NOT IN ('NO_MATCH', 'NOT_APPLICABLE')
       OR v_assessment.sanctions_check_status NOT IN ('NO_MATCH', 'NOT_APPLICABLE') THEN
        RAISE EXCEPTION 'CDD_SCREENING_UNRESOLVED';
    END IF;

    -- Validate Beneficial Owner declarations
    SELECT count(*), count(*) FILTER (WHERE verification_status <> 'VERIFIED')
    INTO v_total_bo_count, v_unverified_bo_count
    FROM public.beneficial_owners
    WHERE case_id = p_case_id;

    IF v_total_bo_count = 0 OR v_unverified_bo_count > 0 THEN
        RAISE EXCEPTION 'BO_VERIFICATION_REQUIRED';
    END IF;

    -- Atomic execution: Update Assessment + Transition Case
    UPDATE public.compliance_assessments
    SET reviewer_decision = 'APPROVED',
        reviewer_id = p_notary_id,
        reviewer_role = 'NOTARY',
        assessed_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE assessment_id = p_assessment_id;

    UPDATE public.corporate_service_cases
    SET current_stage = 'DOCUMENTS_PENDING',
        updated_at = clock_timestamp()
    WHERE case_id = p_case_id;

    v_result := jsonb_build_object(
        'case_id', p_case_id,
        'assessment_id', p_assessment_id,
        'current_stage', 'DOCUMENTS_PENDING',
        'replayed', false
    );

    INSERT INTO public.notary_workspace_idempotency_records (
        idempotency_key,
        operation_type,
        case_id,
        actor_id,
        payload_digest,
        result_payload
    ) VALUES (
        p_idempotency_key,
        'APPROVE_CDD',
        p_case_id,
        p_notary_id,
        v_payload_digest,
        v_result
    );

    RETURN v_result;
END;
$$;


-- 5. Revoke direct mutations on compliance_assessments & privileged RPCs
DROP POLICY IF EXISTS rls_compliance_assessments_restricted_insert ON public.compliance_assessments;
CREATE POLICY rls_compliance_assessments_restricted_insert
ON public.compliance_assessments FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS rls_compliance_assessments_restricted_update ON public.compliance_assessments;
CREATE POLICY rls_compliance_assessments_restricted_update
ON public.compliance_assessments FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.compliance_assessments FROM authenticated, anon, PUBLIC;
GRANT SELECT ON TABLE public.compliance_assessments TO authenticated;

REVOKE ALL ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) TO service_role;

REVOKE ALL ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) TO service_role;
