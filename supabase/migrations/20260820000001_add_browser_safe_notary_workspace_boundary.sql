-- ============================================================================
-- Migration: Add Browser-Safe Notary Workspace Boundary & Canonical CDD Approval
-- Batch 3.C.1 (Repaired in-place to adhere strictly to canonical schema contracts)
-- ============================================================================

-- 1. Create Notary Profiles Table
CREATE TABLE IF NOT EXISTS public.notary_profiles (
    notary_id UUID PRIMARY KEY REFERENCES public.users_advocate(advocate_id) ON DELETE CASCADE,
    license_number VARCHAR(128) NOT NULL,
    jurisdiction_city VARCHAR(128) NOT NULL,
    jurisdiction_province VARCHAR(128) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED_ACTIVE', 'SUSPENDED', 'REVOKED')),
    verified_by_admin_id UUID REFERENCES public.users_admin(admin_id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_notary_profiles_verified_by_admin
        CHECK ((status = 'VERIFIED_ACTIVE' AND verified_by_admin_id IS NOT NULL AND verified_at IS NOT NULL) OR status <> 'VERIFIED_ACTIVE')
);

CREATE INDEX IF NOT EXISTS idx_notary_profiles_status ON public.notary_profiles (status);
CREATE INDEX IF NOT EXISTS idx_notary_profiles_jurisdiction ON public.notary_profiles (jurisdiction_province, jurisdiction_city);

ALTER TABLE public.notary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_profiles FORCE ROW LEVEL SECURITY;

-- Notaries can read their own profile
DROP POLICY IF EXISTS p_notary_profiles_select_own ON public.notary_profiles;
CREATE POLICY p_notary_profiles_select_own ON public.notary_profiles
    FOR SELECT TO authenticated
    USING (notary_id = auth.uid());

-- Verified active notaries are visible to other authenticated users for assignment context
DROP POLICY IF EXISTS p_notary_profiles_select_active ON public.notary_profiles;
CREATE POLICY p_notary_profiles_select_active ON public.notary_profiles
    FOR SELECT TO authenticated
    USING (status = 'VERIFIED_ACTIVE');

-- Service role full access
DROP POLICY IF EXISTS p_notary_profiles_service_role ON public.notary_profiles;
CREATE POLICY p_notary_profiles_service_role ON public.notary_profiles
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- 2. Create Idempotency Records Table for Notary Operations
CREATE TABLE IF NOT EXISTS public.notary_workspace_idempotency_records (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    operation_type VARCHAR(32) NOT NULL CHECK (operation_type IN ('ASSIGN_NOTARY', 'APPROVE_CDD')),
    case_id UUID NOT NULL REFERENCES public.corporate_service_cases(case_id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    target_id UUID, -- notary_id for assignment or assessment_id for approval
    payload_digest CHAR(64) NOT NULL,
    result_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.notary_workspace_idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_workspace_idempotency_records FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_notary_idempotency_service_role ON public.notary_workspace_idempotency_records;
CREATE POLICY p_notary_idempotency_service_role ON public.notary_workspace_idempotency_records
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- 3. Atomic Notary Assignment RPC
-- Validates Admin authority, verified Notary qualification, HELD_IN_ESCROW in escrow_transactions,
-- and assigns notary WITHOUT altering the current_stage (stage stays ESCROW_LOCKED).
CREATE OR REPLACE FUNCTION public.fn_assign_corporate_notary_atomic(
    p_case_id UUID,
    p_notary_id UUID,
    p_admin_id UUID,
    p_idempotency_key VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_admin_role VARCHAR(50);
    v_notary_status VARCHAR(24);
    v_is_advocate_verified BOOLEAN;
    v_case RECORD;
    v_escrow RECORD;
    v_existing RECORD;
    v_payload_digest CHAR(64);
    v_result JSONB;
BEGIN
    -- Argument validation
    IF p_case_id IS NULL OR p_notary_id IS NULL OR p_admin_id IS NULL OR p_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Parameters cannot be null';
    END IF;

    IF length(trim(p_idempotency_key)) = 0 OR length(p_idempotency_key) > 128 THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Invalid idempotency key length';
    END IF;

    -- Validate Admin qualification using canonical users_admin table
    SELECT role_group INTO v_admin_role
    FROM public.users_admin
    WHERE admin_id = p_admin_id;

    IF v_admin_role IS NULL OR v_admin_role NOT IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN') THEN
        RAISE EXCEPTION 'FORBIDDEN_ADMIN_ROLE_REQUIRED: Caller is not an authorized Compliance Officer or Super Admin';
    END IF;

    -- Validate Notary qualification using notary_profiles AND canonical fn_is_verified_advocate helper
    SELECT status INTO v_notary_status
    FROM public.notary_profiles
    WHERE notary_id = p_notary_id;

    v_is_advocate_verified := public.fn_is_verified_advocate(p_notary_id);

    IF v_notary_status IS NULL OR v_notary_status <> 'VERIFIED_ACTIVE' OR v_is_advocate_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'NOTARY_NOT_VERIFIED: Selected Notary does not hold an active verified qualification';
    END IF;

    -- Idempotency check with row-level mutex
    v_payload_digest := encode(sha256(concat('ASSIGN_NOTARY:', p_case_id, ':', p_notary_id, ':', p_admin_id)::bytea), 'hex');

    SELECT * INTO v_existing
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.operation_type = 'ASSIGN_NOTARY'
           AND v_existing.case_id = p_case_id
           AND v_existing.actor_id = p_admin_id
           AND v_existing.target_id = p_notary_id
           AND v_existing.payload_digest = v_payload_digest THEN
            RETURN v_existing.result_payload || '{"replayed": true}'::JSONB;
        ELSE
            RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Key was already used with a different operation or payload';
        END IF;
    END IF;

    -- Lock and validate Corporate Case
    SELECT * INTO v_case
    FROM public.corporate_service_cases
    WHERE case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND: Corporate case % does not exist', p_case_id;
    END IF;

    IF v_case.current_stage = 'CANCELLED' THEN
        RAISE EXCEPTION 'CASE_CANCELLED: Case has been cancelled';
    END IF;

    IF v_case.current_stage <> 'ESCROW_LOCKED' THEN
        RAISE EXCEPTION 'STAGE_CONFLICT: Case stage must be ESCROW_LOCKED for notary assignment, found %', v_case.current_stage;
    END IF;

    -- Lock and validate canonical Escrow Transaction
    SELECT * INTO v_escrow
    FROM public.escrow_transactions
    WHERE corporate_case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND OR v_escrow.status <> 'HELD_IN_ESCROW' OR v_escrow.funds_locked_at IS NULL THEN
        RAISE EXCEPTION 'ESCROW_NOT_HELD: Case escrow funds are not locked in HELD_IN_ESCROW status';
    END IF;

    -- Conflict check: Case already assigned to a different notary
    IF v_case.assigned_notary_id IS NOT NULL AND v_case.assigned_notary_id <> p_notary_id THEN
        RAISE EXCEPTION 'ASSIGNMENT_CONFLICT: Case is already assigned to a different Notary';
    END IF;

    -- Update Assigned Notary ID only (current_stage remains unchanged at ESCROW_LOCKED)
    UPDATE public.corporate_service_cases
    SET assigned_notary_id = p_notary_id,
        updated_at = clock_timestamp()
    WHERE case_id = p_case_id;

    -- Record canonical audit event
    INSERT INTO public.audit_events (
        event_type,
        actor_id,
        actor_role,
        case_id,
        payload_snapshot
    ) VALUES (
        'NOTARY_ASSIGNED',
        p_admin_id,
        'ADMIN',
        p_case_id,
        jsonb_build_object(
            'assigned_notary_id', p_notary_id,
            'assigned_by_admin_id', p_admin_id,
            'current_stage', 'ESCROW_LOCKED'
        )
    );

    v_result := jsonb_build_object(
        'case_id', p_case_id,
        'assigned_notary_id', p_notary_id,
        'current_stage', 'ESCROW_LOCKED',
        'replayed', false
    );

    -- Store idempotency record
    INSERT INTO public.notary_workspace_idempotency_records (
        idempotency_key,
        operation_type,
        case_id,
        actor_id,
        target_id,
        payload_digest,
        result_payload
    ) VALUES (
        p_idempotency_key,
        'ASSIGN_NOTARY',
        p_case_id,
        p_admin_id,
        p_notary_id,
        v_payload_digest,
        v_result
    );

    RETURN v_result;
END;
$$;


-- 4. Atomic CDD Approval RPC
-- Validates that the caller is the assigned, active verified Notary and reviewer,
-- verifies all Beneficial Owners are VERIFIED and PEP/sanctions screening is clear,
-- updates assessment to APPROVED, and transitions case stage to DOCUMENTS_PENDING via canonical helper.
CREATE OR REPLACE FUNCTION public.fn_approve_notary_cdd_atomic(
    p_case_id UUID,
    p_assessment_id UUID,
    p_notary_id UUID,
    p_rules_version VARCHAR,
    p_idempotency_key VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_notary_status VARCHAR(24);
    v_is_advocate_verified BOOLEAN;
    v_case RECORD;
    v_assessment RECORD;
    v_unverified_bo_count INT;
    v_total_bo_count INT;
    v_existing RECORD;
    v_payload_digest CHAR(64);
    v_result JSONB;
BEGIN
    -- Argument validation
    IF p_case_id IS NULL OR p_assessment_id IS NULL OR p_notary_id IS NULL OR p_rules_version IS NULL OR p_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Parameters cannot be null';
    END IF;

    IF length(trim(p_idempotency_key)) = 0 OR length(p_idempotency_key) > 128 THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Invalid idempotency key length';
    END IF;

    -- Validate Notary qualification
    SELECT status INTO v_notary_status
    FROM public.notary_profiles
    WHERE notary_id = p_notary_id;

    v_is_advocate_verified := public.fn_is_verified_advocate(p_notary_id);

    IF v_notary_status IS NULL OR v_notary_status <> 'VERIFIED_ACTIVE' OR v_is_advocate_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'NOTARY_NOT_VERIFIED: Caller does not hold an active verified Notary qualification';
    END IF;

    -- Idempotency check with row-level mutex
    v_payload_digest := encode(sha256(concat('APPROVE_CDD:', p_case_id, ':', p_assessment_id, ':', p_notary_id, ':', p_rules_version)::bytea), 'hex');

    SELECT * INTO v_existing
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.operation_type = 'APPROVE_CDD'
           AND v_existing.case_id = p_case_id
           AND v_existing.actor_id = p_notary_id
           AND v_existing.target_id = p_assessment_id
           AND v_existing.payload_digest = v_payload_digest THEN
            RETURN v_existing.result_payload || '{"replayed": true}'::JSONB;
        ELSE
            RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Key was already used with a different operation or payload';
        END IF;
    END IF;

    -- Lock and validate Corporate Case
    SELECT * INTO v_case
    FROM public.corporate_service_cases
    WHERE case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND: Corporate case % does not exist', p_case_id;
    END IF;

    IF v_case.assigned_notary_id IS NULL OR v_case.assigned_notary_id <> p_notary_id THEN
        RAISE EXCEPTION 'FORBIDDEN_NOT_ASSIGNED_NOTARY: Caller is not the assigned Notary for this case';
    END IF;

    IF v_case.current_stage <> 'CDD_REVIEW' THEN
        RAISE EXCEPTION 'STAGE_CONFLICT: Case stage must be CDD_REVIEW, found %', v_case.current_stage;
    END IF;

    -- Lock and validate Compliance Assessment
    SELECT * INTO v_assessment
    FROM public.compliance_assessments
    WHERE assessment_id = p_assessment_id
    FOR UPDATE;

    IF NOT FOUND OR v_assessment.case_id <> p_case_id THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND: Compliance assessment % does not exist for case %', p_assessment_id, p_case_id;
    END IF;

    IF v_assessment.assessment_level <> 'CDD' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Assessment level must be CDD';
    END IF;

    IF v_assessment.reviewer_id IS DISTINCT FROM p_notary_id OR v_assessment.reviewer_role <> 'NOTARY' THEN
        RAISE EXCEPTION 'FORBIDDEN_NOT_ASSIGNED_NOTARY: Assessment reviewer is not assigned to caller';
    END IF;

    IF v_assessment.rules_version <> p_rules_version THEN
        RAISE EXCEPTION 'RULES_VERSION_MISMATCH: Rules version mismatch (expected %, provided %)', v_assessment.rules_version, p_rules_version;
    END IF;

    IF v_assessment.reviewer_decision <> 'PENDING' THEN
        RAISE EXCEPTION 'CDD_ALREADY_DECIDED: Assessment is already decided as %', v_assessment.reviewer_decision;
    END IF;

    -- Validate screening statuses
    IF v_assessment.pep_check_status NOT IN ('NO_MATCH', 'NOT_APPLICABLE')
       OR v_assessment.sanctions_check_status NOT IN ('NO_MATCH', 'NOT_APPLICABLE') THEN
        RAISE EXCEPTION 'CDD_SCREENING_UNRESOLVED: PEP or Sanctions screening is not clear';
    END IF;

    -- Validate Beneficial Owner requirements
    SELECT count(*), count(*) FILTER (WHERE verification_status <> 'VERIFIED')
    INTO v_total_bo_count, v_unverified_bo_count
    FROM public.beneficial_owners
    WHERE case_id = p_case_id;

    IF v_total_bo_count = 0 OR v_unverified_bo_count > 0 THEN
        RAISE EXCEPTION 'BO_VERIFICATION_REQUIRED: Case has unverified beneficial owners (% unverified of % total)', v_unverified_bo_count, v_total_bo_count;
    END IF;

    -- Update assessment decision
    UPDATE public.compliance_assessments
    SET reviewer_decision = 'APPROVED',
        assessed_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE assessment_id = p_assessment_id;

    -- Transition case stage via canonical transition helper
    PERFORM public.fn_transition_corporate_service_case(
        p_case_id,
        'CDD_REVIEW',
        'DOCUMENTS_PENDING'
    );

    -- Record audit event
    INSERT INTO public.audit_events (
        event_type,
        actor_id,
        actor_role,
        case_id,
        payload_snapshot
    ) VALUES (
        'CDD_APPROVED',
        p_notary_id,
        'NOTARY',
        p_case_id,
        jsonb_build_object(
            'assessment_id', p_assessment_id,
            'rules_version', p_rules_version,
            'previous_stage', 'CDD_REVIEW',
            'current_stage', 'DOCUMENTS_PENDING'
        )
    );

    v_result := jsonb_build_object(
        'case_id', p_case_id,
        'assessment_id', p_assessment_id,
        'current_stage', 'DOCUMENTS_PENDING',
        'replayed', false
    );

    -- Store idempotency record
    INSERT INTO public.notary_workspace_idempotency_records (
        idempotency_key,
        operation_type,
        case_id,
        actor_id,
        target_id,
        payload_digest,
        result_payload
    ) VALUES (
        p_idempotency_key,
        'APPROVE_CDD',
        p_case_id,
        p_notary_id,
        p_assessment_id,
        v_payload_digest,
        v_result
    );

    RETURN v_result;
END;
$$;


-- 5. Revoke Direct Browser Table DML Mutations
-- Revoke direct INSERT and UPDATE on compliance_assessments from authenticated / anon roles.
REVOKE INSERT, UPDATE, DELETE ON public.compliance_assessments FROM authenticated, anon, PUBLIC;

-- 6. Strict Least-Privilege ACL on Privileged RPCs
REVOKE EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) TO service_role;
