\set ON_ERROR_STOP on

BEGIN;

DO $test$
BEGIN
    IF pg_catalog.to_regclass(
        'public.corporate_intake_evidence_artifacts'
    ) IS NULL THEN
        RAISE EXCEPTION
            'corporate_intake_evidence_artifacts must exist';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.fn_prepare_corporate_intake_evidence_atomic(uuid,uuid,character varying,bigint,character varying,uuid)'
    ) IS NULL THEN
        RAISE EXCEPTION 'prepare evidence RPC must exist';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.fn_finalize_corporate_intake_evidence_atomic(uuid,uuid,uuid,character varying,bigint,character varying,character varying,uuid)'
    ) IS NULL THEN
        RAISE EXCEPTION 'finalize evidence RPC must exist';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.fn_is_corporate_intake_client(uuid)'
    ) IS NULL THEN
        RAISE EXCEPTION 'canonical Client-profile helper must exist';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_from_evidence_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,jsonb,jsonb,character varying,character varying,uuid)'
    ) IS NULL THEN
        RAISE EXCEPTION 'evidence-backed intake RPC must exist';
    END IF;
END
$test$;

CREATE TEMP TABLE evidence_runtime_ids AS
SELECT
    '11111111-1111-4111-8111-111111111111'::UUID AS client_id,
    '22222222-2222-4222-8222-222222222222'::UUID AS other_client_id,
    'e1000000-0000-4000-8000-000000000001'::UUID AS evidence_id,
    'e1000000-0000-4000-8000-000000000002'::UUID AS rollback_evidence_id,
    'e2000000-0000-4000-8000-000000000001'::UUID AS order_id,
    'e2000000-0000-4000-8000-000000000002'::UUID AS rollback_order_id;

INSERT INTO public.users_client (
    client_id,
    full_name,
    email,
    phone_e164,
    kyc_status,
    password_hash
)
SELECT
    other_client_id,
    'LOCAL_TEST_ONLY Evidence Tenant',
    'evidence-tenant@example.invalid',
    '+620000000099',
    'VERIFIED',
    '!LOCAL_TEST_ONLY!'
FROM evidence_runtime_ids
ON CONFLICT (client_id) DO NOTHING;

DO $acl$
DECLARE
    v_old_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_from_catalog_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,jsonb,jsonb,character varying,character varying,uuid)'
    );
    v_new_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_from_evidence_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,jsonb,jsonb,character varying,character varying,uuid)'
    );
    v_client_helper REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_is_corporate_intake_client(uuid)'
    );
BEGIN
    IF pg_catalog.has_table_privilege(
        'authenticated',
        'public.corporate_intake_evidence_artifacts',
        'INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'service_role',
        'public.corporate_intake_evidence_artifacts',
        'INSERT,UPDATE,DELETE'
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_TABLE_MUTATION_ACL_OPEN';
    END IF;
    IF pg_catalog.has_column_privilege(
        'authenticated',
        'public.corporate_intake_evidence_artifacts',
        'sha256_digest',
        'SELECT'
    ) OR pg_catalog.has_column_privilege(
        'authenticated',
        'public.corporate_intake_evidence_artifacts',
        'storage_object_id',
        'SELECT'
    ) OR pg_catalog.has_column_privilege(
        'authenticated',
        'public.corporate_intake_evidence_artifacts',
        'finalize_idempotency_key',
        'SELECT'
    ) OR NOT pg_catalog.has_column_privilege(
        'authenticated',
        'public.corporate_intake_evidence_artifacts',
        'object_path',
        'SELECT'
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_BROWSER_COLUMN_ACL_INVALID';
    END IF;
    IF pg_catalog.has_function_privilege('service_role', v_old_rpc, 'EXECUTE')
       OR NOT pg_catalog.has_function_privilege(
            'service_role',
            v_new_rpc,
            'EXECUTE'
       )
       OR pg_catalog.has_function_privilege('authenticated', v_new_rpc, 'EXECUTE')
       OR NOT pg_catalog.has_function_privilege(
            'service_role',
            v_client_helper,
            'EXECUTE'
       )
       OR pg_catalog.has_function_privilege(
            'authenticated',
            v_client_helper,
            'EXECUTE'
       )
    THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_INTAKE_ACL_INVALID';
    END IF;
END
$acl$;

DO $storage_policy$
DECLARE
    v_insert_check TEXT;
    v_select_check TEXT;
BEGIN
    SELECT policy.with_check
    INTO v_insert_check
    FROM pg_catalog.pg_policies AS policy
    WHERE policy.schemaname = 'storage'
      AND policy.tablename = 'objects'
      AND policy.policyname = 'corporate_intake_evidence_insert_own';
    SELECT policy.qual
    INTO v_select_check
    FROM pg_catalog.pg_policies AS policy
    WHERE policy.schemaname = 'storage'
      AND policy.tablename = 'objects'
      AND policy.policyname = 'corporate_intake_evidence_select_own_object';
    IF pg_catalog.strpos(v_insert_check, 'clock_timestamp') = 0
       OR pg_catalog.strpos(v_select_check, 'clock_timestamp') = 0
       OR pg_catalog.strpos(v_select_check, 'PENDING_UPLOAD') = 0
       OR pg_catalog.strpos(v_select_check, 'HASHED') = 0 THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_STORAGE_TTL_POLICY_INVALID';
    END IF;
END
$storage_policy$;

SELECT *
FROM public.fn_prepare_corporate_intake_evidence_atomic(
    (SELECT evidence_id FROM evidence_runtime_ids),
    (SELECT client_id FROM evidence_runtime_ids),
    'application/pdf',
    9,
    'LOCAL_TEST_ONLY-prepare-main',
    (SELECT client_id FROM evidence_runtime_ids)
);

DO $prepare_replay$
DECLARE
    v_replayed BOOLEAN;
BEGIN
    SELECT replayed
    INTO v_replayed
    FROM public.fn_prepare_corporate_intake_evidence_atomic(
        (SELECT evidence_id FROM evidence_runtime_ids),
        (SELECT client_id FROM evidence_runtime_ids),
        'application/pdf',
        9,
        'LOCAL_TEST_ONLY-prepare-main',
        (SELECT client_id FROM evidence_runtime_ids)
    );
    IF NOT v_replayed THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_PREPARE_REPLAY_FAILED';
    END IF;

    BEGIN
        PERFORM *
        FROM public.fn_prepare_corporate_intake_evidence_atomic(
            (SELECT evidence_id FROM evidence_runtime_ids),
            (SELECT client_id FROM evidence_runtime_ids),
            'image/png',
            9,
            'LOCAL_TEST_ONLY-prepare-main',
            (SELECT client_id FROM evidence_runtime_ids)
        );
        RAISE EXCEPTION 'EXPECTED_PREPARE_REPLAY_CONFLICT';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'IDEMPOTENCY_CONFLICT') = 0 THEN
                RAISE;
            END IF;
    END;
END
$prepare_replay$;

SELECT *
FROM public.fn_finalize_corporate_intake_evidence_atomic(
    (SELECT evidence_id FROM evidence_runtime_ids),
    (SELECT client_id FROM evidence_runtime_ids),
    'e3000000-0000-4000-8000-000000000001',
    'application/pdf',
    9,
    pg_catalog.repeat('a', 64),
    'LOCAL_TEST_ONLY-finalize-main',
    (SELECT client_id FROM evidence_runtime_ids)
);

DO $finalize_replay$
DECLARE
    v_replayed BOOLEAN;
BEGIN
    SELECT replayed
    INTO v_replayed
    FROM public.fn_finalize_corporate_intake_evidence_atomic(
        (SELECT evidence_id FROM evidence_runtime_ids),
        (SELECT client_id FROM evidence_runtime_ids),
        'e3000000-0000-4000-8000-000000000001',
        'application/pdf',
        9,
        pg_catalog.repeat('a', 64),
        'LOCAL_TEST_ONLY-finalize-main',
        (SELECT client_id FROM evidence_runtime_ids)
    );
    IF NOT v_replayed THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_FINALIZE_REPLAY_FAILED';
    END IF;

    BEGIN
        PERFORM *
        FROM public.fn_finalize_corporate_intake_evidence_atomic(
            (SELECT evidence_id FROM evidence_runtime_ids),
            (SELECT client_id FROM evidence_runtime_ids),
            'e3000000-0000-4000-8000-000000000001',
            'application/pdf',
            9,
            pg_catalog.repeat('b', 64),
            'LOCAL_TEST_ONLY-finalize-main',
            (SELECT client_id FROM evidence_runtime_ids)
        );
        RAISE EXCEPTION 'EXPECTED_FINALIZE_REPLAY_CONFLICT';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'IDEMPOTENCY_CONFLICT') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        PERFORM *
        FROM public.fn_finalize_corporate_intake_evidence_atomic(
            (SELECT evidence_id FROM evidence_runtime_ids),
            (SELECT other_client_id FROM evidence_runtime_ids),
            'e3000000-0000-4000-8000-000000000001',
            'application/pdf',
            9,
            pg_catalog.repeat('a', 64),
            'LOCAL_TEST_ONLY-other-finalize',
            (SELECT other_client_id FROM evidence_runtime_ids)
        );
        RAISE EXCEPTION 'EXPECTED_CROSS_TENANT_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'OWNER_MISMATCH') = 0 THEN
                RAISE;
            END IF;
    END;
END
$finalize_replay$;

DO $immutable$
BEGIN
    BEGIN
        UPDATE public.corporate_intake_evidence_artifacts
        SET sha256_digest = pg_catalog.repeat('b', 64)
        WHERE evidence_id = (
            SELECT evidence_id FROM evidence_runtime_ids
        );
        RAISE EXCEPTION 'EXPECTED_FINAL_METADATA_IMMUTABILITY';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'REPLAY_CONFLICT') = 0
               AND pg_catalog.strpos(
                    SQLERRM,
                    'FINAL_METADATA_IMMUTABLE'
               ) = 0 THEN
                RAISE;
            END IF;
    END;
END
$immutable$;

GRANT SELECT ON evidence_runtime_ids TO service_role;

SET LOCAL ROLE service_role;

DO $client_profile$
BEGIN
    IF NOT public.fn_is_corporate_intake_client(
        (SELECT client_id FROM evidence_runtime_ids)
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_CLIENT_PROFILE_LOOKUP_FAILED';
    END IF;
END
$client_profile$;

SELECT *
FROM public.fn_create_corporate_intake_from_evidence_atomic(
    (SELECT order_id FROM evidence_runtime_ids),
    (SELECT client_id FROM evidence_runtime_ids),
    'CV',
    'CV LOCAL TEST ONLY Evidence',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "ACTIVE_PARTNER",
        "display_name": "LOCAL TEST ONLY Founder",
        "identity_reference": "protected-party-reference",
        "ownership_percentage": 100,
        "voting_percentage": 100
    }]'::JSONB,
    pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
            'declaration_version', 1,
            'natural_person_name', 'LOCAL TEST ONLY Owner',
            'evidence_reference',
                (SELECT evidence_id::TEXT FROM evidence_runtime_ids),
            'control_basis', 'OWNERSHIP',
            'percentage', 100
        )
    ),
    'LOCAL-TEST-EVIDENCE-GATEWAY',
    'LOCAL_TEST_ONLY-intake-main',
    (SELECT client_id FROM evidence_runtime_ids)
);

SELECT *
FROM public.fn_create_corporate_intake_from_evidence_atomic(
    (SELECT order_id FROM evidence_runtime_ids),
    (SELECT client_id FROM evidence_runtime_ids),
    'CV',
    'CV LOCAL TEST ONLY Evidence',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "ACTIVE_PARTNER",
        "display_name": "LOCAL TEST ONLY Founder",
        "identity_reference": "protected-party-reference",
        "ownership_percentage": 100,
        "voting_percentage": 100
    }]'::JSONB,
    pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
            'declaration_version', 1,
            'natural_person_name', 'LOCAL TEST ONLY Owner',
            'evidence_reference',
                (SELECT evidence_id::TEXT FROM evidence_runtime_ids),
            'control_basis', 'OWNERSHIP',
            'percentage', 100
        )
    ),
    'LOCAL-TEST-EVIDENCE-GATEWAY',
    'LOCAL_TEST_ONLY-intake-main',
    (SELECT client_id FROM evidence_runtime_ids)
);

RESET ROLE;

DO $consumed$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.corporate_intake_evidence_artifacts AS artifact
        WHERE artifact.evidence_id = (
            SELECT evidence_id FROM evidence_runtime_ids
        )
          AND artifact.status = 'CONSUMED'
          AND artifact.consumed_order_id = (
            SELECT order_id FROM evidence_runtime_ids
          )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_NOT_CONSUMED_ATOMICALLY';
    END IF;
    IF (
        SELECT pg_catalog.count(*)
        FROM public.service_orders AS service_order
        WHERE service_order.order_id = (
            SELECT order_id FROM evidence_runtime_ids
        )
    ) <> 1 THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_REPLAY_CREATED_ORDER_DUPLICATE';
    END IF;
END
$consumed$;

DO $finalize_after_consumption$
DECLARE
    v_status VARCHAR;
    v_replayed BOOLEAN;
BEGIN
    SELECT result.status, result.replayed
    INTO v_status, v_replayed
    FROM public.fn_finalize_corporate_intake_evidence_atomic(
        (SELECT evidence_id FROM evidence_runtime_ids),
        (SELECT client_id FROM evidence_runtime_ids),
        'e3000000-0000-4000-8000-000000000001',
        'application/pdf',
        9,
        pg_catalog.repeat('a', 64),
        'LOCAL_TEST_ONLY-finalize-main',
        (SELECT client_id FROM evidence_runtime_ids)
    ) AS result;
    IF v_status <> 'CONSUMED' OR NOT v_replayed THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_CONSUMED_FINALIZE_REPLAY_FAILED';
    END IF;
END
$finalize_after_consumption$;

SELECT *
FROM public.fn_prepare_corporate_intake_evidence_atomic(
    (SELECT rollback_evidence_id FROM evidence_runtime_ids),
    (SELECT client_id FROM evidence_runtime_ids),
    'application/pdf',
    9,
    'LOCAL_TEST_ONLY-prepare-rollback',
    (SELECT client_id FROM evidence_runtime_ids)
);

DO $storage_object_conflict$
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_finalize_corporate_intake_evidence_atomic(
            (SELECT rollback_evidence_id FROM evidence_runtime_ids),
            (SELECT client_id FROM evidence_runtime_ids),
            'e3000000-0000-4000-8000-000000000001',
            'application/pdf',
            9,
            pg_catalog.repeat('b', 64),
            'LOCAL_TEST_ONLY-finalize-object-conflict',
            (SELECT client_id FROM evidence_runtime_ids)
        );
        RAISE EXCEPTION 'EXPECTED_STORAGE_OBJECT_CONFLICT';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'STORAGE_OBJECT_CONFLICT') = 0 THEN
                RAISE;
            END IF;
    END;
END
$storage_object_conflict$;

SELECT *
FROM public.fn_finalize_corporate_intake_evidence_atomic(
    (SELECT rollback_evidence_id FROM evidence_runtime_ids),
    (SELECT client_id FROM evidence_runtime_ids),
    'e3000000-0000-4000-8000-000000000002',
    'application/pdf',
    9,
    pg_catalog.repeat('b', 64),
    'LOCAL_TEST_ONLY-finalize-rollback',
    (SELECT client_id FROM evidence_runtime_ids)
);

DO $rollback_consumption$
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_create_corporate_intake_from_evidence_atomic(
            (SELECT rollback_order_id FROM evidence_runtime_ids),
            (SELECT client_id FROM evidence_runtime_ids),
            'PT_ORDINARY',
            'PT LOCAL TEST ONLY Missing Catalog',
            'Jakarta Selatan',
            'DKI Jakarta',
            '["62010"]'::JSONB,
            100000000,
            25000000,
            '[{
                "party_type": "NATURAL_PERSON",
                "role": "FOUNDER",
                "display_name": "LOCAL TEST ONLY Founder",
                "identity_reference": "protected-party-reference-rollback",
                "ownership_percentage": 100,
                "voting_percentage": 100
            }]'::JSONB,
            pg_catalog.jsonb_build_array(
                pg_catalog.jsonb_build_object(
                    'declaration_version', 1,
                    'natural_person_name', 'LOCAL TEST ONLY Owner',
                    'evidence_reference',
                        (SELECT rollback_evidence_id::TEXT
                         FROM evidence_runtime_ids),
                    'control_basis', 'OWNERSHIP',
                    'percentage', 100
                )
            ),
            'LOCAL-TEST-EVIDENCE-ROLLBACK',
            'LOCAL_TEST_ONLY-intake-rollback',
            (SELECT client_id FROM evidence_runtime_ids)
        );
        RAISE EXCEPTION 'EXPECTED_ATOMIC_INTAKE_FAILURE';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'ACTIVE_CATALOG_NOT_FOUND') = 0 THEN
                RAISE;
            END IF;
    END;
    IF (
        SELECT status
        FROM public.corporate_intake_evidence_artifacts
        WHERE evidence_id = (
            SELECT rollback_evidence_id FROM evidence_runtime_ids
        )
    ) <> 'HASHED' OR EXISTS (
        SELECT 1
        FROM public.service_orders
        WHERE order_id = (
            SELECT rollback_order_id FROM evidence_runtime_ids
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_FAILURE_LEFT_PARTIAL_WRITE';
    END IF;
END
$rollback_consumption$;

ROLLBACK;
