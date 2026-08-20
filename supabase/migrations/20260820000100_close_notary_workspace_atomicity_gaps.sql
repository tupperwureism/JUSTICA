-- ============================================================================
-- Migration: Close Notary Workspace Atomicity Gaps & WORM Compliance Integration
-- Batch 3.C.2 (Forward-only migration repairing audit primitive, advisory-locks, and ACLs)
-- ============================================================================

-- 1. Ensure target_id column exists on idempotency records
ALTER TABLE public.notary_workspace_idempotency_records
    ADD COLUMN IF NOT EXISTS target_id UUID;

-- 2. Atomic Notary Assignment RPC (Advisory-Locked with Canonical WORM Event)
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
    v_normalized_key TEXT;
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

    -- Validate UUID format and normalize
    BEGIN
        v_normalized_key := (p_idempotency_key::UUID)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Idempotency key must be a valid UUID string';
    END;

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

    -- Global transaction-scoped advisory lock for the normalized key
    PERFORM pg_advisory_xact_lock(hashtextextended(concat('NOTARY_WORKSPACE:', v_normalized_key), 0));

    -- Idempotency check with row-level mutex
    v_payload_digest := encode(sha256(concat('ASSIGN_NOTARY:', p_case_id, ':', p_notary_id, ':', p_admin_id)::bytea), 'hex');

    SELECT * INTO v_existing
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = v_normalized_key
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

    -- Conflict check: Case already assigned to a notary (new key cannot re-assign)
    IF v_case.assigned_notary_id IS NOT NULL THEN
        RAISE EXCEPTION 'ASSIGNMENT_CONFLICT: Case is already assigned to a Notary';
    END IF;

    -- Update Assigned Notary ID only (current_stage remains unchanged at ESCROW_LOCKED)
    UPDATE public.corporate_service_cases
    SET assigned_notary_id = p_notary_id,
        updated_at = clock_timestamp()
    WHERE case_id = p_case_id;

    -- Append canonical WORM compliance workflow event
    PERFORM public.fn_append_compliance_workflow_event(
        p_case_id,
        NULL,
        NULL,
        NULL,
        'NOTARY_ASSIGNED',
        p_admin_id,
        concat('NOTARY_ASSIGN:', v_normalized_key),
        clock_timestamp()
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
        v_normalized_key,
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


-- 3. Atomic CDD Approval RPC (Advisory-Locked with Canonical WORM Event)
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
    v_normalized_key TEXT;
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

    -- Validate UUID format and normalize
    BEGIN
        v_normalized_key := (p_idempotency_key::UUID)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'INVALID_ARGUMENTS: Idempotency key must be a valid UUID string';
    END;

    -- Validate Notary qualification
    SELECT status INTO v_notary_status
    FROM public.notary_profiles
    WHERE notary_id = p_notary_id;

    v_is_advocate_verified := public.fn_is_verified_advocate(p_notary_id);

    IF v_notary_status IS NULL OR v_notary_status <> 'VERIFIED_ACTIVE' OR v_is_advocate_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'NOTARY_NOT_VERIFIED: Caller does not hold an active verified Notary qualification';
    END IF;

    -- Global transaction-scoped advisory lock for the normalized key
    PERFORM pg_advisory_xact_lock(hashtextextended(concat('NOTARY_WORKSPACE:', v_normalized_key), 0));

    -- Idempotency check with row-level mutex
    v_payload_digest := encode(sha256(concat('APPROVE_CDD:', p_case_id, ':', p_assessment_id, ':', p_notary_id, ':', p_rules_version)::bytea), 'hex');

    SELECT * INTO v_existing
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = v_normalized_key
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

    -- Append canonical WORM compliance workflow event
    PERFORM public.fn_append_compliance_workflow_event(
        p_case_id,
        NULL,
        NULL,
        NULL,
        'CDD_APPROVED',
        p_notary_id,
        concat('CDD_APPROVE:', v_normalized_key),
        clock_timestamp()
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
        v_normalized_key,
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


-- 4. Revoke direct service_role update on assigned_notary_id and current_stage
REVOKE UPDATE ON TABLE public.corporate_service_cases FROM service_role;
GRANT UPDATE (
    order_id,
    entity_type,
    proposed_name,
    domicile_city,
    domicile_province,
    kbli_snapshot,
    authorized_capital_idr,
    paid_up_capital_idr,
    target_sla_at,
    legal_scope_version,
    assigned_compliance_reviewer_id,
    updated_at
) ON public.corporate_service_cases TO service_role;

-- 5. Strict Least-Privilege ACL on Privileged RPCs
REVOKE EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) TO service_role;
