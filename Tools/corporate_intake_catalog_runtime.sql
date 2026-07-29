\set ON_ERROR_STOP on

BEGIN;

-- This runtime is intentionally self-contained and always rolls back. It tests
-- the public database boundary, not implementation helpers.
DO $$
BEGIN
    IF pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_from_catalog_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,jsonb,jsonb,character varying,character varying,uuid)'
    ) IS NULL THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_RPC_MISSING';
    END IF;

    IF pg_catalog.to_regprocedure(
        'public.fn_resolve_corporate_pricing_catalog(character varying,uuid)'
    ) IS NULL THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_RESOLVER_MISSING';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'service_orders'
          AND column_name = 'accepted_pricing_catalog_id'
    ) OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'payment_milestones'
          AND column_name = 'due_offset_anchor'
    ) OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'payment_milestones'
          AND column_name = 'due_offset_days'
    ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_SNAPSHOT_COLUMNS_MISSING';
    END IF;
END;
$$;

CREATE TEMP TABLE catalog_intake_ids AS
SELECT
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS actor_id,
    'a2100000-0000-0000-0000-000000000001'::UUID AS catalog_v1_id,
    'a2100000-0000-0000-0000-000000000002'::UUID AS catalog_v2_id,
    'a2100000-0000-0000-0000-000000000003'::UUID AS bad_offset_catalog_id,
    'a2200000-0000-0000-0000-000000000001'::UUID AS first_order_id,
    'a2200000-0000-0000-0000-000000000002'::UUID AS second_order_id,
    'a2200000-0000-0000-0000-000000000003'::UUID AS missing_catalog_order_id,
    'a2200000-0000-0000-0000-000000000004'::UUID AS guard_order_id,
    'a2200000-0000-0000-0000-000000000005'::UUID AS nan_order_id;

DO $$
BEGIN
    IF (SELECT actor_id FROM catalog_intake_ids) IS NULL THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_REQUIRES_LOCAL_AUTH_USER';
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
    actor_id,
    'Catalog Intake Runtime Client',
    'catalog-intake-runtime@example.invalid',
    '+620000000011',
    'VERIFIED',
    '!ROLLBACK-RUNTIME!'
FROM catalog_intake_ids
ON CONFLICT (client_id) DO NOTHING;

DO $$
DECLARE
    v_new_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_from_catalog_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,jsonb,jsonb,character varying,character varying,uuid)'
    );
    v_resolver REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_resolve_corporate_pricing_catalog(character varying,uuid)'
    );
    v_old_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
        'public.fn_create_corporate_intake_complete_atomic(uuid,uuid,character varying,character varying,character varying,character varying,jsonb,numeric,numeric,character varying,jsonb,jsonb,jsonb,jsonb,numeric,character varying,character varying,uuid)'
    );
BEGIN
    IF pg_catalog.has_table_privilege(
        'anon',
        'public.corporate_pricing_catalogs',
        'SELECT,INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'authenticated',
        'public.corporate_pricing_catalogs',
        'SELECT,INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'service_role',
        'public.corporate_pricing_catalogs',
        'SELECT,INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'service_role',
        'public.corporate_pricing_fee_lines',
        'SELECT,INSERT,UPDATE,DELETE'
    ) OR pg_catalog.has_table_privilege(
        'service_role',
        'public.corporate_pricing_milestones',
        'SELECT,INSERT,UPDATE,DELETE'
    ) THEN
        RAISE EXCEPTION 'CATALOG_TABLE_ACL_OPEN';
    END IF;

    IF pg_catalog.has_function_privilege('service_role', v_resolver, 'EXECUTE')
       OR pg_catalog.has_function_privilege('anon', v_new_rpc, 'EXECUTE')
       OR pg_catalog.has_function_privilege(
            'authenticated',
            v_new_rpc,
            'EXECUTE'
       )
       OR NOT pg_catalog.has_function_privilege(
            'service_role',
            v_new_rpc,
            'EXECUTE'
       )
       OR pg_catalog.has_function_privilege(
            'service_role',
            v_old_rpc,
            'EXECUTE'
       ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_FUNCTION_ACL_INVALID';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_proc AS proc
        JOIN pg_catalog.pg_namespace AS namespace
          ON namespace.oid = proc.pronamespace
        WHERE namespace.nspname = 'public'
          AND proc.proname = 'fn_create_corporate_intake_from_catalog_atomic'
          AND proc.pronargs = 14
          AND proc.proargnames[1:14] = ARRAY[
              'p_order_id',
              'p_client_id',
              'p_entity_type',
              'p_proposed_name',
              'p_domicile_city',
              'p_domicile_province',
              'p_kbli_snapshot',
              'p_authorized_capital_idr',
              'p_paid_up_capital_idr',
              'p_corporate_parties',
              'p_beneficial_owners',
              'p_payment_gateway_ref',
              'p_idempotency_key',
              'p_actor_user_id'
          ]::TEXT[]
    ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_SIGNATURE_INVALID';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.parameters
        WHERE specific_schema = 'public'
          AND specific_name LIKE
              'fn_create_corporate_intake_from_catalog_atomic_%'
          AND parameter_name IN (
              'p_fee_lines',
              'p_payment_milestones',
              'p_total_amount_idr',
              'p_quote_version',
              'p_legal_scope_version',
              'p_catalog_id'
          )
    ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_CALLER_FINANCIAL_PARAMETER_PRESENT';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_trigger AS trigger
        JOIN pg_catalog.pg_class AS relation
          ON relation.oid = trigger.tgrelid
        JOIN pg_catalog.pg_namespace AS namespace
          ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public'
          AND relation.relname = 'service_orders'
          AND trigger.tgname = 'trg_guard_service_order_accepted_terms'
          AND trigger.tgenabled = 'A'
    ) THEN
        RAISE EXCEPTION 'SERVICE_ORDER_ACCEPTED_TERMS_TRIGGER_NOT_ALWAYS';
    END IF;
END;
$$;

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
    bad_offset_catalog_id,
    'PT_INDIVIDUAL_UMK',
    99,
    'LEGAL-RUNTIME-OFFSET',
    'IDR',
    1,
    pg_catalog.clock_timestamp()
FROM catalog_intake_ids;

DO $$
BEGIN
    BEGIN
        INSERT INTO public.corporate_pricing_milestones (
            catalog_id,
            milestone_type,
            sequence_number,
            amount,
            releasable_party,
            evidence_condition,
            dispute_refund_rule,
            due_offset_anchor,
            due_offset_days
        ) VALUES (
            (SELECT bad_offset_catalog_id FROM catalog_intake_ids),
            'DEPOSIT_INTAKE',
            1,
            1,
            'JUSTICA',
            'Invalid offset fixture',
            'Invalid offset fixture',
            'INTAKE_ACCEPTED',
            NULL
        );
        RAISE EXCEPTION 'EXPECTED_CATALOG_OFFSET_PAIR_REJECTION';
    EXCEPTION
        WHEN check_violation THEN
            NULL;
    END;
END;
$$;

UPDATE public.corporate_pricing_catalogs
SET total_amount_idr = 'NaN'::NUMERIC
WHERE catalog_id = (
    SELECT bad_offset_catalog_id FROM catalog_intake_ids
);

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id,
    fee_line_code,
    fee_type,
    description,
    amount
)
SELECT bad_offset_catalog_id, 'RUNTIME-NAN', 'JUSTICA_FEE',
       'Non-finite runtime fixture', 'NaN'::NUMERIC
FROM catalog_intake_ids;

INSERT INTO public.corporate_pricing_milestones (
    catalog_id,
    milestone_type,
    sequence_number,
    amount,
    releasable_party,
    evidence_condition,
    dispute_refund_rule
)
SELECT bad_offset_catalog_id, 'DEPOSIT_INTAKE', 1, 'NaN'::NUMERIC,
       'JUSTICA', 'Non-finite runtime fixture',
       'Non-finite runtime fixture'
FROM catalog_intake_ids;

SELECT public.fn_activate_corporate_pricing_catalog(
    (SELECT bad_offset_catalog_id FROM catalog_intake_ids)
);

DO $$
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_resolve_corporate_pricing_catalog(
            'PT_INDIVIDUAL_UMK',
            NULL
        );
        RAISE EXCEPTION 'EXPECTED_NON_FINITE_CATALOG_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'CORPORATE_PRICING_AMOUNT_INVALID' THEN
                RAISE;
            END IF;
    END;
END;
$$;

INSERT INTO public.service_orders (
    order_id,
    client_id,
    service_type,
    status,
    currency
)
SELECT guard_order_id, actor_id, 'PT_ORDINARY', 'DRAFT', 'IDR'
FROM catalog_intake_ids;

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
)
SELECT
    guard_order_id,
    'DEPOSIT_INTAKE',
    1,
    1,
    'IDR',
    1,
    'DRAFT',
    'JUSTICA',
    'Lifecycle guard fixture',
    'Lifecycle guard fixture'
FROM catalog_intake_ids;

DO $$
DECLARE
    v_order_id UUID := (SELECT guard_order_id FROM catalog_intake_ids);
BEGIN
    BEGIN
        UPDATE public.service_orders
        SET status = 'PAYMENT_PENDING',
            submitted_at = pg_catalog.clock_timestamp(),
            service_type = 'CV'
        WHERE order_id = v_order_id;
        RAISE EXCEPTION 'EXPECTED_DRAFT_EXIT_ORDER_TERMS_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'SERVICE_ORDER_ACCEPTED_TERMS_IMMUTABLE'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.payment_milestones
        SET status = 'PENDING',
            due_offset_anchor = 'INTAKE_ACCEPTED',
            due_offset_days = 0
        WHERE order_id = v_order_id;
        RAISE EXCEPTION 'EXPECTED_DRAFT_EXIT_MILESTONE_TERMS_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'MILESTONE_TERMS_IMMUTABLE'
            ) = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

-- No ACTIVE/effective PT catalog must fail before any write.
DO $$
DECLARE
    v_actor_id UUID := (SELECT actor_id FROM catalog_intake_ids);
    v_order_id UUID := (
        SELECT missing_catalog_order_id FROM catalog_intake_ids
    );
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_create_corporate_intake_from_catalog_atomic(
            v_order_id,
            v_actor_id,
            'PT_ORDINARY',
            'PT Katalog Belum Ada',
            'Jakarta Selatan',
            'DKI Jakarta',
            '["62010"]'::JSONB,
            100000000,
            25000000,
            '[{
                "party_type": "NATURAL_PERSON",
                "role": "FOUNDER",
                "display_name": "Runtime Founder",
                "identity_reference": "protected-ref-shared",
                "ownership_percentage": 100,
                "voting_percentage": 100
            }]'::JSONB,
            '[{
                "declaration_version": 1,
                "natural_person_name": "Runtime Owner",
                "identity_reference": "protected-ref-shared",
                "control_basis": "OWNERSHIP",
                "percentage": 100,
                "evidence_digest":
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }]'::JSONB,
            'RUNTIME-MISSING-CATALOG',
            'runtime-missing-catalog',
            v_actor_id
        );
        RAISE EXCEPTION 'EXPECTED_MISSING_CATALOG_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'CORPORATE_PRICING_ACTIVE_CATALOG_NOT_FOUND'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    IF EXISTS (
        SELECT 1
        FROM public.service_orders
        WHERE order_id = v_order_id
    ) OR EXISTS (
        SELECT 1
        FROM public.corporate_service_cases
        WHERE order_id = v_order_id
    ) THEN
        RAISE EXCEPTION 'MISSING_CATALOG_LEFT_PARTIAL_WRITE';
    END IF;
END;
$$;

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
    catalog_v1_id,
    'PT_ORDINARY',
    41,
    'LEGAL-RUNTIME-41',
    'IDR',
    1000000,
    pg_catalog.clock_timestamp() - INTERVAL '1 hour'
FROM catalog_intake_ids;

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id,
    fee_line_code,
    fee_type,
    description,
    amount
)
SELECT catalog_v1_id, 'RUNTIME-NOTARY', 'NOTARY_FEE',
       'Runtime notary fixture', 600000
FROM catalog_intake_ids
UNION ALL
SELECT catalog_v1_id, 'RUNTIME-PLATFORM', 'JUSTICA_FEE',
       'Runtime platform fixture', 400000
FROM catalog_intake_ids;

INSERT INTO public.corporate_pricing_milestones (
    catalog_id,
    milestone_type,
    sequence_number,
    amount,
    releasable_party,
    evidence_condition,
    dispute_refund_rule,
    due_offset_anchor,
    due_offset_days
)
SELECT catalog_v1_id, 'DEPOSIT_INTAKE', 1, 300000, 'JUSTICA',
       'Validated intake', 'Refund before work', 'INTAKE_ACCEPTED', 0
FROM catalog_intake_ids
UNION ALL
SELECT catalog_v1_id, 'NOTARY_READY', 2, 700000, 'NOTARY',
       'Notary deliverable ready', 'Refund unreleased remainder',
       'NOTARY_ASSIGNED', 3
FROM catalog_intake_ids;

SELECT public.fn_activate_corporate_pricing_catalog(
    (SELECT catalog_v1_id FROM catalog_intake_ids)
);

DO $$
DECLARE
    v_actor_id UUID := (SELECT actor_id FROM catalog_intake_ids);
    v_order_id UUID := (SELECT nan_order_id FROM catalog_intake_ids);
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_create_corporate_intake_from_catalog_atomic(
            v_order_id,
            v_actor_id,
            'PT_ORDINARY',
            'PT Modal Tidak Hingga',
            'Jakarta Selatan',
            'DKI Jakarta',
            '["62010"]'::JSONB,
            'NaN'::NUMERIC,
            0,
            '[{
                "role": "FOUNDER",
                "display_name": "Runtime Founder",
                "identity_reference": "protected-ref-nan"
            }]'::JSONB,
            '[{
                "natural_person_name": "Runtime Owner",
                "identity_reference": "protected-ref-nan",
                "control_basis": "OWNERSHIP",
                "percentage": 100,
                "evidence_digest":
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }]'::JSONB,
            'RUNTIME-GATEWAY-NAN',
            'runtime-catalog-intake-nan',
            v_actor_id
        );
        RAISE EXCEPTION 'EXPECTED_NON_FINITE_CAPITAL_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'CORPORATE_INTAKE_CAPITAL_INVALID' THEN
                RAISE;
            END IF;
    END;

    IF EXISTS (
        SELECT 1 FROM public.service_orders WHERE order_id = v_order_id
    ) THEN
        RAISE EXCEPTION 'NON_FINITE_CAPITAL_LEFT_PARTIAL_WRITE';
    END IF;
END;
$$;

GRANT SELECT ON TABLE catalog_intake_ids TO service_role;

SET LOCAL ROLE service_role;
CREATE TEMP TABLE first_catalog_intake_result AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT first_order_id FROM catalog_intake_ids),
    (SELECT actor_id FROM catalog_intake_ids),
    'PT_ORDINARY',
    'PT Runtime Katalog',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010", "63122"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Runtime Founder",
        "identity_reference": "protected-ref-shared",
        "ownership_percentage": 60,
        "voting_percentage": 60
    }, {
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Runtime Founder",
        "identity_reference": "protected-ref-shared",
        "ownership_percentage": 40,
        "voting_percentage": 40
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Runtime Owner",
        "identity_reference": "protected-ref-shared",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest":
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'RUNTIME-GATEWAY-41',
    'runtime-catalog-intake-41',
    (SELECT actor_id FROM catalog_intake_ids)
);
RESET ROLE;

DO $$
DECLARE
    v_order_id UUID := (SELECT first_order_id FROM catalog_intake_ids);
    v_catalog_id UUID := (SELECT catalog_v1_id FROM catalog_intake_ids);
    v_case_id UUID;
BEGIN
    SELECT case_id
    INTO v_case_id
    FROM public.corporate_service_cases
    WHERE order_id = v_order_id;

    IF (SELECT replayed FROM first_catalog_intake_result)
       OR (SELECT pricing_catalog_id FROM first_catalog_intake_result)
            <> v_catalog_id
       OR (SELECT quote_version FROM first_catalog_intake_result) <> 41
       OR (SELECT legal_scope_version FROM first_catalog_intake_result)
            <> 'LEGAL-RUNTIME-41'
       OR (SELECT total_amount_idr FROM first_catalog_intake_result)
            <> 1000000 THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_RESULT_INVALID';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.service_orders
        WHERE order_id = v_order_id
          AND status = 'PAYMENT_PENDING'
          AND currency = 'IDR'
          AND accepted_quote_version = 41
          AND accepted_pricing_catalog_id = v_catalog_id
    ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_ORDER_SNAPSHOT_INVALID';
    END IF;

    IF (SELECT pg_catalog.count(*) FROM public.service_fee_lines
        WHERE order_id = v_order_id) <> 2
       OR (SELECT pg_catalog.sum(amount) FROM public.service_fee_lines
           WHERE order_id = v_order_id
             AND accepted_at IS NOT NULL
             AND quote_version = 41) <> 1000000
       OR (SELECT pg_catalog.count(*) FROM public.payment_milestones
           WHERE order_id = v_order_id
             AND status = 'PENDING'
             AND due_at IS NULL) <> 2
       OR (SELECT pg_catalog.sum(amount) FROM public.payment_milestones
           WHERE order_id = v_order_id
             AND quote_version = 41) <> 1000000 THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_FINANCIAL_SNAPSHOT_INVALID';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.payment_milestones
        WHERE order_id = v_order_id
          AND milestone_type = 'DEPOSIT_INTAKE'
          AND due_offset_anchor = 'INTAKE_ACCEPTED'
          AND due_offset_days = 0
          AND due_at IS NULL
    ) OR NOT EXISTS (
        SELECT 1
        FROM public.payment_milestones
        WHERE order_id = v_order_id
          AND milestone_type = 'NOTARY_READY'
          AND due_offset_anchor = 'NOTARY_ASSIGNED'
          AND due_offset_days = 3
          AND due_at IS NULL
    ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_DUE_OFFSET_INVALID';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.corporate_service_cases
        WHERE case_id = v_case_id
          AND legal_scope_version = 'LEGAL-RUNTIME-41'
    ) OR NOT EXISTS (
        SELECT 1
        FROM public.escrow_transactions
        WHERE corporate_case_id = v_case_id
          AND total_amount_idr = 1000000
    ) THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_CASE_ESCROW_SNAPSHOT_INVALID';
    END IF;

    -- The same protected identity reference may represent a party and a BO.
    IF NOT EXISTS (
        SELECT 1
        FROM public.corporate_parties AS party
        JOIN public.beneficial_owners AS owner
          ON owner.case_id = party.case_id
         AND owner.identity_reference = party.identity_reference
        WHERE party.case_id = v_case_id
    ) THEN
        RAISE EXCEPTION 'PARTY_AND_BO_SHARED_IDENTITY_REFERENCE_REJECTED';
    END IF;
END;
$$;

DO $$
DECLARE
    v_actor_id UUID := (SELECT actor_id FROM catalog_intake_ids);
BEGIN
    BEGIN
        UPDATE public.corporate_service_cases
        SET authorized_capital_idr = NULL
        WHERE order_id = (SELECT first_order_id FROM catalog_intake_ids);

        PERFORM *
        FROM public.fn_create_corporate_intake_from_catalog_atomic(
            (SELECT first_order_id FROM catalog_intake_ids),
            v_actor_id,
            'PT_ORDINARY',
            'PT Runtime Katalog',
            'Jakarta Selatan',
            'DKI Jakarta',
            '["62010", "63122"]'::JSONB,
            100000000,
            25000000,
            '[{
                "party_type": "NATURAL_PERSON",
                "role": "FOUNDER",
                "display_name": "Runtime Founder",
                "identity_reference": "protected-ref-shared",
                "ownership_percentage": 60,
                "voting_percentage": 60
            }, {
                "party_type": "NATURAL_PERSON",
                "role": "FOUNDER",
                "display_name": "Runtime Founder",
                "identity_reference": "protected-ref-shared",
                "ownership_percentage": 40,
                "voting_percentage": 40
            }]'::JSONB,
            '[{
                "declaration_version": 1,
                "natural_person_name": "Runtime Owner",
                "identity_reference": "protected-ref-shared",
                "control_basis": "OWNERSHIP",
                "percentage": 100,
                "evidence_digest":
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }]'::JSONB,
            'RUNTIME-GATEWAY-41',
            'runtime-catalog-intake-41',
            v_actor_id
        );
        RAISE EXCEPTION 'EXPECTED_NULL_SNAPSHOT_CONFLICT';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT' THEN
                RAISE;
            END IF;
    END;
END;
$$;

SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

-- Identical replay must not create another row.
SET LOCAL ROLE service_role;
CREATE TEMP TABLE second_catalog_intake_result AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT first_order_id FROM catalog_intake_ids),
    (SELECT actor_id FROM catalog_intake_ids),
    'PT_ORDINARY',
    'PT Runtime Katalog',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["63122", "62010"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Runtime Founder",
        "identity_reference": "protected-ref-shared",
        "ownership_percentage": 40,
        "voting_percentage": 40
    }, {
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Runtime Founder",
        "identity_reference": "protected-ref-shared",
        "ownership_percentage": 60,
        "voting_percentage": 60
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Runtime Owner",
        "identity_reference": "protected-ref-shared",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest":
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'RUNTIME-GATEWAY-41',
    'runtime-catalog-intake-41',
    (SELECT actor_id FROM catalog_intake_ids)
);
RESET ROLE;

DO $$
DECLARE
    v_order_id UUID := (SELECT first_order_id FROM catalog_intake_ids);
BEGIN
    IF NOT (SELECT replayed FROM second_catalog_intake_result)
       OR (SELECT order_id FROM first_catalog_intake_result)
            <> (SELECT order_id FROM second_catalog_intake_result)
       OR (SELECT corporate_case_id FROM first_catalog_intake_result)
            <> (SELECT corporate_case_id FROM second_catalog_intake_result)
       OR (SELECT escrow_id FROM first_catalog_intake_result)
            <> (SELECT escrow_id FROM second_catalog_intake_result)
       OR (SELECT pg_catalog.count(*) FROM public.service_orders
           WHERE order_id = v_order_id) <> 1
       OR (SELECT pg_catalog.count(*) FROM public.corporate_service_cases
           WHERE order_id = v_order_id) <> 1
       OR (SELECT pg_catalog.count(*) FROM public.service_fee_lines
           WHERE order_id = v_order_id) <> 2
       OR (SELECT pg_catalog.count(*) FROM public.payment_milestones
           WHERE order_id = v_order_id) <> 2 THEN
        RAISE EXCEPTION 'CATALOG_INTAKE_REPLAY_NOT_IDEMPOTENT';
    END IF;
END;
$$;

SELECT public.fn_retire_corporate_pricing_catalog(
    (SELECT catalog_v1_id FROM catalog_intake_ids)
);

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
    catalog_v2_id,
    'PT_ORDINARY',
    42,
    'LEGAL-RUNTIME-42',
    'IDR',
    1200000,
    pg_catalog.clock_timestamp() - INTERVAL '1 hour'
FROM catalog_intake_ids;

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id, fee_line_code, fee_type, description, amount
)
SELECT catalog_v2_id, 'RUNTIME-V2', 'JUSTICA_FEE',
       'Runtime version two fixture', 1200000
FROM catalog_intake_ids;

INSERT INTO public.corporate_pricing_milestones (
    catalog_id,
    milestone_type,
    sequence_number,
    amount,
    releasable_party,
    evidence_condition,
    dispute_refund_rule
)
SELECT catalog_v2_id, 'DEPOSIT_INTAKE', 1, 1200000, 'JUSTICA',
       'Version two intake', 'Version two refund'
FROM catalog_intake_ids;

SELECT public.fn_activate_corporate_pricing_catalog(
    (SELECT catalog_v2_id FROM catalog_intake_ids)
);

-- Retirement and a newer ACTIVE catalog must not move an existing replay.
CREATE TEMP TABLE retired_catalog_replay AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT first_order_id FROM catalog_intake_ids),
    (SELECT actor_id FROM catalog_intake_ids),
    'PT_ORDINARY',
    'PT Runtime Katalog',
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010", "63122"]'::JSONB,
    100000000,
    25000000,
    '[{
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Runtime Founder",
        "identity_reference": "protected-ref-shared",
        "ownership_percentage": 60,
        "voting_percentage": 60
    }, {
        "party_type": "NATURAL_PERSON",
        "role": "FOUNDER",
        "display_name": "Runtime Founder",
        "identity_reference": "protected-ref-shared",
        "ownership_percentage": 40,
        "voting_percentage": 40
    }]'::JSONB,
    '[{
        "declaration_version": 1,
        "natural_person_name": "Runtime Owner",
        "identity_reference": "protected-ref-shared",
        "control_basis": "OWNERSHIP",
        "percentage": 100,
        "evidence_digest":
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'RUNTIME-GATEWAY-41',
    'runtime-catalog-intake-41',
    (SELECT actor_id FROM catalog_intake_ids)
);

DO $$
BEGIN
    IF NOT (SELECT replayed FROM retired_catalog_replay)
       OR (SELECT pricing_catalog_id FROM retired_catalog_replay)
            <> (SELECT catalog_v1_id FROM catalog_intake_ids)
       OR (SELECT quote_version FROM retired_catalog_replay) <> 41 THEN
        RAISE EXCEPTION 'RETIRED_CATALOG_REPLAY_MOVED_TO_NEW_VERSION';
    END IF;
END;
$$;

CREATE TEMP TABLE new_catalog_intake_result AS
SELECT *
FROM public.fn_create_corporate_intake_from_catalog_atomic(
    (SELECT second_order_id FROM catalog_intake_ids),
    (SELECT actor_id FROM catalog_intake_ids),
    'PT_ORDINARY',
    'PT Runtime Katalog Dua',
    'Bandung',
    'Jawa Barat',
    '["62010"]'::JSONB,
    200000000,
    50000000,
    '[{
        "role": "DIRECTOR",
        "display_name": "Runtime Director",
        "identity_reference": "protected-ref-director"
    }]'::JSONB,
    '[{
        "natural_person_name": "Runtime Owner Two",
        "identity_reference": "protected-ref-owner-two",
        "control_basis": "EFFECTIVE_CONTROL",
        "percentage": 100,
        "evidence_digest":
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    }]'::JSONB,
    'RUNTIME-GATEWAY-42',
    'runtime-catalog-intake-42',
    (SELECT actor_id FROM catalog_intake_ids)
);

DO $$
BEGIN
    IF (SELECT pricing_catalog_id FROM new_catalog_intake_result)
            <> (SELECT catalog_v2_id FROM catalog_intake_ids)
       OR (SELECT quote_version FROM new_catalog_intake_result) <> 42
       OR (SELECT total_amount_idr FROM new_catalog_intake_result) <> 1200000
    THEN
        RAISE EXCEPTION 'NEW_ORDER_DID_NOT_USE_NEW_ACTIVE_CATALOG';
    END IF;
END;
$$;

-- Same order/key with a changed non-financial payload must conflict.
DO $$
DECLARE
    v_actor_id UUID := (SELECT actor_id FROM catalog_intake_ids);
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_create_corporate_intake_from_catalog_atomic(
            (SELECT first_order_id FROM catalog_intake_ids),
            v_actor_id,
            'PT_ORDINARY',
            'PT Runtime Payload Berubah',
            'Jakarta Selatan',
            'DKI Jakarta',
            '["62010", "63122"]'::JSONB,
            100000000,
            25000000,
            '[{
                "role": "FOUNDER",
                "display_name": "Runtime Founder",
                "identity_reference": "protected-ref-shared"
            }]'::JSONB,
            '[{
                "natural_person_name": "Runtime Owner",
                "identity_reference": "protected-ref-shared",
                "control_basis": "OWNERSHIP",
                "percentage": 100,
                "evidence_digest":
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }]'::JSONB,
            'RUNTIME-GATEWAY-41',
            'runtime-catalog-intake-41',
            v_actor_id
        );
        RAISE EXCEPTION 'EXPECTED_IDEMPOTENCY_CONFLICT';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT'
            ) = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

DO $$
DECLARE
    v_actor_id UUID := (SELECT actor_id FROM catalog_intake_ids);
BEGIN
    BEGIN
        PERFORM *
        FROM public.fn_create_corporate_intake_from_catalog_atomic(
            (SELECT first_order_id FROM catalog_intake_ids),
            v_actor_id,
            'CV',
            'PT Runtime Katalog',
            'Jakarta Selatan',
            'DKI Jakarta',
            '["62010", "63122"]'::JSONB,
            100000000,
            25000000,
            '[{
                "role": "FOUNDER",
                "display_name": "Runtime Founder",
                "identity_reference": "protected-ref-shared"
            }]'::JSONB,
            '[{
                "natural_person_name": "Runtime Owner",
                "identity_reference": "protected-ref-shared",
                "control_basis": "OWNERSHIP",
                "percentage": 100,
                "evidence_digest":
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            }]'::JSONB,
            'RUNTIME-GATEWAY-41',
            'runtime-catalog-intake-41',
            v_actor_id
        );
        RAISE EXCEPTION 'EXPECTED_SERVICE_TYPE_IDEMPOTENCY_CONFLICT';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT' THEN
                RAISE;
            END IF;
    END;
END;
$$;

-- Accepted catalog/version/type/currency cannot change after DRAFT.
DO $$
DECLARE
    v_order_id UUID := (SELECT first_order_id FROM catalog_intake_ids);
BEGIN
    BEGIN
        UPDATE public.service_orders
        SET status = 'DRAFT'
        WHERE order_id = v_order_id;
        RAISE EXCEPTION 'EXPECTED_ORDER_DRAFT_REENTRY_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'SERVICE_ORDER_DRAFT_REENTRY_FORBIDDEN' THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.payment_milestones
        SET status = 'DRAFT'
        WHERE order_id = v_order_id
          AND milestone_type = 'DEPOSIT_INTAKE';
        RAISE EXCEPTION 'EXPECTED_MILESTONE_DRAFT_REENTRY_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM <> 'MILESTONE_DRAFT_REENTRY_FORBIDDEN' THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.service_orders
        SET accepted_pricing_catalog_id = (
                SELECT catalog_v2_id FROM catalog_intake_ids
            ),
            accepted_quote_version = 42
        WHERE order_id = v_order_id;
        RAISE EXCEPTION 'EXPECTED_ACCEPTED_TERMS_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'SERVICE_ORDER_ACCEPTED_TERMS_IMMUTABLE'
            ) = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.payment_milestones
        SET due_offset_days = due_offset_days + 1
        WHERE order_id = v_order_id
          AND milestone_type = 'NOTARY_READY';
        RAISE EXCEPTION 'EXPECTED_MILESTONE_OFFSET_REJECTION';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(
                SQLERRM,
                'MILESTONE_TERMS_IMMUTABLE'
            ) = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

SET CONSTRAINTS ALL IMMEDIATE;

ROLLBACK;
