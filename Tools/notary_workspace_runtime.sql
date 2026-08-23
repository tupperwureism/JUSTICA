\set ON_ERROR_STOP on

-- ============================================================================
-- Batch 3.C.3: Notary Workspace & Canonical CDD Approval Runtime Suite
-- Runs inside a single transaction and MUST finish with ROLLBACK.
-- Uses 100% canonical schema, valid constraints, advisory locks, and WORM events.
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_admin_id UUID := '3c300000-0000-4000-8000-000000000001'::UUID;
    v_non_admin_id UUID := '3c300000-0000-4000-8000-000000000099'::UUID;
    v_notary_id UUID := '3c300000-0000-4000-8000-000000000002'::UUID;
    v_notary_id_2 UUID := '3c300000-0000-4000-8000-000000000003'::UUID;
    v_unverified_notary_id UUID := '3c300000-0000-4000-8000-000000000004'::UUID;
    v_suspended_notary_id UUID := '3c300000-0000-4000-8000-000000000005'::UUID;
    v_client_id UUID := '3c300000-0000-4000-8000-000000000006'::UUID;

    v_order_id UUID := '3c300000-0000-4000-8000-000000000010'::UUID;
    v_cancelled_order_id UUID := '3c300000-0000-4000-8000-000000000011'::UUID;
    v_case_id UUID := '3c300000-0000-4000-8000-000000000020'::UUID;
    v_cancelled_case_id UUID := '3c300000-0000-4000-8000-000000000021'::UUID;
    v_escrow_id UUID := '3c300000-0000-4000-8000-000000000025'::UUID;
    v_assessment_id UUID := '3c300000-0000-4000-8000-000000000030'::UUID;
    v_bo_id UUID := '3c300000-0000-4000-8000-000000000040'::UUID;

    v_assign_key VARCHAR := '3c300000-0000-4000-8000-000000000100';
    v_cdd_key VARCHAR := '3c300000-0000-4000-8000-000000000200';
    v_result JSONB;
    v_err_caught BOOLEAN := FALSE;
    v_event_count_before INT;
    v_event_count_after INT;
    v_idempotency_count_before INT;
    v_idempotency_count_after INT;
BEGIN
    -- 1. Setup Auth Users Fixtures
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
    VALUES
        (v_admin_id, 'authenticated', 'authenticated', 'admin-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_non_admin_id, 'authenticated', 'authenticated', 'nonadmin-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_notary_id, 'authenticated', 'authenticated', 'notary-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_notary_id_2, 'authenticated', 'authenticated', 'notary2-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_unverified_notary_id, 'authenticated', 'authenticated', 'unverified-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_suspended_notary_id, 'authenticated', 'authenticated', 'suspended-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_client_id, 'authenticated', 'authenticated', 'client-3c3@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Setup Canonical Profile Fixtures with ALL NOT NULL and CHECK constraints
    INSERT INTO public.users_admin (admin_id, full_name, email, role_group)
    VALUES (v_admin_id, 'Admin Kepatuhan 3C3', 'admin-3c3@justica.invalid', 'COMPLIANCE_OFFICER')
    ON CONFLICT (admin_id) DO UPDATE SET role_group = 'COMPLIANCE_OFFICER';

    INSERT INTO public.users_client (client_id, full_name, email, phone_e164, password_hash, kyc_status)
    VALUES (v_client_id, 'Klien Korporasi 3C3', 'client-3c3@justica.invalid', '+6281234567890', '!HASH!', 'VERIFIED')
    ON CONFLICT (client_id) DO NOTHING;

    INSERT INTO public.users_advocate (
        advocate_id, full_name, email, phone_e164, sipp_license_no,
        peradi_card_no, specialization_primary, kyc_status
    ) VALUES
        (v_notary_id, 'Notaris Hj. Siti Aminah S.H., M.Kn.', 'notary-3c3@justica.invalid', '+6281234567891', 'SIPP-3C3-001', 'PERADI-3C3-001', 'CORPORATE', 'VERIFIED'),
        (v_notary_id_2, 'Notaris Bpk. Hendra S.H., M.Kn.', 'notary2-3c3@justica.invalid', '+6281234567892', 'SIPP-3C3-002', 'PERADI-3C3-002', 'CORPORATE', 'VERIFIED'),
        (v_unverified_notary_id, 'Advokat Belum Verifikasi', 'unverified-3c3@justica.invalid', '+6281234567893', 'SIPP-3C3-003', 'PERADI-3C3-003', 'LITIGATION', 'PENDING'),
        (v_suspended_notary_id, 'Notaris Suspended', 'suspended-3c3@justica.invalid', '+6281234567894', 'SIPP-3C3-004', 'PERADI-3C3-004', 'CORPORATE', 'VERIFIED')
    ON CONFLICT (advocate_id) DO UPDATE SET kyc_status = EXCLUDED.kyc_status;

    INSERT INTO public.notary_profiles (
        notary_id, license_number, jurisdiction_city, jurisdiction_province,
        status, verified_by_admin_id, verified_at
    ) VALUES
        (v_notary_id, 'SK-NOT-3C3-001', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', v_admin_id, pg_catalog.clock_timestamp()),
        (v_notary_id_2, 'SK-NOT-3C3-002', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', v_admin_id, pg_catalog.clock_timestamp()),
        (v_unverified_notary_id, 'SK-NOT-3C3-PENDING', 'Jakarta Selatan', 'DKI Jakarta', 'PENDING', null, null),
        (v_suspended_notary_id, 'SK-NOT-3C3-SUSPENDED', 'Jakarta Selatan', 'DKI Jakarta', 'SUSPENDED', v_admin_id, pg_catalog.clock_timestamp())
    ON CONFLICT (notary_id) DO UPDATE SET status = EXCLUDED.status, verified_by_admin_id = EXCLUDED.verified_by_admin_id, verified_at = EXCLUDED.verified_at;

    -- 3. Setup Order, Case, and Escrow Fixtures satisfying ALL canonical constraints
    INSERT INTO public.service_orders (
        order_id, client_id, service_type, status, submitted_at
    ) VALUES
        (v_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp()),
        (v_cancelled_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp())
    ON CONFLICT (order_id) DO NOTHING;

    INSERT INTO public.corporate_service_cases (
        case_id, order_id, entity_type, proposed_name, domicile_city, domicile_province,
        legal_scope_version, current_stage, assigned_notary_id
    ) VALUES
        (v_case_id, v_order_id, 'PT_ORDINARY', 'PT Inovasi Mandiri 3C3', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
        (v_cancelled_case_id, v_cancelled_order_id, 'PT_ORDINARY', 'PT Batal 3C3', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CANCELLED', null)
    ON CONFLICT (case_id) DO UPDATE SET current_stage = EXCLUDED.current_stage, assigned_notary_id = null;

    -- Canonical Escrow Transaction with all mandatory fields
    INSERT INTO public.escrow_transactions (
        escrow_id, corporate_case_id, client_id, total_amount_idr, status,
        holding_expires_at, payment_gateway_ref, funds_locked_at
    ) VALUES (
        v_escrow_id, v_case_id, v_client_id, 7500000, 'HELD_IN_ESCROW',
        pg_catalog.clock_timestamp() + interval '7 days', 'PG-REF-3C3-001', pg_catalog.clock_timestamp()
    ) ON CONFLICT (escrow_id) DO UPDATE SET status = 'HELD_IN_ESCROW', funds_locked_at = pg_catalog.clock_timestamp();

    -- BO and Compliance Assessment Fixtures
    INSERT INTO public.beneficial_owners (
        beneficial_owner_id, case_id, declaration_version, natural_person_name, identity_reference,
        control_basis, percentage, evidence_digest, verification_status, reviewer_id, verified_at
    ) VALUES (
        v_bo_id, v_case_id, 1, 'Budi Santoso 3C3', 'ID-BO-3C3-001',
        'OWNERSHIP', 80.0, repeat('c', 64), 'VERIFIED', v_admin_id, pg_catalog.clock_timestamp()
    ) ON CONFLICT (beneficial_owner_id) DO NOTHING;

    INSERT INTO public.compliance_assessments (
        assessment_id, case_id, assessment_level, pep_check_status, sanctions_check_status,
        rules_version, reviewer_decision, reviewer_id, reviewer_role
    ) VALUES (
        v_assessment_id, v_case_id, 'CDD', 'NO_MATCH', 'NO_MATCH',
        'PMPJ-2026.1', 'PENDING', v_notary_id, 'NOTARY'
    ) ON CONFLICT (assessment_id) DO NOTHING;


    -- ========================================================================
    -- ASSERTION 1: Assignment rejects invalid UUID idempotency key
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_notary_id,
            v_admin_id,
            'not-a-valid-uuid'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%INVALID_ARGUMENTS%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected INVALID_ARGUMENTS for invalid UUID key';
    END IF;


    -- ========================================================================
    -- ASSERTION 2: Assignment rejects unverified & suspended notaries
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_unverified_notary_id,
            v_admin_id,
            '3c300000-0000-4000-8000-000000000101'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%NOTARY_NOT_VERIFIED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected NOTARY_NOT_VERIFIED for unverified notary';
    END IF;

    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_suspended_notary_id,
            v_admin_id,
            '3c300000-0000-4000-8000-000000000102'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%NOTARY_NOT_VERIFIED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected NOTARY_NOT_VERIFIED for suspended notary';
    END IF;


    -- ========================================================================
    -- ASSERTION 3: Assignment rejects unauthorized actor
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_notary_id,
            v_non_admin_id,
            '3c300000-0000-4000-8000-000000000103'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%FORBIDDEN_ADMIN_ROLE_REQUIRED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected FORBIDDEN_ADMIN_ROLE_REQUIRED for non-admin actor';
    END IF;


    -- ========================================================================
    -- ASSERTION 4: Assignment rejects cancelled case
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_cancelled_case_id,
            v_notary_id,
            v_admin_id,
            '3c300000-0000-4000-8000-000000000104'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%CASE_CANCELLED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected CASE_CANCELLED for cancelled case';
    END IF;


    -- ========================================================================
    -- ASSERTION 5: Valid Assignment succeeds, leaves ESCROW_LOCKED, appends WORM event
    -- ========================================================================
    SELECT pg_catalog.count(*) INTO v_event_count_before
    FROM public.compliance_workflow_events_worm
    WHERE corporate_case_id = v_case_id;

    SELECT pg_catalog.count(*) INTO v_idempotency_count_before
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = v_assign_key;

    v_result := public.fn_assign_corporate_notary_atomic(
        v_case_id,
        v_notary_id,
        v_admin_id,
        v_assign_key
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT FALSE
       OR (v_result->>'assigned_notary_id')::UUID <> v_notary_id
       OR (v_result->>'current_stage') <> 'ESCROW_LOCKED' THEN
        RAISE EXCEPTION 'TEST_FAILED: Valid assignment returned unexpected result: %', v_result;
    END IF;

    SELECT pg_catalog.count(*) INTO v_event_count_after
    FROM public.compliance_workflow_events_worm
    WHERE corporate_case_id = v_case_id AND event_type = 'NOTARY_ASSIGNED';

    SELECT pg_catalog.count(*) INTO v_idempotency_count_after
    FROM public.notary_workspace_idempotency_records
    WHERE idempotency_key = v_assign_key;

    IF v_event_count_after <> v_event_count_before + 1 THEN
        RAISE EXCEPTION 'TEST_FAILED: WORM event NOTARY_ASSIGNED was not appended correctly';
    END IF;

    IF v_idempotency_count_after <> v_idempotency_count_before + 1 THEN
        RAISE EXCEPTION 'TEST_FAILED: Idempotency record was not persisted correctly';
    END IF;


    -- ========================================================================
    -- ASSERTION 6: Exact assignment replay succeeds with zero additional writes
    -- ========================================================================
    v_result := public.fn_assign_corporate_notary_atomic(
        v_case_id,
        v_notary_id,
        v_admin_id,
        v_assign_key
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT TRUE
       OR (v_result->>'current_stage') <> 'ESCROW_LOCKED' THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected replayed=true on exact assignment replay';
    END IF;

    IF (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm WHERE corporate_case_id = v_case_id AND event_type = 'NOTARY_ASSIGNED') <> v_event_count_after THEN
        RAISE EXCEPTION 'TEST_FAILED: Replay created duplicate WORM event';
    END IF;


    -- ========================================================================
    -- ASSERTION 7: Same key with changed notary throws IDEMPOTENCY_CONFLICT
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_notary_id_2, -- Changed notary
            v_admin_id,
            v_assign_key -- Reused key
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%IDEMPOTENCY_CONFLICT%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected IDEMPOTENCY_CONFLICT on changed notary with same key';
    END IF;


    -- ========================================================================
    -- ASSERTION 8: New key against already assigned case throws ASSIGNMENT_CONFLICT
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_notary_id,
            v_admin_id,
            '3c300000-0000-4000-8000-000000000199' -- New key
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%ASSIGNMENT_CONFLICT%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected ASSIGNMENT_CONFLICT for new key on assigned case';
    END IF;


    -- ========================================================================
    -- CDD PREPARATION: Advance case canonically through IDENTITY_PENDING -> CDD_REVIEW
    -- ========================================================================
    PERFORM public.fn_transition_corporate_service_case(v_case_id, 'ESCROW_LOCKED', 'IDENTITY_PENDING');
    PERFORM public.fn_transition_corporate_service_case(v_case_id, 'IDENTITY_PENDING', 'CDD_REVIEW');


    -- ========================================================================
    -- ASSERTION 9: CDD Approval rejects unassigned notary
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(
            v_case_id,
            v_assessment_id,
            v_notary_id_2, -- Not the assigned notary
            'PMPJ-2026.1',
            '3c300000-0000-4000-8000-000000000201'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%FORBIDDEN_NOT_ASSIGNED_NOTARY%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected FORBIDDEN_NOT_ASSIGNED_NOTARY for unassigned notary';
    END IF;


    -- ========================================================================
    -- ASSERTION 10: Valid CDD approval transitions to DOCUMENTS_PENDING and appends WORM event
    -- ========================================================================
    SELECT pg_catalog.count(*) INTO v_event_count_before
    FROM public.compliance_workflow_events_worm
    WHERE corporate_case_id = v_case_id AND event_type = 'CDD_APPROVED';

    v_result := public.fn_approve_notary_cdd_atomic(
        v_case_id,
        v_assessment_id,
        v_notary_id,
        'PMPJ-2026.1',
        v_cdd_key
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT FALSE
       OR (v_result->>'current_stage') <> 'DOCUMENTS_PENDING' THEN
        RAISE EXCEPTION 'TEST_FAILED: Valid CDD approval returned unexpected result: %', v_result;
    END IF;

    SELECT pg_catalog.count(*) INTO v_event_count_after
    FROM public.compliance_workflow_events_worm
    WHERE corporate_case_id = v_case_id AND event_type = 'CDD_APPROVED';

    IF v_event_count_after <> v_event_count_before + 1 THEN
        RAISE EXCEPTION 'TEST_FAILED: WORM event CDD_APPROVED was not appended correctly';
    END IF;


    -- ========================================================================
    -- ASSERTION 11: Exact CDD approval replay succeeds with replayed = true
    -- ========================================================================
    v_result := public.fn_approve_notary_cdd_atomic(
        v_case_id,
        v_assessment_id,
        v_notary_id,
        'PMPJ-2026.1',
        v_cdd_key
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT TRUE
       OR (v_result->>'current_stage') <> 'DOCUMENTS_PENDING' THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected replayed=true on exact CDD replay';
    END IF;


    -- ========================================================================
    -- ASSERTION 12: New key on already decided CDD throws CDD_ALREADY_DECIDED / STAGE_CONFLICT
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(
            v_case_id,
            v_assessment_id,
            v_notary_id,
            'PMPJ-2026.1',
            '3c300000-0000-4000-8000-000000000299' -- New key
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%STAGE_CONFLICT%' OR SQLERRM LIKE '%CDD_ALREADY_DECIDED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected conflict on new key against already approved CDD';
    END IF;

    RAISE NOTICE 'ALL BATCH 3.C.3 CANONICAL RUNTIME ASSERTIONS PASSED SUCCESSFULLY';
END;
$$;

-- Security ACL Assertions: verify PUBLIC / anon / authenticated cannot directly execute RPCs
DO $$
BEGIN
    IF pg_catalog.has_function_privilege('authenticated', 'public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: authenticated user has execute privilege on fn_assign_corporate_notary_atomic';
    END IF;
    IF pg_catalog.has_function_privilege('authenticated', 'public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: authenticated user has execute privilege on fn_approve_notary_cdd_atomic';
    END IF;
    IF pg_catalog.has_function_privilege('anon', 'public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: anon user has execute privilege on fn_assign_corporate_notary_atomic';
    END IF;
    IF pg_catalog.has_function_privilege('anon', 'public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: anon user has execute privilege on fn_approve_notary_cdd_atomic';
    END IF;
END;
$$;

SELECT 'notary_workspace_runtime_assertions_complete_3c3' AS status;

ROLLBACK;
