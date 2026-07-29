\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
    IF pg_catalog.to_regprocedure(
        'private.fn_current_phase2_admin_role_group()'
    ) IS NULL THEN
        RAISE EXCEPTION 'PHASE2_PRIVATE_ADMIN_HELPER_MISSING';
    END IF;

    IF pg_catalog.to_regprocedure(
        'private.fn_enforce_canonical_intake_snapshot()'
    ) IS NULL THEN
        RAISE EXCEPTION 'CANONICAL_SNAPSHOT_INVARIANT_MISSING';
    END IF;

    IF pg_catalog.has_table_privilege(
        'service_role',
        'public.service_fee_lines',
        'INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'service_role',
        'public.payment_milestones',
        'INSERT,UPDATE,DELETE'
    ) THEN
        RAISE EXCEPTION 'SERVICE_ROLE_SNAPSHOT_DML_STILL_OPEN';
    END IF;

    IF pg_catalog.has_column_privilege(
        'service_role',
        'public.corporate_service_cases',
        'legal_scope_version',
        'UPDATE'
    ) THEN
        RAISE EXCEPTION 'SERVICE_ROLE_LEGAL_SCOPE_UPDATE_STILL_OPEN';
    END IF;
END;
$$;

CREATE TEMP TABLE canonical_snapshot_ids AS
SELECT
    '11111111-1111-4111-8111-111111111111'::UUID AS client_id,
    '22222222-2222-4222-8222-222222222222'::UUID AS professional_id,
    '33333333-3333-4333-8333-333333333333'::UUID AS super_admin_id,
    '44444444-4444-4444-8444-444444444444'::UUID AS compliance_id,
    '55555555-5555-4555-8555-555555555555'::UUID AS notary_id,
    'ffffffff-ffff-4fff-8fff-ffffffffffff'::UUID AS unrelated_id,
    'a3100000-0000-4000-8000-000000000001'::UUID AS order_id,
    'a3200000-0000-4000-8000-000000000001'::UUID AS assessment_id,
    'a3200000-0000-4000-8000-000000000002'::UUID
        AS notary_assessment_id,
    'b1000000-0000-4000-8000-000000000001'::UUID AS catalog_id;

DO $$
DECLARE
    v_helper REGPROCEDURE := pg_catalog.to_regprocedure(
        'private.fn_current_phase2_admin_role_group()'
    );
    v_invariant REGPROCEDURE := pg_catalog.to_regprocedure(
        'private.fn_enforce_canonical_intake_snapshot()'
    );
    v_new_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_from_catalog_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,jsonb,jsonb,character varying,character varying,uuid)'
    );
    v_old_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_complete_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,character varying,jsonb,jsonb,jsonb,jsonb,numeric,character varying,character varying,uuid)'
    );
BEGIN
    IF pg_catalog.has_table_privilege(
        'authenticated',
        'public.users_admin',
        'SELECT'
    ) THEN
        RAISE EXCEPTION 'AUTHENTICATED_USERS_ADMIN_SELECT_OPEN';
    END IF;

    IF NOT pg_catalog.has_schema_privilege(
        'authenticated',
        'private',
        'USAGE'
    ) OR pg_catalog.has_schema_privilege(
        'anon',
        'private',
        'USAGE'
    ) OR pg_catalog.has_schema_privilege(
        'service_role',
        'private',
        'USAGE'
    ) THEN
        RAISE EXCEPTION 'PRIVATE_SCHEMA_ACL_INVALID';
    END IF;

    IF NOT pg_catalog.has_function_privilege(
        'authenticated',
        v_helper,
        'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
        'anon',
        v_helper,
        'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
        'service_role',
        v_helper,
        'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
        'authenticated',
        v_invariant,
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'PRIVATE_FUNCTION_ACL_INVALID';
    END IF;

    IF pg_catalog.has_function_privilege(
        'service_role',
        v_new_rpc,
        'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
        'service_role',
        v_old_rpc,
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'INTAKE_RPC_ACL_REGRESSION';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_proc AS proc
        JOIN pg_catalog.pg_namespace AS namespace
          ON namespace.oid = proc.pronamespace
        WHERE namespace.nspname = 'private'
          AND proc.proname = 'fn_current_phase2_admin_role_group'
          AND (
              proc.pronargs <> 0
              OR NOT proc.prosecdef
              OR proc.provolatile <> 's'
              OR proc.proconfig IS DISTINCT FROM ARRAY['search_path=""']::TEXT[]
          )
    ) OR NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_proc AS proc
        JOIN pg_catalog.pg_namespace AS namespace
          ON namespace.oid = proc.pronamespace
        WHERE namespace.nspname = 'private'
          AND proc.proname = 'fn_current_phase2_admin_role_group'
          AND proc.pronargs = 0
          AND proc.prosecdef
          AND proc.provolatile = 's'
    ) THEN
        RAISE EXCEPTION 'PRIVATE_ADMIN_HELPER_CONTRACT_INVALID';
    END IF;

    IF (
        SELECT pg_catalog.count(*)
        FROM pg_catalog.pg_trigger AS trigger
        JOIN pg_catalog.pg_class AS relation
          ON relation.oid = trigger.tgrelid
        JOIN pg_catalog.pg_namespace AS namespace
          ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public'
          AND trigger.tgname LIKE 'trg_assert_canonical_snapshot_%'
          AND trigger.tgdeferrable
          AND trigger.tginitdeferred
          AND trigger.tgenabled = 'A'
    ) <> 5 THEN
        RAISE EXCEPTION 'CANONICAL_SNAPSHOT_TRIGGER_CONTRACT_INVALID';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_policy AS policy
        WHERE COALESCE(
            pg_catalog.pg_get_expr(policy.polqual, policy.polrelid),
            ''
        ) LIKE '%users_admin%'
           OR COALESCE(
                pg_catalog.pg_get_expr(
                    policy.polwithcheck,
                    policy.polrelid
                ),
                ''
           ) LIKE '%users_admin%'
    ) THEN
        RAISE EXCEPTION 'AUTHENTICATED_POLICY_STILL_READS_USERS_ADMIN';
    END IF;
END;
$$;

INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
SELECT
    compliance_id,
    'authenticated',
    'authenticated',
    'phase2-compliance-runtime@example.invalid',
    '{"provider":"email","providers":["email"]}'::JSONB,
    '{"role_group":"CLIENT_CONTROLLED_SUPER_ADMIN"}'::JSONB,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
FROM canonical_snapshot_ids;

INSERT INTO public.users_admin (
    admin_id,
    full_name,
    email,
    role_group,
    fido2_enabled
)
SELECT
    compliance_id,
    'Phase 2 Runtime Compliance',
    'phase2-compliance-runtime@example.invalid',
    'COMPLIANCE_OFFICER',
    false
FROM canonical_snapshot_ids;

INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
SELECT
    notary_id,
    'authenticated',
    'authenticated',
    'phase2-notary-runtime@example.invalid',
    '{"provider":"email","providers":["email"]}'::JSONB,
    '{}'::JSONB,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
FROM canonical_snapshot_ids;

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
    notary_id,
    'Phase 2 Runtime Notary',
    'phase2-notary-runtime@example.invalid',
    '+620000005555',
    'SIPP-RUNTIME-NOTARY',
    'PERADI-RUNTIME-NOTARY',
    'CORPORATE_NOTARIAL',
    'VERIFIED'
FROM canonical_snapshot_ids;

GRANT SELECT ON TABLE canonical_snapshot_ids TO service_role;

SET LOCAL ROLE postgres;
CREATE TEMP TABLE canonical_intake_result AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT order_id FROM canonical_snapshot_ids),
    (SELECT client_id FROM canonical_snapshot_ids),
    'CV',
    'CV Runtime Snapshot Kanonik',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "ACTIVE_PARTNER",
        "display_name": "Runtime Partner",
        "identity_reference": "protected-runtime-party",
        "ownership_percentage": 100,
        "voting_percentage": 100
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Runtime Beneficial Owner",
        "identity_reference": "protected-runtime-owner",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest":
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'RUNTIME-SNAPSHOT-GATEWAY',
    'runtime-snapshot-intake',
    (SELECT client_id FROM canonical_snapshot_ids)
);
RESET ROLE;
GRANT SELECT ON TABLE canonical_intake_result TO service_role;

SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

DO $$
DECLARE
    v_order_id UUID := (SELECT order_id FROM canonical_snapshot_ids);
BEGIN
    IF (SELECT replayed FROM canonical_intake_result)
       OR (SELECT pricing_catalog_id FROM canonical_intake_result)
            <> (SELECT catalog_id FROM canonical_snapshot_ids)
       OR (SELECT pg_catalog.count(*) FROM public.service_fee_lines
           WHERE order_id = v_order_id) <> 2
       OR (SELECT pg_catalog.count(*) FROM public.payment_milestones
           WHERE order_id = v_order_id) <> 2 THEN
        RAISE EXCEPTION 'CANONICAL_INTAKE_INITIAL_SNAPSHOT_INVALID';
    END IF;
END;
$$;

SET LOCAL ROLE service_role;
DO $$
BEGIN
    BEGIN
        INSERT INTO public.service_fee_lines (
            order_id,
            fee_line_code,
            fee_type,
            description,
            amount,
            currency,
            quote_version
        ) VALUES (
            (SELECT order_id FROM canonical_snapshot_ids),
            'SERVICE-ROLE-DRIFT',
            'OTHER_APPROVED',
            'Must be rejected by ACL',
            1,
            'IDR',
            1
        );
        RAISE EXCEPTION 'EXPECTED_SERVICE_ROLE_FEE_INSERT_DENIAL';
    EXCEPTION
        WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        INSERT INTO public.payment_milestones (
            order_id,
            milestone_type,
            sequence_number,
            amount,
            currency,
            quote_version,
            status
        ) VALUES (
            (SELECT order_id FROM canonical_snapshot_ids),
            'AHU_COMPLETE',
            3,
            1,
            'IDR',
            1,
            'PENDING'
        );
        RAISE EXCEPTION 'EXPECTED_SERVICE_ROLE_MILESTONE_INSERT_DENIAL';
    EXCEPTION
        WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        UPDATE public.corporate_service_cases
        SET legal_scope_version = 'SERVICE-ROLE-DRIFT'
        WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids);
        RAISE EXCEPTION 'EXPECTED_SERVICE_ROLE_LEGAL_SCOPE_UPDATE_DENIAL';
    EXCEPTION
        WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        UPDATE public.corporate_service_cases
        SET entity_type = 'PT_ORDINARY'
        WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids);
        SET CONSTRAINTS ALL IMMEDIATE;
        RAISE EXCEPTION 'EXPECTED_SERVICE_ROLE_CASE_TYPE_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'CANONICAL_SNAPSHOT_CASE_MISMATCH'
            ) = 0
               AND pg_catalog.strpos(
                    SQLERRM,
                    'CORPORATE_ORDER_TYPE_MISMATCH'
               ) = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;
RESET ROLE;

-- A paired fee/milestone addition passes the legacy sum reconciliation but must
-- fail the exact catalog-set invariant. The subtransaction rollback proves zero
-- partial write.
DO $$
DECLARE
    v_order_id UUID := (SELECT order_id FROM canonical_snapshot_ids);
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
BEGIN
    BEGIN
        INSERT INTO public.service_fee_lines (
            order_id,
            fee_line_code,
            fee_type,
            description,
            amount,
            currency,
            quote_version,
            accepted_at,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            'PRIVILEGED-EXTRA',
            'OTHER_APPROVED',
            'Privileged drift attempt',
            1,
            'IDR',
            1,
            v_now,
            v_now,
            v_now
        );

        INSERT INTO public.payment_milestones (
            order_id,
            milestone_type,
            sequence_number,
            amount,
            currency,
            quote_version,
            status,
            releasable_party,
            evidence_condition,
            dispute_refund_rule
        ) VALUES (
            v_order_id,
            'AHU_COMPLETE',
            3,
            1,
            'IDR',
            1,
            'PENDING',
            'GOVERNMENT',
            'Privileged drift attempt',
            'Privileged drift attempt'
        );

        SET CONSTRAINTS ALL IMMEDIATE;
        RAISE EXCEPTION 'EXPECTED_CANONICAL_SET_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'CANONICAL_SNAPSHOT_'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    IF (SELECT pg_catalog.count(*) FROM public.service_fee_lines
        WHERE order_id = v_order_id) <> 2
       OR (SELECT pg_catalog.count(*) FROM public.payment_milestones
           WHERE order_id = v_order_id) <> 2 THEN
        RAISE EXCEPTION 'CANONICAL_SET_FAILURE_LEFT_PARTIAL_WRITE';
    END IF;
END;
$$;

DO $$
DECLARE
    v_order_id UUID := (SELECT order_id FROM canonical_snapshot_ids);
    v_case_id UUID := (
        SELECT corporate_case_id FROM canonical_intake_result
    );
    v_escrow_id UUID := (SELECT escrow_id FROM canonical_intake_result);
BEGIN
    BEGIN
        DELETE FROM public.service_fee_lines
        WHERE order_id = v_order_id
          AND fee_line_code = 'LOCAL_TEST_ONLY_CORE';
        RAISE EXCEPTION 'EXPECTED_ACCEPTED_FEE_DELETE_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'ACCEPTED_FEE_LINE_IMMUTABLE'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        DELETE FROM public.payment_milestones
        WHERE order_id = v_order_id
          AND milestone_type = 'DEPOSIT_INTAKE';
        RAISE EXCEPTION 'EXPECTED_MILESTONE_DELETE_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'MILESTONE_TERMS_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.service_fee_lines
        SET amount = amount + 1,
            quote_version = quote_version + 1
        WHERE order_id = v_order_id
          AND fee_line_code = 'LOCAL_TEST_ONLY_CORE';
        RAISE EXCEPTION 'EXPECTED_ACCEPTED_FEE_UPDATE_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'ACCEPTED_FEE_LINE_IMMUTABLE'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.payment_milestones
        SET amount = amount + 1,
            quote_version = quote_version + 1,
            due_offset_days = due_offset_days + 1
        WHERE order_id = v_order_id
          AND milestone_type = 'DEPOSIT_INTAKE';
        RAISE EXCEPTION 'EXPECTED_MILESTONE_TERM_UPDATE_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'MILESTONE_TERMS_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.corporate_service_cases
        SET legal_scope_version = 'PRIVILEGED-DRIFT'
        WHERE case_id = v_case_id;
        SET CONSTRAINTS ALL IMMEDIATE;
        RAISE EXCEPTION 'EXPECTED_LEGAL_SCOPE_INVARIANT_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'CANONICAL_SNAPSHOT_LEGAL_SCOPE_MISMATCH' THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.escrow_transactions
        SET total_amount_idr = total_amount_idr + 1
        WHERE escrow_id = v_escrow_id;
        SET CONSTRAINTS ALL IMMEDIATE;
        RAISE EXCEPTION 'EXPECTED_ESCROW_INVARIANT_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'CANONICAL_SNAPSHOT_ESCROW_MISMATCH' THEN
                RAISE;
            END IF;
    END;
END;
$$;

-- Lifecycle state/timestamps remain mutable when catalog terms do not change.
UPDATE public.payment_milestones
SET status = 'FUNDED',
    funded_at = pg_catalog.clock_timestamp(),
    updated_at = pg_catalog.clock_timestamp()
WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)
  AND milestone_type = 'DEPOSIT_INTAKE';

SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

UPDATE public.service_orders
SET assigned_professional_id = (
        SELECT professional_id FROM canonical_snapshot_ids
    ),
    updated_at = pg_catalog.clock_timestamp()
WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids);

SET LOCAL ROLE service_role;
SELECT *
FROM public.fn_lock_corporate_escrow_atomic(
    (SELECT corporate_case_id FROM canonical_intake_result),
    (SELECT escrow_id FROM canonical_intake_result),
    (SELECT total_amount_idr FROM canonical_intake_result),
    'RUNTIME-SNAPSHOT-GATEWAY',
    'runtime-snapshot-lock',
    (SELECT client_id FROM canonical_snapshot_ids)
);
RESET ROLE;

UPDATE public.corporate_service_cases
SET assigned_notary_id = (
        SELECT notary_id FROM canonical_snapshot_ids
    ),
    assigned_compliance_reviewer_id = (
        SELECT compliance_id FROM canonical_snapshot_ids
    ),
    updated_at = pg_catalog.clock_timestamp()
WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids);

SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

GRANT SELECT ON TABLE canonical_snapshot_ids TO service_role;
SET LOCAL ROLE postgres;
CREATE TEMP TABLE canonical_replay_result AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT order_id FROM canonical_snapshot_ids),
    (SELECT client_id FROM canonical_snapshot_ids),
    'CV',
    'CV Runtime Snapshot Kanonik',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "ACTIVE_PARTNER",
        "display_name": "Runtime Partner",
        "identity_reference": "protected-runtime-party",
        "ownership_percentage": 100,
        "voting_percentage": 100
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Runtime Beneficial Owner",
        "identity_reference": "protected-runtime-owner",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest":
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'RUNTIME-SNAPSHOT-GATEWAY',
    'runtime-snapshot-intake',
    (SELECT client_id FROM canonical_snapshot_ids)
);
RESET ROLE;

SELECT public.fn_retire_corporate_pricing_catalog(
    (SELECT catalog_id FROM canonical_snapshot_ids)
);

SET LOCAL ROLE postgres;
CREATE TEMP TABLE retired_catalog_replay_result AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT order_id FROM canonical_snapshot_ids),
    (SELECT client_id FROM canonical_snapshot_ids),
    'CV',
    'CV Runtime Snapshot Kanonik',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "ACTIVE_PARTNER",
        "display_name": "Runtime Partner",
        "identity_reference": "protected-runtime-party",
        "ownership_percentage": 100,
        "voting_percentage": 100
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Runtime Beneficial Owner",
        "identity_reference": "protected-runtime-owner",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest":
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'RUNTIME-SNAPSHOT-GATEWAY',
    'runtime-snapshot-intake',
    (SELECT client_id FROM canonical_snapshot_ids)
);
RESET ROLE;

DO $$
BEGIN
    IF NOT (SELECT replayed FROM canonical_replay_result)
       OR NOT (SELECT replayed FROM retired_catalog_replay_result)
       OR (SELECT order_id FROM canonical_intake_result)
            <> (SELECT order_id FROM canonical_replay_result)
       OR (SELECT corporate_case_id FROM canonical_intake_result)
            <> (SELECT corporate_case_id FROM retired_catalog_replay_result)
       OR (SELECT escrow_id FROM canonical_intake_result)
            <> (SELECT escrow_id FROM retired_catalog_replay_result)
       OR (SELECT pricing_catalog_id FROM retired_catalog_replay_result)
            <> (SELECT catalog_id FROM canonical_snapshot_ids) THEN
        RAISE EXCEPTION 'CANONICAL_REPLAY_REGRESSION';
    END IF;
END;
$$;

DO $$
BEGIN
    IF pg_catalog.has_table_privilege(
        'service_role',
        'public.service_fee_lines',
        'INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'service_role',
        'public.payment_milestones',
        'INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_column_privilege(
        'service_role',
        'public.corporate_service_cases',
        'legal_scope_version',
        'UPDATE'
    ) THEN
        RAISE EXCEPTION 'SERVICE_ROLE_DIRECT_SNAPSHOT_MUTATION_OPEN';
    END IF;
END;
$$;

CREATE TEMP TABLE participant_visibility (
    actor_kind TEXT PRIMARY KEY,
    order_count BIGINT NOT NULL,
    fee_count BIGINT NOT NULL,
    milestone_count BIGINT NOT NULL,
    case_count BIGINT NOT NULL,
    party_count BIGINT NOT NULL,
    owner_count BIGINT NOT NULL,
    escrow_count BIGINT NOT NULL,
    event_count BIGINT NOT NULL,
    helper_role VARCHAR
);
GRANT SELECT ON TABLE canonical_snapshot_ids,
    canonical_intake_result
    TO authenticated;
GRANT SELECT, INSERT ON TABLE participant_visibility TO authenticated;

-- Client participant.
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
        'sub', (SELECT client_id FROM canonical_snapshot_ids),
        'role', 'authenticated'
    )::TEXT,
    true
);
SET LOCAL ROLE authenticated;
INSERT INTO participant_visibility
SELECT
    'CLIENT',
    (SELECT pg_catalog.count(*) FROM public.service_orders
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.service_fee_lines
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.payment_milestones
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_parties
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.beneficial_owners
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.escrow_transactions
     WHERE escrow_id = (SELECT escrow_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm
     WHERE corporate_case_id =
        (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT private.fn_current_phase2_admin_role_group());
RESET ROLE;

-- Verified professional participant.
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
        'sub', (SELECT professional_id FROM canonical_snapshot_ids),
        'role', 'authenticated'
    )::TEXT,
    true
);
SET LOCAL ROLE authenticated;
INSERT INTO participant_visibility
SELECT
    'PROFESSIONAL',
    (SELECT pg_catalog.count(*) FROM public.service_orders
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.service_fee_lines
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.payment_milestones
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_parties
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.beneficial_owners
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.escrow_transactions
     WHERE escrow_id = (SELECT escrow_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm
     WHERE corporate_case_id =
        (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT private.fn_current_phase2_admin_role_group());
RESET ROLE;

-- A distinct assigned notary has case-scoped access without order access.
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
        'sub', (SELECT notary_id FROM canonical_snapshot_ids),
        'role', 'authenticated'
    )::TEXT,
    true
);
SET LOCAL ROLE authenticated;
INSERT INTO participant_visibility
SELECT
    'NOTARY',
    (SELECT pg_catalog.count(*) FROM public.service_orders
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.service_fee_lines
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.payment_milestones
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_parties
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.beneficial_owners
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.escrow_transactions
     WHERE escrow_id = (SELECT escrow_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm
     WHERE corporate_case_id =
        (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT private.fn_current_phase2_admin_role_group());

INSERT INTO public.compliance_assessments (
    assessment_id,
    case_id,
    assessment_level,
    rules_version,
    reviewer_id,
    reviewer_role
) VALUES (
    (SELECT notary_assessment_id FROM canonical_snapshot_ids),
    (SELECT corporate_case_id FROM canonical_intake_result),
    'CDD',
    'RUNTIME-NOTARY-RLS-1',
    (SELECT notary_id FROM canonical_snapshot_ids),
    'NOTARY'
);

UPDATE public.compliance_assessments
SET reviewer_rationale = 'Assigned notary role-matched update'
WHERE assessment_id = (
    SELECT notary_assessment_id FROM canonical_snapshot_ids
);

DO $$
BEGIN
    IF (
        SELECT pg_catalog.count(*)
        FROM public.compliance_assessments
        WHERE assessment_id = (
            SELECT notary_assessment_id FROM canonical_snapshot_ids
        )
          AND reviewer_rationale =
                'Assigned notary role-matched update'
    ) <> 1 THEN
        RAISE EXCEPTION 'NOTARY_ASSESSMENT_WRITE_OR_READ_INVALID';
    END IF;
END;
$$;
RESET ROLE;

-- Canonical SUPER_ADMIN participant.
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
        'sub', (SELECT super_admin_id FROM canonical_snapshot_ids),
        'role', 'authenticated'
    )::TEXT,
    true
);
SET LOCAL ROLE authenticated;
INSERT INTO participant_visibility
SELECT
    'SUPER_ADMIN',
    (SELECT pg_catalog.count(*) FROM public.service_orders
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.service_fee_lines
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.payment_milestones
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_parties
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.beneficial_owners
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.escrow_transactions
     WHERE escrow_id = (SELECT escrow_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm
     WHERE corporate_case_id =
        (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT private.fn_current_phase2_admin_role_group());
RESET ROLE;

-- Canonical COMPLIANCE_OFFICER participant and reviewer-role enforcement.
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
        'sub', (SELECT compliance_id FROM canonical_snapshot_ids),
        'role', 'authenticated',
        'user_metadata', pg_catalog.jsonb_build_object(
            'role_group', 'SUPER_ADMIN'
        )
    )::TEXT,
    true
);
SET LOCAL ROLE authenticated;
INSERT INTO participant_visibility
SELECT
    'COMPLIANCE_OFFICER',
    (SELECT pg_catalog.count(*) FROM public.service_orders
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.service_fee_lines
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.payment_milestones
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_parties
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.beneficial_owners
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.escrow_transactions
     WHERE escrow_id = (SELECT escrow_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm
     WHERE corporate_case_id =
        (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT private.fn_current_phase2_admin_role_group());

INSERT INTO public.compliance_assessments (
    assessment_id,
    case_id,
    assessment_level,
    rules_version,
    reviewer_id,
    reviewer_role
) VALUES (
    (SELECT assessment_id FROM canonical_snapshot_ids),
    (SELECT corporate_case_id FROM canonical_intake_result),
    'CDD',
    'RUNTIME-RLS-1',
    (SELECT compliance_id FROM canonical_snapshot_ids),
    'COMPLIANCE_OFFICER'
);

UPDATE public.compliance_assessments
SET reviewer_rationale = 'Role-matched runtime update'
WHERE assessment_id = (SELECT assessment_id FROM canonical_snapshot_ids);

DO $$
BEGIN
    BEGIN
        INSERT INTO public.compliance_assessments (
            case_id,
            assessment_level,
            rules_version,
            reviewer_id,
            reviewer_role
        ) VALUES (
            (SELECT corporate_case_id FROM canonical_intake_result),
            'CDD',
            'RUNTIME-RLS-MISMATCH',
            (SELECT compliance_id FROM canonical_snapshot_ids),
            'SUPER_ADMIN'
        );
        RAISE EXCEPTION 'EXPECTED_REVIEWER_ROLE_INSERT_REJECTION';
    EXCEPTION
        WHEN insufficient_privilege THEN
            NULL;
    END;

    BEGIN
        UPDATE public.compliance_assessments
        SET reviewer_role = 'SUPER_ADMIN'
        WHERE assessment_id = (
            SELECT assessment_id FROM canonical_snapshot_ids
        );
        RAISE EXCEPTION 'EXPECTED_REVIEWER_ROLE_UPDATE_REJECTION';
    EXCEPTION
        WHEN insufficient_privilege THEN
            NULL;
    END;
END;
$$;
RESET ROLE;

-- Unrelated identity with forged user_metadata must receive zero rows.
SELECT pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
        'sub', (SELECT unrelated_id FROM canonical_snapshot_ids),
        'role', 'authenticated',
        'user_metadata', pg_catalog.jsonb_build_object(
            'role_group', 'SUPER_ADMIN'
        )
    )::TEXT,
    true
);
SET LOCAL ROLE authenticated;
INSERT INTO participant_visibility
SELECT
    'UNRELATED',
    (SELECT pg_catalog.count(*) FROM public.service_orders
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.service_fee_lines
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.payment_milestones
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
     WHERE order_id = (SELECT order_id FROM canonical_snapshot_ids)),
    (SELECT pg_catalog.count(*) FROM public.corporate_parties
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.beneficial_owners
     WHERE case_id = (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.escrow_transactions
     WHERE escrow_id = (SELECT escrow_id FROM canonical_intake_result)),
    (SELECT pg_catalog.count(*) FROM public.compliance_workflow_events_worm
     WHERE corporate_case_id =
        (SELECT corporate_case_id FROM canonical_intake_result)),
    (SELECT private.fn_current_phase2_admin_role_group());
RESET ROLE;

DO $$
DECLARE
    v_row participant_visibility%ROWTYPE;
BEGIN
    SELECT * INTO v_row
    FROM participant_visibility
    WHERE actor_kind = 'CLIENT';
    IF (
        v_row.order_count,
        v_row.fee_count,
        v_row.milestone_count,
        v_row.case_count,
        v_row.party_count,
        v_row.owner_count,
        v_row.escrow_count,
        v_row.event_count,
        v_row.helper_role
    ) IS DISTINCT FROM (1, 2, 2, 1, 1, 1, 1, 0, NULL) THEN
        RAISE EXCEPTION 'CLIENT_PARTICIPANT_VISIBILITY_INVALID';
    END IF;

    SELECT * INTO v_row
    FROM participant_visibility
    WHERE actor_kind = 'PROFESSIONAL';
    IF (
        v_row.order_count,
        v_row.fee_count,
        v_row.milestone_count,
        v_row.case_count,
        v_row.party_count,
        v_row.owner_count,
        v_row.escrow_count,
        v_row.event_count,
        v_row.helper_role
    ) IS DISTINCT FROM (1, 2, 2, 1, 1, 1, 1, 0, NULL) THEN
        RAISE EXCEPTION 'PROFESSIONAL_PARTICIPANT_VISIBILITY_INVALID';
    END IF;

    SELECT * INTO v_row
    FROM participant_visibility
    WHERE actor_kind = 'NOTARY';
    IF (
        v_row.order_count,
        v_row.fee_count,
        v_row.milestone_count,
        v_row.case_count,
        v_row.party_count,
        v_row.owner_count,
        v_row.escrow_count,
        v_row.event_count,
        v_row.helper_role
    ) IS DISTINCT FROM (0, 0, 0, 1, 1, 1, 1, 0, NULL) THEN
        RAISE EXCEPTION 'NOTARY_PARTICIPANT_VISIBILITY_INVALID';
    END IF;

    SELECT * INTO v_row
    FROM participant_visibility
    WHERE actor_kind = 'SUPER_ADMIN';
    IF (
        v_row.order_count,
        v_row.fee_count,
        v_row.milestone_count,
        v_row.case_count,
        v_row.party_count,
        v_row.owner_count,
        v_row.escrow_count,
        v_row.event_count,
        v_row.helper_role
    ) IS DISTINCT FROM (1, 2, 2, 1, 1, 1, 1, 2, 'SUPER_ADMIN') THEN
        RAISE EXCEPTION 'SUPER_ADMIN_PARTICIPANT_VISIBILITY_INVALID';
    END IF;

    SELECT * INTO v_row
    FROM participant_visibility
    WHERE actor_kind = 'COMPLIANCE_OFFICER';
    IF (
        v_row.order_count,
        v_row.fee_count,
        v_row.milestone_count,
        v_row.case_count,
        v_row.party_count,
        v_row.owner_count,
        v_row.escrow_count,
        v_row.event_count,
        v_row.helper_role
    ) IS DISTINCT FROM (
        1, 2, 2, 1, 1, 1, 1, 2, 'COMPLIANCE_OFFICER'
    ) THEN
        RAISE EXCEPTION 'COMPLIANCE_PARTICIPANT_VISIBILITY_INVALID';
    END IF;

    SELECT * INTO v_row
    FROM participant_visibility
    WHERE actor_kind = 'UNRELATED';
    IF (
        v_row.order_count,
        v_row.fee_count,
        v_row.milestone_count,
        v_row.case_count,
        v_row.party_count,
        v_row.owner_count,
        v_row.escrow_count,
        v_row.event_count,
        v_row.helper_role
    ) IS DISTINCT FROM (0, 0, 0, 0, 0, 0, 0, 0, NULL) THEN
        RAISE EXCEPTION 'UNRELATED_TENANT_VISIBILITY_LEAK';
    END IF;
END;
$$;

ROLLBACK;
