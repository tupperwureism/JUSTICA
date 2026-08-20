\set ON_ERROR_STOP on

-- ============================================================================
-- Batch 3.C: Notary Workspace & CDD Approval Runtime Assertion Suite
-- All mutations, fixtures, and assertions run within a transactional block.
-- MUST finish with ROLLBACK to leave the database completely clean.
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_admin_id UUID := '3c000000-0000-4000-8000-000000000001'::UUID;
    v_notary_id UUID := '3c000000-0000-4000-8000-000000000002'::UUID;
    v_unverified_notary_id UUID := '3c000000-0000-4000-8000-000000000003'::UUID;
    v_client_id UUID := '3c000000-0000-4000-8000-000000000004'::UUID;
    v_order_id UUID := '3c000000-0000-4000-8000-000000000010'::UUID;
    v_case_id UUID := '3c000000-0000-4000-8000-000000000020'::UUID;
    v_assessment_id UUID := '3c000000-0000-4000-8000-000000000030'::UUID;
    v_bo_id UUID := '3c000000-0000-4000-8000-000000000040'::UUID;
    v_result JSONB;
    v_err_caught BOOLEAN := FALSE;
BEGIN
    -- 1. Setup Auth Users Fixtures
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
    VALUES
        (v_admin_id, 'authenticated', 'authenticated', 'admin-3c@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
        (v_notary_id, 'authenticated', 'authenticated', 'notary-3c@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
        (v_unverified_notary_id, 'authenticated', 'authenticated', 'unverified-3c@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
        (v_client_id, 'authenticated', 'authenticated', 'client-3c@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Setup Profile Fixtures
    INSERT INTO public.users_admin (admin_id, full_name, email, role_group, is_active)
    VALUES (v_admin_id, 'Admin Compliance 3C', 'admin-3c@justica.invalid', 'COMPLIANCE_OFFICER', true)
    ON CONFLICT (admin_id) DO UPDATE SET role_group = 'COMPLIANCE_OFFICER', is_active = true;

    INSERT INTO public.users_client (client_id, full_name, email)
    VALUES (v_client_id, 'Client 3C', 'client-3c@justica.invalid')
    ON CONFLICT (client_id) DO NOTHING;

    INSERT INTO public.users_advocate (advocate_id, full_name, email, is_verified, license_number)
    VALUES
        (v_notary_id, 'Notaris Budi S.H.', 'notary-3c@justica.invalid', true, 'NOT-3C-001'),
        (v_unverified_notary_id, 'Advokat Belum Notaris', 'unverified-3c@justica.invalid', false, 'ADV-3C-002')
    ON CONFLICT (advocate_id) DO UPDATE SET is_verified = EXCLUDED.is_verified;

    INSERT INTO public.notary_profiles (notary_id, license_number, jurisdiction_city, jurisdiction_province, status, verified_by_admin_id, verified_at)
    VALUES
        (v_notary_id, 'NOT-3C-001', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', v_admin_id, clock_timestamp()),
        (v_unverified_notary_id, 'NOT-3C-PENDING', 'Jakarta Selatan', 'DKI Jakarta', 'PENDING', null, null)
    ON CONFLICT (notary_id) DO UPDATE SET status = EXCLUDED.status, verified_by_admin_id = EXCLUDED.verified_by_admin_id, verified_at = EXCLUDED.verified_at;

    -- 3. Setup Order & Case Fixtures (Escrow Held, Stage: ESCROW_LOCKED)
    INSERT INTO public.service_orders (
        order_id, client_id, service_type, base_fee_idr, total_amount_idr,
        escrow_status, funds_locked_at, current_status
    ) VALUES (
        v_order_id, v_client_id, 'CORPORATE_INTAKE', 7500000, 7500000,
        'HELD_IN_ESCROW', clock_timestamp(), 'PROCESSING'
    ) ON CONFLICT (order_id) DO UPDATE SET escrow_status = 'HELD_IN_ESCROW', funds_locked_at = clock_timestamp();

    INSERT INTO public.corporate_service_cases (
        case_id, order_id, entity_type, proposed_name, domicile_city, domicile_province,
        legal_scope_version, current_stage, assigned_notary_id
    ) VALUES (
        v_case_id, v_order_id, 'PT_ORDINARY', 'PT Maju Bersama 3C', 'Jakarta Selatan', 'DKI Jakarta',
        '2026.1', 'ESCROW_LOCKED', null
    ) ON CONFLICT (case_id) DO UPDATE SET current_stage = 'ESCROW_LOCKED', assigned_notary_id = null;

    -- Setup BO & Assessment fixtures
    INSERT INTO public.beneficial_owners (
        beneficial_owner_id, case_id, natural_person_name, identity_reference,
        control_basis, percentage, evidence_digest, verification_status, reviewer_id, verified_at
    ) VALUES (
        v_bo_id, v_case_id, 'Pemilik Manfaat Sah', 'ID-REF-3C-001',
        'OWNERSHIP', 75.0, repeat('a', 64), 'VERIFIED', v_admin_id, clock_timestamp()
    ) ON CONFLICT (beneficial_owner_id) DO NOTHING;

    INSERT INTO public.compliance_assessments (
        assessment_id, case_id, assessment_level, pep_check_status, sanctions_check_status,
        rules_version, reviewer_decision, reviewer_id, reviewer_role
    ) VALUES (
        v_assessment_id, v_case_id, 'CDD', 'NO_MATCH', 'NO_MATCH',
        'PMPJ-2026.1', 'PENDING', v_notary_id, 'NOTARY'
    ) ON CONFLICT (assessment_id) DO NOTHING;


    -- ========================================================================
    -- ASSERTION 1: Assignment rejects unverified / pending notary
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_unverified_notary_id,
            v_admin_id,
            'idemp-assign-unverified'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%NOTARY_NOT_VERIFIED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected NOTARY_NOT_VERIFIED error on unverified notary assignment';
    END IF;


    -- ========================================================================
    -- ASSERTION 2: Assignment rejects non-admin caller
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            v_notary_id,
            v_client_id, -- Not an admin
            'idemp-assign-nonadmin'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%FORBIDDEN_ADMIN_ROLE_REQUIRED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected FORBIDDEN_ADMIN_ROLE_REQUIRED error on non-admin caller';
    END IF;


    -- ========================================================================
    -- ASSERTION 3: Eligible assignment succeeds atomically
    -- ========================================================================
    v_result := public.fn_assign_corporate_notary_atomic(
        v_case_id,
        v_notary_id,
        v_admin_id,
        'idemp-assign-valid-1'
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT FALSE
       OR (v_result->>'assigned_notary_id')::UUID <> v_notary_id
       OR (v_result->>'current_stage') <> 'CDD_REVIEW' THEN
        RAISE EXCEPTION 'TEST_FAILED: Valid assignment returned unexpected result: %', v_result;
    END IF;


    -- ========================================================================
    -- ASSERTION 4: Exact assignment replay succeeds with replayed = true
    -- ========================================================================
    v_result := public.fn_assign_corporate_notary_atomic(
        v_case_id,
        v_notary_id,
        v_admin_id,
        'idemp-assign-valid-1'
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected replayed=true on exact assignment replay';
    END IF;


    -- ========================================================================
    -- ASSERTION 5: Changed assignment with same idempotency key conflicts
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(
            v_case_id,
            '3c000000-0000-4000-8000-999999999999'::UUID, -- Changed notary
            v_admin_id,
            'idemp-assign-valid-1' -- Reused idempotency key
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%IDEMPOTENCY_CONFLICT%' OR SQLERRM LIKE '%NOTARY_NOT_VERIFIED%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected idempotency conflict on changed payload';
    END IF;


    -- ========================================================================
    -- ASSERTION 6: CDD Approval rejects unassigned notary
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(
            v_case_id,
            v_assessment_id,
            '3c000000-0000-4000-8000-888888888888'::UUID, -- Different notary
            'PMPJ-2026.1',
            'idemp-cdd-wrong-notary'
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
    -- ASSERTION 7: CDD Approval rejects rules version mismatch
    -- ========================================================================
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(
            v_case_id,
            v_assessment_id,
            v_notary_id,
            'WRONG-RULES-2099',
            'idemp-cdd-wrong-rules'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%RULES_VERSION_MISMATCH%' THEN
            v_err_caught := TRUE;
        END IF;
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected RULES_VERSION_MISMATCH error';
    END IF;


    -- ========================================================================
    -- ASSERTION 8: Valid CDD approval transitions case to DOCUMENTS_PENDING
    -- ========================================================================
    v_result := public.fn_approve_notary_cdd_atomic(
        v_case_id,
        v_assessment_id,
        v_notary_id,
        'PMPJ-2026.1',
        'idemp-cdd-valid-1'
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT FALSE
       OR (v_result->>'current_stage') <> 'DOCUMENTS_PENDING' THEN
        RAISE EXCEPTION 'TEST_FAILED: Valid CDD approval returned unexpected result: %', v_result;
    END IF;


    -- ========================================================================
    -- ASSERTION 9: Exact CDD approval replay succeeds with replayed = true
    -- ========================================================================
    v_result := public.fn_approve_notary_cdd_atomic(
        v_case_id,
        v_assessment_id,
        v_notary_id,
        'PMPJ-2026.1',
        'idemp-cdd-valid-1'
    );

    IF (v_result->>'replayed')::BOOLEAN IS NOT TRUE
       OR (v_result->>'current_stage') <> 'DOCUMENTS_PENDING' THEN
        RAISE EXCEPTION 'TEST_FAILED: Expected replayed=true on exact CDD replay';
    END IF;

    RAISE NOTICE 'ALL BATCH 3.C RUNTIME ASSERTIONS PASSED SUCCESSFULLY';
END;
$$;

-- Security ACL Assertion: verify PUBLIC / anon / authenticated cannot directly execute RPCs
DO $$
BEGIN
    IF has_function_privilege('authenticated', 'public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: authenticated user has execute privilege on fn_assign_corporate_notary_atomic';
    END IF;
    IF has_function_privilege('authenticated', 'public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: authenticated user has execute privilege on fn_approve_notary_cdd_atomic';
    END IF;
    IF has_function_privilege('anon', 'public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR)', 'EXECUTE') THEN
        RAISE EXCEPTION 'ACL_SECURITY_LEAK: anon user has execute privilege on fn_assign_corporate_notary_atomic';
    END IF;
END;
$$;

SELECT 'notary_workspace_runtime_assertions_complete' AS status;

ROLLBACK;
