BEGIN;

CREATE TEMP TABLE corporate_pricing_catalog_test_ids AS
SELECT
    'a1000000-0000-4000-8000-000000000001'::UUID AS active_catalog_id,
    'a1000000-0000-4000-8000-000000000002'::UUID AS competing_catalog_id,
    'a1000000-0000-4000-8000-000000000003'::UUID AS invalid_catalog_id;

DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    FOREACH v_table_name IN ARRAY ARRAY[
        'corporate_pricing_catalogs',
        'corporate_pricing_fee_lines',
        'corporate_pricing_milestones'
    ] LOOP
        IF pg_catalog.has_table_privilege('anon', 'public.' || v_table_name, 'SELECT')
           OR pg_catalog.has_table_privilege('anon', 'public.' || v_table_name, 'INSERT')
           OR pg_catalog.has_table_privilege('anon', 'public.' || v_table_name, 'UPDATE')
           OR pg_catalog.has_table_privilege('anon', 'public.' || v_table_name, 'DELETE')
           OR pg_catalog.has_table_privilege('authenticated', 'public.' || v_table_name, 'SELECT')
           OR pg_catalog.has_table_privilege('authenticated', 'public.' || v_table_name, 'INSERT')
           OR pg_catalog.has_table_privilege('authenticated', 'public.' || v_table_name, 'UPDATE')
           OR pg_catalog.has_table_privilege('authenticated', 'public.' || v_table_name, 'DELETE')
           OR pg_catalog.has_table_privilege('service_role', 'public.' || v_table_name, 'SELECT')
           OR pg_catalog.has_table_privilege('service_role', 'public.' || v_table_name, 'INSERT')
           OR pg_catalog.has_table_privilege('service_role', 'public.' || v_table_name, 'UPDATE')
           OR pg_catalog.has_table_privilege('service_role', 'public.' || v_table_name, 'DELETE') THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_ACL_NOT_DEFAULT_DENY:%', v_table_name;
        END IF;
    END LOOP;

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
          AND tablename = ANY (ARRAY[
              'corporate_pricing_catalogs',
              'corporate_pricing_fee_lines',
              'corporate_pricing_milestones'
          ])
    ) THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_BROWSER_POLICY_PRESENT';
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
    status,
    effective_from
)
SELECT
    active_catalog_id,
    'PT_ORDINARY',
    91,
    'LOCAL_TEST_SCOPE_91',
    'IDR',
    100,
    'DRAFT',
    pg_catalog.clock_timestamp()
FROM corporate_pricing_catalog_test_ids;

DO $$
BEGIN
    BEGIN
        PERFORM public.fn_activate_corporate_pricing_catalog(
            (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids)
        );
        RAISE EXCEPTION 'EXPECTED_CATALOG_TOTAL_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_TOTAL_MISMATCH') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id,
    fee_line_code,
    fee_type,
    description,
    amount
)
SELECT active_catalog_id, 'LOCAL_TEST_FEE_A', 'JUSTICA_FEE', 'Local test fee A', 40
FROM corporate_pricing_catalog_test_ids
UNION ALL
SELECT active_catalog_id, 'LOCAL_TEST_FEE_B', 'NOTARY_FEE', 'Local test fee B', 60
FROM corporate_pricing_catalog_test_ids;

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
SELECT
    active_catalog_id,
    'DEPOSIT_INTAKE',
    1,
    50,
    'JUSTICA',
    'Local test condition A',
    'Local test refund rule A',
    'LOCAL_TEST_EVENT',
    0
FROM corporate_pricing_catalog_test_ids
UNION ALL
SELECT
    active_catalog_id,
    'NOTARY_READY',
    2,
    50,
    'NOTARY',
    'Local test condition B',
    'Local test refund rule B',
    'LOCAL_TEST_EVENT',
    7
FROM corporate_pricing_catalog_test_ids;

SELECT public.fn_activate_corporate_pricing_catalog(
    (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids)
);

DO $$
BEGIN
    IF (SELECT status FROM public.corporate_pricing_catalogs
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids))
        <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_ACTIVATION_FAILED';
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
    status,
    effective_from
)
SELECT
    competing_catalog_id,
    'PT_ORDINARY',
    92,
    'LOCAL_TEST_SCOPE_92',
    'IDR',
    100,
    'DRAFT',
    pg_catalog.clock_timestamp()
FROM corporate_pricing_catalog_test_ids;

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id,
    fee_line_code,
    fee_type,
    description,
    amount
)
SELECT competing_catalog_id, 'LOCAL_TEST_COMPETING_FEE', 'JUSTICA_FEE', 'Local competing fee', 100
FROM corporate_pricing_catalog_test_ids;

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
    competing_catalog_id,
    'DEPOSIT_INTAKE',
    1,
    100,
    'JUSTICA',
    'Local competing condition',
    'Local competing refund rule'
FROM corporate_pricing_catalog_test_ids;

DO $$
BEGIN
    BEGIN
        PERFORM public.fn_activate_corporate_pricing_catalog(
            (SELECT competing_catalog_id FROM corporate_pricing_catalog_test_ids)
        );
        RAISE EXCEPTION 'EXPECTED_SECOND_ACTIVE_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_ACTIVE_EXISTS') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

DO $$
BEGIN
    BEGIN
        UPDATE public.corporate_pricing_catalogs
        SET total_amount_idr = 101
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids);
        RAISE EXCEPTION 'EXPECTED_ACTIVE_CATALOG_IMMUTABILITY_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.corporate_pricing_fee_lines
        SET amount = 41
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids)
          AND fee_line_code = 'LOCAL_TEST_FEE_A';
        RAISE EXCEPTION 'EXPECTED_ACTIVE_CHILD_IMMUTABILITY_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_CHILD_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.corporate_pricing_fee_lines
        SET catalog_id = (SELECT competing_catalog_id FROM corporate_pricing_catalog_test_ids)
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids)
          AND fee_line_code = 'LOCAL_TEST_FEE_A';
        RAISE EXCEPTION 'EXPECTED_ACTIVE_CHILD_REPARENT_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_CHILD_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.corporate_pricing_catalogs
        SET status = 'RETIRED'
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids);
        RAISE EXCEPTION 'EXPECTED_DIRECT_RETIRE_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_TRANSITION_FORBIDDEN') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

SELECT public.fn_retire_corporate_pricing_catalog(
    (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids)
);

DO $$
BEGIN
    BEGIN
        DELETE FROM public.corporate_pricing_milestones
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids);
        RAISE EXCEPTION 'EXPECTED_RETIRED_CHILD_IMMUTABILITY_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_CHILD_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;

    BEGIN
        UPDATE public.corporate_pricing_catalogs
        SET legal_scope_version = 'LOCAL_TEST_SCOPE_MUTATED'
        WHERE catalog_id = (SELECT active_catalog_id FROM corporate_pricing_catalog_test_ids);
        RAISE EXCEPTION 'EXPECTED_RETIRED_CATALOG_IMMUTABILITY_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_IMMUTABLE') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

DO $$
BEGIN
    BEGIN
        UPDATE public.corporate_pricing_catalogs
        SET status = 'RETIRED'
        WHERE catalog_id = (SELECT competing_catalog_id FROM corporate_pricing_catalog_test_ids);
        RAISE EXCEPTION 'EXPECTED_DRAFT_TO_RETIRED_REJECTION_MISSING';
    EXCEPTION
        WHEN OTHERS THEN
            IF pg_catalog.strpos(SQLERRM, 'CORPORATE_PRICING_CATALOG_TRANSITION_FORBIDDEN') = 0 THEN
                RAISE;
            END IF;
    END;
END;
$$;

DO $$
DECLARE
    v_fixture_id UUID;
    v_fee_total NUMERIC;
    v_milestone_total NUMERIC;
BEGIN
    v_fixture_id := 'b1000000-0000-4000-8000-000000000001'::UUID;

    IF NOT EXISTS (
        SELECT 1
        FROM public.corporate_pricing_catalogs
        WHERE catalog_id = v_fixture_id
          AND legal_scope_version LIKE 'LOCAL_TEST_ONLY%'
          AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'LOCAL_TEST_ONLY_CATALOG_FIXTURE_MISSING';
    END IF;

    SELECT COALESCE(SUM(amount), 0)
    INTO v_fee_total
    FROM public.corporate_pricing_fee_lines
    WHERE catalog_id = v_fixture_id;

    SELECT COALESCE(SUM(amount), 0)
    INTO v_milestone_total
    FROM public.corporate_pricing_milestones
    WHERE catalog_id = v_fixture_id;

    IF v_fee_total <> (SELECT total_amount_idr FROM public.corporate_pricing_catalogs WHERE catalog_id = v_fixture_id)
       OR v_milestone_total <> (SELECT total_amount_idr FROM public.corporate_pricing_catalogs WHERE catalog_id = v_fixture_id) THEN
        RAISE EXCEPTION 'LOCAL_TEST_ONLY_CATALOG_FIXTURE_TOTAL_INVALID';
    END IF;
END;
$$;

ROLLBACK;
