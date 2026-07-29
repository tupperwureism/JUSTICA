\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE phase2_forensic_ids AS
SELECT
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS client_id,
    '92000000-0000-0000-0000-000000000001'::UUID AS order_id,
    '93000000-0000-0000-0000-000000000001'::UUID AS envelope_id,
    '94000000-0000-0000-0000-000000000001'::UUID AS pricing_catalog_id,
    pg_catalog.clock_timestamp() AS callback_at,
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS auth_user_id;

DO $$
BEGIN
    IF (SELECT auth_user_id FROM phase2_forensic_ids) IS NULL THEN
        RAISE EXCEPTION 'FORENSIC_FIXTURE_REQUIRES_ONE_LOCAL_AUTH_USER';
    END IF;
END;
$$;

INSERT INTO public.users_client (
    client_id,
    full_name,
    email,
    phone_e164,
    kyc_status,
    password_hash
)
SELECT
    client_id,
    'Phase 2 Forensic Client',
    'phase2-forensic-client@example.invalid',
    '+620000000001',
    'VERIFIED',
    '!FORENSIC_ROLLBACK!'
FROM phase2_forensic_ids
ON CONFLICT (client_id) DO UPDATE
SET kyc_status = EXCLUDED.kyc_status;

INSERT INTO public.users_advocate (
    advocate_id,
    full_name,
    email,
    phone_e164,
    sipp_license_no,
    peradi_card_no,
    specialization_primary,
    kyc_status
)
SELECT
    auth_user_id,
    'Phase 2 Forensic Notary Seam',
    'phase2-forensic-notary@example.invalid',
    '+620000000002',
    'SIPP-FORENSIC-0001',
    'PERADI-FORENSIC-0001',
    'CORPORATE',
    'VERIFIED'
FROM phase2_forensic_ids
ON CONFLICT (advocate_id) DO UPDATE
SET kyc_status = 'VERIFIED';

INSERT INTO public.corporate_pricing_catalogs (
    catalog_id,
    service_type,
    quote_version,
    legal_scope_version,
    currency,
    total_amount_idr,
    effective_from
)
SELECT
    pricing_catalog_id,
    'PT_ORDINARY',
    71,
    'LEGAL-SCOPE-P2-1',
    'IDR',
    100000,
    pg_catalog.clock_timestamp() - INTERVAL '1 minute'
FROM phase2_forensic_ids;

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id,
    fee_line_code,
    fee_type,
    description,
    amount
)
SELECT
    pricing_catalog_id,
    'FORENSIC-INTAKE',
    'JUSTICA_FEE',
    'Synthetic forensic intake fee',
    100000
FROM phase2_forensic_ids;

INSERT INTO public.corporate_pricing_milestones (
    catalog_id,
    milestone_type,
    sequence_number,
    amount,
    releasable_party,
    evidence_condition,
    dispute_refund_rule
)
SELECT
    pricing_catalog_id,
    'DEPOSIT_INTAKE',
    1,
    100000,
    'JUSTICA',
    'Validated forensic intake',
    'Full refund before professional work'
FROM phase2_forensic_ids;

SELECT public.fn_activate_corporate_pricing_catalog(
    (SELECT pricing_catalog_id FROM phase2_forensic_ids)
);

SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT order_id FROM phase2_forensic_ids),
    (SELECT client_id FROM phase2_forensic_ids),
    'PT_ORDINARY',
    'PT Forensic Integrasi',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Forensic Founder",
        "identity_reference": "opaque-party-ref-001",
        "ownership_percentage": 100,
        "voting_percentage": 100
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Forensic Owner",
        "identity_reference": "opaque-bo-ref-001",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'FORENSIC-PAYMENT-REFERENCE',
    'forensic-intake-001',
    (SELECT auth_user_id FROM phase2_forensic_ids)
);

DO $$
DECLARE
    v_order_id UUID := (SELECT order_id FROM phase2_forensic_ids);
    v_case_id UUID;
BEGIN
    SELECT case_id
    INTO v_case_id
    FROM public.corporate_service_cases
    WHERE order_id = v_order_id;

    IF (SELECT count(*) FROM public.corporate_parties WHERE case_id = v_case_id) <> 1
       OR (SELECT count(*) FROM public.beneficial_owners WHERE case_id = v_case_id) <> 1
       OR (SELECT count(*) FROM public.service_fee_lines WHERE order_id = v_order_id) <> 1
       OR (SELECT count(*) FROM public.payment_milestones WHERE order_id = v_order_id) <> 1
       OR (SELECT status FROM public.service_orders WHERE order_id = v_order_id)
            <> 'PAYMENT_PENDING' THEN
        RAISE EXCEPTION 'FORENSIC_COMPLETE_INTAKE_ASSERTION_FAILED';
    END IF;
END;
$$;

DO $$
DECLARE
    v_case_id UUID;
    v_escrow public.escrow_transactions%ROWTYPE;
    v_auth_user_id UUID := (SELECT auth_user_id FROM phase2_forensic_ids);
BEGIN
    SELECT escrow.*
    INTO v_escrow
    FROM public.corporate_service_cases AS corporate_case
    JOIN public.escrow_transactions AS escrow
      ON escrow.corporate_case_id = corporate_case.case_id
    WHERE corporate_case.order_id = (SELECT order_id FROM phase2_forensic_ids);
    v_case_id := v_escrow.corporate_case_id;

    BEGIN
        UPDATE public.corporate_service_cases
        SET assigned_notary_id = v_auth_user_id
        WHERE case_id = v_case_id;
        RAISE EXCEPTION 'EXPECTED_NOTARY_ASSIGNMENT_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'NOTARY_ASSIGNMENT_REQUIRES_HELD_ESCROW'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        INSERT INTO public.signing_envelopes (
            envelope_id,
            case_type,
            case_id,
            provider_name,
            external_envelope_id,
            document_title,
            document_sha256_hash,
            created_by,
            escrow_id,
            escrow_locked_at,
            expires_at
        ) VALUES (
            (SELECT envelope_id FROM phase2_forensic_ids),
            'CORPORATE',
            v_case_id,
            'FORENSIC_PROVIDER',
            'FORENSIC-ENVELOPE-PREMATURE',
            'Premature Envelope',
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            v_auth_user_id,
            v_escrow.escrow_id,
            pg_catalog.clock_timestamp(),
            pg_catalog.clock_timestamp() + INTERVAL '7 days'
        );
        RAISE EXCEPTION 'EXPECTED_PREMATURE_ENVELOPE_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'SIGNING_ESCROW_MUST_BE_HELD') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

SELECT *
FROM public.fn_lock_corporate_escrow_atomic(
    (
        SELECT corporate_case.case_id
        FROM public.corporate_service_cases AS corporate_case
        WHERE corporate_case.order_id = (SELECT order_id FROM phase2_forensic_ids)
    ),
    (
        SELECT escrow.escrow_id
        FROM public.escrow_transactions AS escrow
        WHERE escrow.corporate_case_id = (
            SELECT corporate_case.case_id
            FROM public.corporate_service_cases AS corporate_case
            WHERE corporate_case.order_id = (SELECT order_id FROM phase2_forensic_ids)
        )
    ),
    100000,
    'FORENSIC-PAYMENT-REFERENCE',
    'forensic-lock-001',
    (SELECT auth_user_id FROM phase2_forensic_ids)
);

UPDATE public.corporate_service_cases
SET assigned_notary_id = (SELECT auth_user_id FROM phase2_forensic_ids)
WHERE order_id = (SELECT order_id FROM phase2_forensic_ids);

INSERT INTO public.signing_envelopes (
    envelope_id,
    case_type,
    case_id,
    provider_name,
    external_envelope_id,
    document_title,
    document_sha256_hash,
    created_by,
    escrow_id,
    escrow_locked_at,
    expires_at
)
SELECT
    ids.envelope_id,
    'CORPORATE',
    corporate_case.case_id,
    'FORENSIC_PROVIDER',
    'FORENSIC-ENVELOPE-VALID',
    'Valid Envelope',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    ids.auth_user_id,
    escrow.escrow_id,
    escrow.funds_locked_at,
    escrow.funds_locked_at + INTERVAL '7 days'
FROM phase2_forensic_ids AS ids
JOIN public.corporate_service_cases AS corporate_case
  ON corporate_case.order_id = ids.order_id
JOIN public.escrow_transactions AS escrow
  ON escrow.corporate_case_id = corporate_case.case_id;

INSERT INTO public.government_submission_jobs (
    case_id,
    system,
    status,
    authorized_submitter_id,
    request_digest,
    idempotency_key,
    target_system,
    submission_status,
    authorized_notary_id,
    submission_payload_digest_sha256
)
SELECT
    corporate_case.case_id,
    'AHU_SABH',
    'PENDING',
    ids.auth_user_id,
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    'forensic-government-job-001',
    'AHU_SABH',
    'DRAFT',
    ids.auth_user_id,
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
FROM phase2_forensic_ids AS ids
JOIN public.corporate_service_cases AS corporate_case
  ON corporate_case.order_id = ids.order_id;

UPDATE public.government_submission_jobs
SET submission_status = 'SUBMITTED',
    submitted_at = pg_catalog.clock_timestamp()
WHERE idempotency_key = 'forensic-government-job-001';
UPDATE public.government_submission_jobs
SET submission_status = 'REJECTED',
    decided_at = pg_catalog.clock_timestamp()
WHERE idempotency_key = 'forensic-government-job-001';

DO $$
BEGIN
    BEGIN
        UPDATE public.government_submission_jobs
        SET submission_status = 'APPROVED'
        WHERE idempotency_key = 'forensic-government-job-001';
        RAISE EXCEPTION 'EXPECTED_REJECTED_TO_APPROVED_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'GOVERNMENT_SUBMISSION_TRANSITION_FORBIDDEN'
            ) = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

INSERT INTO public.wallet_balances (
    user_id,
    user_type,
    balance_available_idr,
    balance_held_idr
)
SELECT client_id, 'CLIENT', 0, 0
FROM phase2_forensic_ids;

INSERT INTO public.signing_envelope_parties (
    envelope_id,
    party_user_id,
    party_role,
    signer_email,
    signing_order
)
SELECT
    envelope_id,
    auth_user_id,
    'CLIENT',
    'phase2-forensic-party@example.invalid',
    1
FROM phase2_forensic_ids;

SELECT *
FROM public.fn_process_ekyc_callback_atomic(
    (SELECT envelope_id FROM phase2_forensic_ids),
    (
        SELECT party_id
        FROM public.signing_envelope_parties
        WHERE envelope_id = (SELECT envelope_id FROM phase2_forensic_ids)
    ),
    (SELECT auth_user_id FROM phase2_forensic_ids),
    'client'::public.ekyc_user_role,
    'FORENSIC_EKYC_PROVIDER',
    'FORENSIC-EKYC-ILLEGAL-001',
    'LIVENESS_OCR'::public.ekyc_verification_type,
    'ILLEGAL_CONFIRMED',
    0::SMALLINT,
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    (SELECT callback_at FROM phase2_forensic_ids),
    'forensic-ekyc-illegal-001'
);

SELECT *
FROM public.fn_process_ekyc_callback_atomic(
    (SELECT envelope_id FROM phase2_forensic_ids),
    (
        SELECT party_id
        FROM public.signing_envelope_parties
        WHERE envelope_id = (SELECT envelope_id FROM phase2_forensic_ids)
    ),
    (SELECT auth_user_id FROM phase2_forensic_ids),
    'client'::public.ekyc_user_role,
    'FORENSIC_EKYC_PROVIDER',
    'FORENSIC-EKYC-ILLEGAL-001',
    'LIVENESS_OCR'::public.ekyc_verification_type,
    'ILLEGAL_CONFIRMED',
    0::SMALLINT,
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    (SELECT callback_at FROM phase2_forensic_ids),
    'forensic-ekyc-illegal-001'
);

DO $$
DECLARE
    v_client_id UUID := (SELECT client_id FROM phase2_forensic_ids);
    v_escrow_id UUID;
BEGIN
    SELECT escrow.escrow_id
    INTO v_escrow_id
    FROM public.escrow_transactions AS escrow
    JOIN public.corporate_service_cases AS corporate_case
      ON corporate_case.case_id = escrow.corporate_case_id
    WHERE corporate_case.order_id = (SELECT order_id FROM phase2_forensic_ids);

    IF (SELECT status FROM public.escrow_transactions WHERE escrow_id = v_escrow_id)
            <> 'REFUNDED_TO_CLIENT'
       OR (SELECT global_status FROM public.signing_envelopes
           WHERE envelope_id = (SELECT envelope_id FROM phase2_forensic_ids))
            <> 'REFUNDED'
       OR (SELECT balance_available_idr FROM public.wallet_balances
           WHERE user_id = v_client_id AND user_type = 'CLIENT') <> 100000
       OR (SELECT count(*) FROM public.escrow_payout_ledgers
           WHERE escrow_id = v_escrow_id AND mutation_type = 'REFUND_CLIENT') <> 1 THEN
        RAISE EXCEPTION 'FORENSIC_EKYC_REFUND_IDEMPOTENCY_FAILED';
    END IF;
END;
$$;

DO $$
BEGIN
    BEGIN
        DELETE FROM public.escrow_payout_ledgers
        WHERE escrow_id = (
            SELECT escrow.escrow_id
            FROM public.escrow_transactions AS escrow
            JOIN public.corporate_service_cases AS corporate_case
              ON corporate_case.case_id = escrow.corporate_case_id
            WHERE corporate_case.order_id = (
                SELECT order_id FROM phase2_forensic_ids
            )
        )
          AND mutation_type = 'REFUND_CLIENT';
        RAISE EXCEPTION 'EXPECTED_WORM_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'WORM Vault violation') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

DO $$
DECLARE
    v_client_id UUID := (SELECT client_id FROM phase2_forensic_ids);
    v_order_id UUID := (SELECT order_id FROM phase2_forensic_ids);
    v_visible INTEGER;
BEGIN
    PERFORM pg_catalog.set_config(
        'request.jwt.claims',
        pg_catalog.jsonb_build_object(
            'sub',
            v_client_id,
            'role',
            'authenticated'
        )::TEXT,
        true
    );
    SET LOCAL ROLE authenticated;
    SELECT count(*)
    INTO v_visible
    FROM public.service_orders
    WHERE order_id = v_order_id;
    RESET ROLE;
    IF v_visible <> 1 THEN
        RAISE EXCEPTION 'FORENSIC_RLS_OWNER_VISIBILITY_FAILED';
    END IF;

    PERFORM pg_catalog.set_config(
        'request.jwt.claims',
        '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff","role":"authenticated"}',
        true
    );
    SET LOCAL ROLE authenticated;
    SELECT count(*)
    INTO v_visible
    FROM public.service_orders
    WHERE order_id = v_order_id;
    RESET ROLE;
    IF v_visible <> 0 THEN
        RAISE EXCEPTION 'FORENSIC_RLS_CROSS_TENANT_LEAK';
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
          AND conrelid = 'public.document_integrity_anchors'::regclass
          AND NOT convalidated
    ) THEN
        RAISE EXCEPTION 'FORENSIC_UNVALIDATED_ANCHOR_CONSTRAINT';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_trigger AS trigger
        JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
        JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public'
          AND relation.relname IN (
              'escrow_payout_ledgers',
              'compliance_workflow_events_worm',
              'document_integrity_anchors',
              'payout_idempotency_keys',
              'provider_webhook_events',
              'signing_envelopes',
              'signing_envelope_parties'
          )
          AND trigger.tgname LIKE ANY (ARRAY[
              '%worm%',
              '%guard%',
              '%validate%'
          ])
          AND trigger.tgenabled <> 'A'
          AND NOT trigger.tgisinternal
    ) THEN
        RAISE EXCEPTION 'FORENSIC_CRITICAL_TRIGGER_NOT_ALWAYS';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_proc AS procedure
        JOIN pg_namespace AS namespace
          ON namespace.oid = procedure.pronamespace
        WHERE namespace.nspname = 'public'
          AND procedure.prosecdef
          AND (
              procedure.proconfig IS NULL
              OR procedure.proconfig::TEXT ILIKE '%pg_temp%'
          )
    ) THEN
        RAISE EXCEPTION 'FORENSIC_PRIVILEGED_SEARCH_PATH_LEAK';
    END IF;
END;
$$;

ROLLBACK;
