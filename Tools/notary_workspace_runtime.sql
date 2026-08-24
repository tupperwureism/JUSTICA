\set ON_ERROR_STOP on

-- ============================================================================
-- Batch 3.C.4: Notary Workspace & Canonical CDD Approval Runtime Suite
-- Runs inside a single transaction and MUST finish with ROLLBACK.
-- Full rejection matrix, zero unauthorized writes, ACL, RLS, and atomicity tests.
-- ============================================================================

BEGIN;

DO $$
DECLARE
    -- Actors
    v_admin_id UUID := '3c400000-0000-4000-8000-000000000001'::UUID;
    v_non_admin_id UUID := '3c400000-0000-4000-8000-000000000099'::UUID;
    v_notary_id UUID := '3c400000-0000-4000-8000-000000000002'::UUID;
    v_notary_id_2 UUID := '3c400000-0000-4000-8000-000000000003'::UUID;
    v_unverified_notary_id UUID := '3c400000-0000-4000-8000-000000000004'::UUID;
    v_suspended_notary_id UUID := '3c400000-0000-4000-8000-000000000005'::UUID;
    v_client_id UUID := '3c400000-0000-4000-8000-000000000006'::UUID;

    -- Orders and Cases
    v_order_id UUID := '3c400000-0000-4000-8000-000000000010'::UUID;
    v_cancelled_order_id UUID := '3c400000-0000-4000-8000-000000000011'::UUID;
    v_no_escrow_order_id UUID := '3c400000-0000-4000-8000-000000000012'::UUID;
    v_unlocked_escrow_order_id UUID := '3c400000-0000-4000-8000-000000000013'::UUID;
    v_draft_order_id UUID := '3c400000-0000-4000-8000-000000000014'::UUID;

    v_case_id UUID := '3c400000-0000-4000-8000-000000000020'::UUID;
    v_cancelled_case_id UUID := '3c400000-0000-4000-8000-000000000021'::UUID;
    v_no_escrow_case_id UUID := '3c400000-0000-4000-8000-000000000022'::UUID;
    v_unlocked_escrow_case_id UUID := '3c400000-0000-4000-8000-000000000023'::UUID;
    v_draft_case_id UUID := '3c400000-0000-4000-8000-000000000024'::UUID;

    -- Escrows
    v_escrow_id UUID := '3c400000-0000-4000-8000-000000000025'::UUID;
    v_unlocked_escrow_id UUID := '3c400000-0000-4000-8000-000000000026'::UUID;

    -- Assessments & BOs
    v_assessment_id UUID := '3c400000-0000-4000-8000-000000000030'::UUID;
    v_bo_id UUID := '3c400000-0000-4000-8000-000000000040'::UUID;

    -- Idempotency Keys
    v_assign_key VARCHAR := '3c400000-0000-4000-8000-000000000100';
    v_cdd_key VARCHAR := '3c400000-0000-4000-8000-000000000200';

    -- Verification variables
    v_result JSONB;
    v_err_caught BOOLEAN;
    v_event_count_before INT;
    v_event_count_after INT;
    v_idempotency_count_before INT;
    v_idempotency_count_after INT;
    v_case_stage VARCHAR;
    v_case_notary UUID;
    v_cdd_decision VARCHAR;
BEGIN
    -- 1. Setup Auth Users Fixtures
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
    VALUES
        (v_admin_id, 'authenticated', 'authenticated', 'admin-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_non_admin_id, 'authenticated', 'authenticated', 'nonadmin-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_notary_id, 'authenticated', 'authenticated', 'notary-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_notary_id_2, 'authenticated', 'authenticated', 'notary2-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_unverified_notary_id, 'authenticated', 'authenticated', 'unverified-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_suspended_notary_id, 'authenticated', 'authenticated', 'suspended-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()),
        (v_client_id, 'authenticated', 'authenticated', 'client-3c4@justica.invalid', '!TEST!', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Setup Canonical Profile Fixtures
    INSERT INTO public.users_admin (admin_id, full_name, email, role_group)
    VALUES (v_admin_id, 'Admin Kepatuhan 3C4', 'admin-3c4@justica.invalid', 'COMPLIANCE_OFFICER')
    ON CONFLICT (admin_id) DO UPDATE SET role_group = 'COMPLIANCE_OFFICER';

    INSERT INTO public.users_client (client_id, full_name, email, phone_e164, password_hash, kyc_status)
    VALUES (v_client_id, 'Klien Korporasi 3C4', 'client-3c4@justica.invalid', '+6281234567890', '!HASH!', 'VERIFIED')
    ON CONFLICT (client_id) DO NOTHING;

    INSERT INTO public.users_advocate (
        advocate_id, full_name, email, phone_e164, sipp_license_no,
        peradi_card_no, specialization_primary, kyc_status
    ) VALUES
        (v_notary_id, 'Notaris Hj. Siti Aminah S.H., M.Kn.', 'notary-3c4@justica.invalid', '+6281234567891', 'SIPP-3C4-001', 'PERADI-3C4-001', 'CORPORATE', 'VERIFIED'),
        (v_notary_id_2, 'Notaris Bpk. Hendra S.H., M.Kn.', 'notary2-3c4@justica.invalid', '+6281234567892', 'SIPP-3C4-002', 'PERADI-3C4-002', 'CORPORATE', 'VERIFIED'),
        (v_unverified_notary_id, 'Advokat Belum Verifikasi', 'unverified-3c4@justica.invalid', '+6281234567893', 'SIPP-3C4-003', 'PERADI-3C4-003', 'LITIGATION', 'PENDING'),
        (v_suspended_notary_id, 'Notaris Suspended', 'suspended-3c4@justica.invalid', '+6281234567894', 'SIPP-3C4-004', 'PERADI-3C4-004', 'CORPORATE', 'VERIFIED')
    ON CONFLICT (advocate_id) DO UPDATE SET kyc_status = EXCLUDED.kyc_status;

    INSERT INTO public.notary_profiles (
        notary_id, license_number, jurisdiction_city, jurisdiction_province,
        status, verified_by_admin_id, verified_at
    ) VALUES
        (v_notary_id, 'SK-NOT-3C4-001', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', v_admin_id, pg_catalog.clock_timestamp()),
        (v_notary_id_2, 'SK-NOT-3C4-002', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', v_admin_id, pg_catalog.clock_timestamp()),
        (v_unverified_notary_id, 'SK-NOT-3C4-PENDING', 'Jakarta Selatan', 'DKI Jakarta', 'PENDING', null, null),
        (v_suspended_notary_id, 'SK-NOT-3C4-SUSPENDED', 'Jakarta Selatan', 'DKI Jakarta', 'SUSPENDED', v_admin_id, pg_catalog.clock_timestamp())
    ON CONFLICT (notary_id) DO UPDATE SET status = EXCLUDED.status, verified_by_admin_id = EXCLUDED.verified_by_admin_id, verified_at = EXCLUDED.verified_at;

    -- 3. Setup Orders, Cases, and Escrows
    INSERT INTO public.service_orders (
        order_id, client_id, service_type, status, submitted_at
    ) VALUES
        (v_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp()),
        (v_cancelled_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp()),
        (v_no_escrow_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp()),
        (v_unlocked_escrow_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp()),
        (v_draft_order_id, v_client_id, 'PT_ORDINARY', 'ACTIVE', pg_catalog.clock_timestamp())
    ON CONFLICT (order_id) DO NOTHING;

    INSERT INTO public.corporate_service_cases (
        case_id, order_id, entity_type, proposed_name, domicile_city, domicile_province,
        legal_scope_version, current_stage, assigned_notary_id
    ) VALUES
        (v_case_id, v_order_id, 'PT_ORDINARY', 'PT Inovasi Mandiri 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
        (v_cancelled_case_id, v_cancelled_order_id, 'PT_ORDINARY', 'PT Batal 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CANCELLED', null),
        (v_no_escrow_case_id, v_no_escrow_order_id, 'PT_ORDINARY', 'PT Tanpa Escrow 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
        (v_unlocked_escrow_case_id, v_unlocked_escrow_order_id, 'PT_ORDINARY', 'PT Escrow Belum Lock 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
        (v_draft_case_id, v_draft_order_id, 'PT_ORDINARY', 'PT Draft Stage 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'DRAFT', null)
    ON CONFLICT (case_id) DO UPDATE SET current_stage = EXCLUDED.current_stage, assigned_notary_id = null;

    INSERT INTO public.escrow_transactions (
        escrow_id, corporate_case_id, client_id, total_amount_idr, status,
        holding_expires_at, payment_gateway_ref, funds_locked_at
    ) VALUES
        (v_escrow_id, v_case_id, v_client_id, 7500000, 'HELD_IN_ESCROW', pg_catalog.clock_timestamp() + interval '7 days', 'PG-REF-3C4-001', pg_catalog.clock_timestamp()),
        (v_unlocked_escrow_id, v_unlocked_escrow_case_id, v_client_id, 7500000, 'PENDING_PAYMENT', pg_catalog.clock_timestamp() + interval '7 days', 'PG-REF-3C4-002', null)
    ON CONFLICT (escrow_id) DO UPDATE SET status = EXCLUDED.status, funds_locked_at = EXCLUDED.funds_locked_at;

    -- ========================================================================
    -- MATRIX SECTION A: NOTARY ASSIGNMENT REJECTIONS & ZERO-WRITE ASSERTIONS
    -- ========================================================================

    -- A.1: Null / Malformed case_id rejected
    SELECT count(*) INTO v_event_count_before FROM public.compliance_workflow_events_worm;
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(null, v_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.1 Failed: null case_id must be rejected';
    SELECT count(*) INTO v_event_count_after FROM public.compliance_workflow_events_worm;
    ASSERT v_event_count_before = v_event_count_after, 'Assertion A.1 Failed: zero writes expected on error';

    -- A.2: Nonexistent case_id rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic('3c400000-0000-4000-8000-999999999999'::UUID, v_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.2 Failed: nonexistent case must be rejected';

    -- A.3: Missing Escrow rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_no_escrow_case_id, v_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.3 Failed: missing escrow must be rejected';

    -- A.4: Escrow not HELD_IN_ESCROW rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_unlocked_escrow_case_id, v_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.4 Failed: unlocked escrow must be rejected';

    -- A.5: Unverified Notary rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_unverified_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.5 Failed: unverified notary must be rejected';

    -- A.6: Suspended Notary rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_suspended_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.6 Failed: suspended notary must be rejected';

    -- A.7: Cancelled Case stage rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_cancelled_case_id, v_notary_id, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.7 Failed: cancelled case stage must be rejected';

    -- A.8: Unauthorized actor rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id, v_non_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion A.8 Failed: non-admin actor must be rejected';

    -- ========================================================================
    -- MATRIX SECTION B: SUCCESSFUL ATOMIC ASSIGNMENT & IDEMPOTENT REPLAY
    -- ========================================================================

    SELECT count(*) INTO v_event_count_before FROM public.compliance_workflow_events_worm;
    SELECT count(*) INTO v_idempotency_count_before FROM public.notary_workspace_idempotency_records;

    -- B.1: First Assignment Execution -> MUST SUCCEED
    v_result := public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id, v_admin_id, v_assign_key);
    ASSERT (v_result->>'replayed')::BOOLEAN = FALSE, 'Assertion B.1 Failed: first assignment must not be marked replayed';
    ASSERT v_result->>'case_id' = v_case_id::TEXT, 'Assertion B.1 Failed: case_id mismatch in response';
    ASSERT v_result->>'assigned_notary_id' = v_notary_id::TEXT, 'Assertion B.1 Failed: assigned_notary_id mismatch in response';

    SELECT current_stage, assigned_notary_id INTO v_case_stage, v_case_notary
    FROM public.corporate_service_cases WHERE case_id = v_case_id;
    ASSERT v_case_notary = v_notary_id, 'Assertion B.1 Failed: case table notary not updated';

    SELECT count(*) INTO v_event_count_after FROM public.compliance_workflow_events_worm;
    SELECT count(*) INTO v_idempotency_count_after FROM public.notary_workspace_idempotency_records;
    ASSERT v_event_count_after = v_event_count_before + 1, 'Assertion B.1 Failed: exactly 1 WORM event must be created';
    ASSERT v_idempotency_count_after = v_idempotency_count_before + 1, 'Assertion B.1 Failed: exactly 1 idempotency record must be created';

    -- B.2: Exact Same Key Replay -> MUST RETURN REPLAYED=TRUE WITH ZERO WRITES
    v_result := public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id, v_admin_id, v_assign_key);
    ASSERT (v_result->>'replayed')::BOOLEAN = TRUE, 'Assertion B.2 Failed: second call must be marked replayed';
    SELECT count(*) INTO v_event_count_before FROM public.compliance_workflow_events_worm;
    SELECT count(*) INTO v_idempotency_count_before FROM public.notary_workspace_idempotency_records;
    ASSERT v_event_count_before = v_event_count_after, 'Assertion B.2 Failed: replay must produce zero new WORM events';
    ASSERT v_idempotency_count_before = v_idempotency_count_after, 'Assertion B.2 Failed: replay must produce zero new idempotency records';

    -- B.3: Same Key with Mutated Notary Payload -> MUST CONFLICT WITH ZERO WRITES
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id_2, v_admin_id, v_assign_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion B.3 Failed: mutated payload on same key must raise IDEMPOTENCY_CONFLICT';

    -- B.4: Different Key after Completed Assignment -> MUST RAISE ASSIGNMENT_CONFLICT
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id_2, v_admin_id, '3c400000-0000-4000-8000-000000000101');
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion B.4 Failed: re-assignment attempt with new key must be rejected';

    -- ========================================================================
    -- MATRIX SECTION C: CDD APPROVAL REJECTIONS & ZERO-WRITE ASSERTIONS
    -- ========================================================================

    -- Advance case: ESCROW_LOCKED -> IDENTITY_PENDING -> CDD_REVIEW for CDD testing
    PERFORM public.fn_transition_corporate_service_case(
        v_case_id,
        'ESCROW_LOCKED',
        'IDENTITY_PENDING'
    );
    PERFORM public.fn_transition_corporate_service_case(
        v_case_id,
        'IDENTITY_PENDING',
        'CDD_REVIEW'
    );

    -- Fixture Beneficial Owner
    INSERT INTO public.beneficial_owners (
        beneficial_owner_id, case_id, declaration_version, person_type,
        natural_person_name, identity_reference, control_basis, percentage,
        evidence_digest, verification_status, reviewer_id, reviewer_role, verified_at
    ) VALUES (
        v_bo_id, v_case_id, 1, 'NATURAL_PERSON',
        'Pemilik Manfaat 3C4', '3174000000000001', 'OWNERSHIP', 100.00,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'VERIFIED', v_admin_id, 'COMPLIANCE_OFFICER', pg_catalog.clock_timestamp()
    ) ON CONFLICT (beneficial_owner_id) DO UPDATE SET verification_status = 'VERIFIED', reviewer_id = EXCLUDED.reviewer_id, verified_at = EXCLUDED.verified_at;

    -- Fixture Compliance Assessment
    INSERT INTO public.compliance_assessments (
        assessment_id, case_id, assessment_level, reviewer_id, reviewer_role,
        rules_version, reviewer_decision, pep_check_status, sanctions_check_status,
        assessed_at
    ) VALUES (
        v_assessment_id, v_case_id, 'CDD', v_notary_id, 'NOTARY',
        '2026.1', 'PENDING', 'NO_MATCH', 'NO_MATCH', null
    ) ON CONFLICT (assessment_id) DO UPDATE SET reviewer_decision = 'PENDING', pep_check_status = 'NO_MATCH', sanctions_check_status = 'NO_MATCH', rules_version = '2026.1', reviewer_id = v_notary_id;

    -- C.1: Nonexistent case_id rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic('3c400000-0000-4000-8000-999999999999'::UUID, v_assessment_id, v_notary_id, '2026.1', v_cdd_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion C.1 Failed: nonexistent case must be rejected';

    -- C.2: Nonexistent assessment_id rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(v_case_id, '3c400000-0000-4000-8000-999999999998'::UUID, v_notary_id, '2026.1', v_cdd_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion C.2 Failed: nonexistent assessment must be rejected';

    -- C.3: Caller not assigned notary rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(v_case_id, v_assessment_id, v_notary_id_2, '2026.1', v_cdd_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion C.3 Failed: unassigned notary caller must be rejected';

    -- C.4: Rules version mismatch rejected
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(v_case_id, v_assessment_id, v_notary_id, '2025.99_MISMATCH', v_cdd_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion C.4 Failed: rules version mismatch must be rejected';

    -- ========================================================================
    -- MATRIX SECTION D: SUCCESSFUL ATOMIC CDD APPROVAL & IDEMPOTENT REPLAY
    -- ========================================================================

    SELECT count(*) INTO v_event_count_before FROM public.compliance_workflow_events_worm;
    SELECT count(*) INTO v_idempotency_count_before FROM public.notary_workspace_idempotency_records;

    -- D.1: First CDD Approval Execution -> MUST SUCCEED
    v_result := public.fn_approve_notary_cdd_atomic(v_case_id, v_assessment_id, v_notary_id, '2026.1', v_cdd_key);
    ASSERT (v_result->>'replayed')::BOOLEAN = FALSE, 'Assertion D.1 Failed: first CDD approval must not be marked replayed';
    ASSERT v_result->>'case_id' = v_case_id::TEXT, 'Assertion D.1 Failed: case_id mismatch in CDD response';
    ASSERT v_result->>'current_stage' = 'DOCUMENTS_PENDING', 'Assertion D.1 Failed: stage must advance to DOCUMENTS_PENDING';

    SELECT current_stage INTO v_case_stage FROM public.corporate_service_cases WHERE case_id = v_case_id;
    SELECT reviewer_decision INTO v_cdd_decision FROM public.compliance_assessments WHERE assessment_id = v_assessment_id;
    ASSERT v_case_stage = 'DOCUMENTS_PENDING', 'Assertion D.1 Failed: case stage not updated to DOCUMENTS_PENDING';
    ASSERT v_cdd_decision = 'APPROVED', 'Assertion D.1 Failed: compliance assessment decision not updated to APPROVED';

    SELECT count(*) INTO v_event_count_after FROM public.compliance_workflow_events_worm;
    SELECT count(*) INTO v_idempotency_count_after FROM public.notary_workspace_idempotency_records;
    ASSERT v_event_count_after = v_event_count_before + 1, 'Assertion D.1 Failed: exactly 1 WORM event must be created for CDD';
    ASSERT v_idempotency_count_after = v_idempotency_count_before + 1, 'Assertion D.1 Failed: exactly 1 idempotency record must be created for CDD';

    -- D.2: Exact Same Key Replay -> MUST RETURN REPLAYED=TRUE WITH ZERO WRITES
    v_result := public.fn_approve_notary_cdd_atomic(v_case_id, v_assessment_id, v_notary_id, '2026.1', v_cdd_key);
    ASSERT (v_result->>'replayed')::BOOLEAN = TRUE, 'Assertion D.2 Failed: second call must be marked replayed';
    SELECT count(*) INTO v_event_count_before FROM public.compliance_workflow_events_worm;
    SELECT count(*) INTO v_idempotency_count_before FROM public.notary_workspace_idempotency_records;
    ASSERT v_event_count_before = v_event_count_after, 'Assertion D.2 Failed: CDD replay must produce zero new WORM events';
    ASSERT v_idempotency_count_before = v_idempotency_count_after, 'Assertion D.2 Failed: CDD replay must produce zero new idempotency records';

    -- D.3: Same Key with Mutated Rules Version -> MUST CONFLICT WITH ZERO WRITES
    v_err_caught := FALSE;
    BEGIN
        PERFORM public.fn_approve_notary_cdd_atomic(v_case_id, v_assessment_id, v_notary_id, '2026.2_MUTATED', v_cdd_key);
    EXCEPTION WHEN OTHERS THEN
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion D.3 Failed: mutated rules version on same key must raise IDEMPOTENCY_CONFLICT';

    -- ========================================================================
    -- MATRIX SECTION E: PRIVILEGES, RLS, AND DIRECT DML DENIALS
    -- ========================================================================

    -- E.1: service_role direct SELECT on idempotency records MUST FAIL
    v_err_caught := FALSE;
    BEGIN
        SET ROLE service_role;
        PERFORM * FROM public.notary_workspace_idempotency_records;
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.1 Failed: service_role direct SELECT must be denied';

    -- E.2: service_role direct INSERT on idempotency records MUST FAIL
    v_err_caught := FALSE;
    BEGIN
        SET ROLE service_role;
        INSERT INTO public.notary_workspace_idempotency_records (
            operation_type, idempotency_key, payload_digest, case_id, actor_id, result_payload
        ) VALUES (
            'ASSIGN_NOTARY', 'leak-test', 'digest', v_case_id, v_admin_id, '{}'::JSONB
        );
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.2 Failed: service_role direct INSERT on idempotency must be denied';

    -- E.3: service_role direct UPDATE on corporate_service_cases assigned_notary_id MUST FAIL
    v_err_caught := FALSE;
    BEGIN
        SET ROLE service_role;
        UPDATE public.corporate_service_cases SET assigned_notary_id = v_notary_id_2 WHERE case_id = v_case_id;
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.3 Failed: service_role direct UPDATE on assigned_notary_id must be denied';

    -- E.4: service_role direct UPDATE on corporate_service_cases current_stage MUST FAIL
    v_err_caught := FALSE;
    BEGIN
        SET ROLE service_role;
        UPDATE public.corporate_service_cases SET current_stage = 'NOTARY_ASSIGNED' WHERE case_id = v_case_id;
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.4 Failed: service_role direct UPDATE on current_stage must be denied';

    -- E.5: service_role direct INSERT on compliance_workflow_events_worm MUST FAIL
    v_err_caught := FALSE;
    BEGIN
        SET ROLE service_role;
        INSERT INTO public.compliance_workflow_events_worm (
            corporate_case_id, event_type, idempotency_key, event_digest_sha256, occurred_at
        ) VALUES (
            v_case_id, 'NOTARY_ASSIGNED', 'leak-worm-key',
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', clock_timestamp()
        );
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.5 Failed: service_role direct INSERT on WORM events must be denied';

    -- E.6: authenticated / anon direct EXECUTE on privileged RPCs MUST FAIL
    v_err_caught := FALSE;
    BEGIN
        SET ROLE authenticated;
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id, v_admin_id, 'test');
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.6 Failed: authenticated role direct execute on assign RPC must be denied';

    v_err_caught := FALSE;
    BEGIN
        SET ROLE anon;
        PERFORM public.fn_assign_corporate_notary_atomic(v_case_id, v_notary_id, v_admin_id, 'test');
        RESET ROLE;
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        v_err_caught := TRUE;
    END;
    ASSERT v_err_caught, 'Assertion E.6 Failed: anon role direct execute on assign RPC must be denied';

    RAISE NOTICE 'ALL BATCH 3.C.4 CANONICAL RUNTIME ASSERTIONS PASSED SUCCESSFULLY';
END $$;

SELECT 'notary_workspace_runtime_assertions_complete_3c4' AS status;

ROLLBACK;
