\set ON_ERROR_STOP on

-- Batch 3.B real runtime: every fixture and mutation is transaction-scoped.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'auth'
        AND table_name = 'users'
        AND column_name = 'email_confirmed_at'
    ) THEN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'b3b10000-0000-4000-8000-000000000001',
        'authenticated',
        'authenticated',
        'settlement-runtime@example.invalid',
        '!ROLLBACK-RUNTIME!',
        pg_catalog.clock_timestamp(),
        '',
        '',
        '{"provider":"email","providers":["email"],"role":"CLIENT"}'::JSONB,
        '{"role":"CLIENT","full_name":"Settlement Runtime Client"}'::JSONB,
        FALSE,
        pg_catalog.clock_timestamp(),
        pg_catalog.clock_timestamp()
      );
    ELSE
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'b3b10000-0000-4000-8000-000000000001',
        'authenticated',
        'authenticated',
        'settlement-runtime@example.invalid',
        '!ROLLBACK-RUNTIME!',
        pg_catalog.clock_timestamp(),
        '{"provider":"email","providers":["email"],"role":"CLIENT"}'::JSONB,
        '{"role":"CLIENT","full_name":"Settlement Runtime Client"}'::JSONB,
        FALSE,
        pg_catalog.clock_timestamp(),
        pg_catalog.clock_timestamp()
      );
    END IF;
  END IF;
END;
$$;

CREATE TEMP TABLE settlement_runtime_context AS
SELECT
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS actor_id,
  'sandbox-provider'::VARCHAR AS provider_name;

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
  'b3b20000-0000-4000-8000-000000000001'::UUID,
  'PT_ORDINARY',
  1,
  'BATCH_3B_RUNTIME_SCOPE_V1',
  'IDR',
  300,
  'DRAFT',
  pg_catalog.clock_timestamp()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.corporate_pricing_catalogs AS catalog
  WHERE catalog.service_type = 'PT_ORDINARY'
    AND catalog.status = 'ACTIVE'
    AND catalog.effective_from <= pg_catalog.clock_timestamp()
    AND (
      catalog.effective_until IS NULL
      OR catalog.effective_until > pg_catalog.clock_timestamp()
    )
);

INSERT INTO public.corporate_pricing_fee_lines (
  catalog_id,
  fee_line_code,
  fee_type,
  description,
  amount
)
SELECT
  'b3b20000-0000-4000-8000-000000000001'::UUID,
  fixture.fee_line_code,
  fixture.fee_type,
  fixture.description,
  fixture.amount
FROM (VALUES
  ('BATCH_3B_CORE', 'JUSTICA_FEE', 'Batch 3.B runtime fee A', 100::NUMERIC),
  ('BATCH_3B_ADMIN', 'OTHER_APPROVED', 'Batch 3.B runtime fee B', 200::NUMERIC)
) AS fixture(fee_line_code, fee_type, description, amount)
WHERE EXISTS (
  SELECT 1 FROM public.corporate_pricing_catalogs
  WHERE catalog_id = 'b3b20000-0000-4000-8000-000000000001'::UUID
);

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
  'b3b20000-0000-4000-8000-000000000001'::UUID,
  fixture.milestone_type,
  fixture.sequence_number,
  fixture.amount,
  fixture.releasable_party,
  fixture.evidence_condition,
  fixture.dispute_refund_rule,
  'BATCH_3B_RUNTIME_EVENT',
  fixture.due_offset_days
FROM (VALUES
  (
    'DEPOSIT_INTAKE',
    1::SMALLINT,
    150::NUMERIC,
    'JUSTICA',
    'Batch 3.B runtime condition A',
    'Batch 3.B runtime refund rule A',
    0::SMALLINT
  ),
  (
    'OSS_COMPLETE',
    2::SMALLINT,
    150::NUMERIC,
    'GOVERNMENT',
    'Batch 3.B runtime condition B',
    'Batch 3.B runtime refund rule B',
    7::SMALLINT
  )
) AS fixture(
  milestone_type,
  sequence_number,
  amount,
  releasable_party,
  evidence_condition,
  dispute_refund_rule,
  due_offset_days
)
WHERE EXISTS (
  SELECT 1 FROM public.corporate_pricing_catalogs
  WHERE catalog_id = 'b3b20000-0000-4000-8000-000000000001'::UUID
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.corporate_pricing_catalogs
    WHERE catalog_id = 'b3b20000-0000-4000-8000-000000000001'::UUID
      AND status = 'DRAFT'
  ) THEN
    PERFORM public.fn_activate_corporate_pricing_catalog(
      'b3b20000-0000-4000-8000-000000000001'::UUID
    );
  END IF;
END;
$$;

DO $$
DECLARE
  v_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
    'public.fn_process_corporate_payment_webhook_atomic(character varying,character varying,character varying,text,uuid,uuid,uuid,numeric,character varying,character varying)'
  );
  v_lock_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
    'public.fn_lock_corporate_escrow_atomic(uuid,uuid,numeric,character varying,character varying,uuid)'
  );
  v_webhook_wrapper REGPROCEDURE := pg_catalog.to_regprocedure(
    'public.fn_lock_corporate_escrow_webhook_atomic(uuid,uuid,uuid,numeric,character varying,character varying)'
  );
  v_legacy_webhook_rpc REGPROCEDURE := pg_catalog.to_regprocedure(
    'public.fn_webhook_settle_escrow_mutex(character varying,uuid,numeric)'
  );
BEGIN
  IF (SELECT actor_id FROM settlement_runtime_context) IS NULL THEN
    RAISE EXCEPTION 'SETTLEMENT_RUNTIME_REQUIRES_LOCAL_AUTH_USER';
  END IF;
  IF v_rpc IS NULL THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_RPC_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS proc
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = proc.pronamespace
    WHERE namespace.nspname = 'public'
      AND proc.oid = v_rpc
      AND proc.prosecdef
      AND proc.proconfig = ARRAY['search_path=""']
  ) THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_RPC_SECURITY_INVALID';
  END IF;
  IF pg_catalog.has_function_privilege('anon', v_rpc, 'EXECUTE')
     OR pg_catalog.has_function_privilege('authenticated', v_rpc, 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('service_role', v_rpc, 'EXECUTE') THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_RPC_ACL_INVALID';
  END IF;
  IF pg_catalog.has_function_privilege('service_role', v_lock_rpc, 'EXECUTE')
     OR pg_catalog.has_function_privilege(
       'service_role',
       v_webhook_wrapper,
       'EXECUTE'
     )
     OR pg_catalog.has_function_privilege(
       'service_role',
       v_legacy_webhook_rpc,
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'LEGACY_SETTLEMENT_RPC_ACL_OPEN';
  END IF;
  IF pg_catalog.has_table_privilege(
      'anon', 'public.provider_webhook_events', 'INSERT,UPDATE,DELETE'
    )
     OR pg_catalog.has_table_privilege(
      'authenticated', 'public.provider_webhook_events', 'INSERT,UPDATE,DELETE'
    ) THEN
    RAISE EXCEPTION 'PROVIDER_WEBHOOK_EVENT_BROWSER_DML_OPEN';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.corporate_pricing_catalogs AS catalog
    WHERE catalog.service_type = 'PT_ORDINARY'
      AND catalog.status = 'ACTIVE'
      AND catalog.effective_from <= pg_catalog.clock_timestamp()
      AND (
        catalog.effective_until IS NULL
        OR catalog.effective_until > pg_catalog.clock_timestamp()
      )
  ) THEN
    RAISE EXCEPTION 'SETTLEMENT_RUNTIME_ACTIVE_CATALOG_REQUIRED';
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
  'Settlement Runtime Client',
  'settlement-runtime@example.invalid',
  '+620000000031',
  'VERIFIED',
  '!ROLLBACK-RUNTIME!'
FROM settlement_runtime_context
ON CONFLICT (client_id) DO NOTHING;

CREATE OR REPLACE FUNCTION pg_temp.create_settlement_fixture(p_order_id UUID)
RETURNS TABLE (
  order_id UUID,
  corporate_case_id UUID,
  escrow_id UUID,
  total_amount_idr NUMERIC
)
LANGUAGE plpgsql
SET search_path = ''
AS $fixture$
DECLARE
  v_actor_id UUID := (SELECT actor_id FROM pg_temp.settlement_runtime_context);
BEGIN
  RETURN QUERY
  SELECT
    created.order_id,
    created.corporate_case_id,
    created.escrow_id,
    created.total_amount_idr
  FROM public.fn_create_corporate_intake_from_catalog_atomic(
    p_order_id,
    v_actor_id,
    'PT_ORDINARY',
    'PT Runtime Settlement ' || pg_catalog.right(p_order_id::TEXT, 4),
    'Jakarta Selatan',
    'DKI Jakarta',
    '["62010"]'::JSONB,
    100000000,
    25000000,
    '[{
      "party_type": "NATURAL_PERSON",
      "role": "FOUNDER",
      "display_name": "Runtime Founder",
      "identity_reference": "runtime-protected-ref",
      "ownership_percentage": 100,
      "voting_percentage": 100
    }]'::JSONB,
    '[{
      "declaration_version": 1,
      "natural_person_name": "Runtime Owner",
      "identity_reference": "runtime-protected-ref",
      "control_basis": "OWNERSHIP",
      "percentage": 100,
      "evidence_digest":
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }]'::JSONB,
    'CORP-' || pg_catalog.lower(p_order_id::TEXT),
    pg_catalog.substr(
      pg_catalog.encode(
        extensions.digest(
          pg_catalog.convert_to('runtime-intake:' || p_order_id::TEXT, 'UTF8'),
          'sha256'
        ),
        'hex'
      ),
      1,
      48
    ),
    v_actor_id
  ) AS created;
END;
$fixture$;

CREATE TEMP TABLE settlement_fixtures (
  fixture_name TEXT PRIMARY KEY,
  order_id UUID NOT NULL,
  corporate_case_id UUID NOT NULL,
  escrow_id UUID NOT NULL,
  total_amount_idr NUMERIC NOT NULL
);

INSERT INTO settlement_fixtures
SELECT 'valid', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000001'::UUID
) AS fixture;
INSERT INTO settlement_fixtures
SELECT 'amount_mismatch', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000002'::UUID
) AS fixture;
INSERT INTO settlement_fixtures
SELECT 'reference_mismatch', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000003'::UUID
) AS fixture;
INSERT INTO settlement_fixtures
SELECT 'order_mismatch', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000004'::UUID
) AS fixture;
INSERT INTO settlement_fixtures
SELECT 'case_mismatch', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000005'::UUID
) AS fixture;
INSERT INTO settlement_fixtures
SELECT 'escrow_mismatch', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000006'::UUID
) AS fixture;
INSERT INTO settlement_fixtures
SELECT 'idempotency_mismatch', fixture.*
FROM pg_temp.create_settlement_fixture(
  'b3b00000-0000-4000-8000-000000000007'::UUID
) AS fixture;

CREATE OR REPLACE FUNCTION pg_temp.webhook_key(
  p_provider_name TEXT,
  p_provider_event_id TEXT
)
RETURNS VARCHAR
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $key$
  SELECT pg_catalog.substr(
    pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(
          'payment-webhook:' || p_provider_name || ':' || p_provider_event_id,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    ),
    1,
    48
  )::VARCHAR
$key$;

CREATE OR REPLACE FUNCTION pg_temp.expect_settlement_failure(
  p_expected_error TEXT,
  p_provider_event_id VARCHAR,
  p_digest TEXT,
  p_order_id UUID,
  p_case_id UUID,
  p_escrow_id UUID,
  p_amount NUMERIC,
  p_reference VARCHAR,
  p_idempotency_key VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $expect$
BEGIN
  BEGIN
    PERFORM *
    FROM public.fn_process_corporate_payment_webhook_atomic(
      (SELECT provider_name FROM pg_temp.settlement_runtime_context),
      p_provider_event_id,
      'INVOICE_PAID',
      p_digest,
      p_order_id,
      p_case_id,
      p_escrow_id,
      p_amount,
      p_reference,
      p_idempotency_key
    );
  EXCEPTION
    WHEN OTHERS THEN
      IF pg_catalog.strpos(SQLERRM, p_expected_error) = 0 THEN
        RAISE EXCEPTION 'UNEXPECTED_SETTLEMENT_ERROR: expected %, received %',
          p_expected_error,
          SQLERRM;
      END IF;
      RETURN;
  END;

  RAISE EXCEPTION 'EXPECTED_SETTLEMENT_REJECTION: %', p_expected_error;
END;
$expect$;

CREATE TEMP TABLE settlement_first_result AS
SELECT *
FROM public.fn_process_corporate_payment_webhook_atomic(
  (SELECT provider_name FROM settlement_runtime_context),
  'evt-valid-001',
  'INVOICE_PAID',
  pg_catalog.repeat('a', 64),
  (SELECT order_id FROM settlement_fixtures WHERE fixture_name = 'valid'),
  (
    SELECT corporate_case_id
    FROM settlement_fixtures
    WHERE fixture_name = 'valid'
  ),
  (SELECT escrow_id FROM settlement_fixtures WHERE fixture_name = 'valid'),
  (
    SELECT total_amount_idr
    FROM settlement_fixtures
    WHERE fixture_name = 'valid'
  ),
  'CORP-' || (
    SELECT pg_catalog.lower(order_id::TEXT)
    FROM settlement_fixtures
    WHERE fixture_name = 'valid'
  ),
  pg_temp.webhook_key(
    (SELECT provider_name FROM settlement_runtime_context),
    'evt-valid-001'
  )
);

CREATE TEMP TABLE settlement_replay_result AS
SELECT *
FROM public.fn_process_corporate_payment_webhook_atomic(
  (SELECT provider_name FROM settlement_runtime_context),
  'evt-valid-001',
  'INVOICE_PAID',
  pg_catalog.repeat('a', 64),
  (SELECT order_id FROM settlement_fixtures WHERE fixture_name = 'valid'),
  (
    SELECT corporate_case_id
    FROM settlement_fixtures
    WHERE fixture_name = 'valid'
  ),
  (SELECT escrow_id FROM settlement_fixtures WHERE fixture_name = 'valid'),
  (
    SELECT total_amount_idr
    FROM settlement_fixtures
    WHERE fixture_name = 'valid'
  ),
  'CORP-' || (
    SELECT pg_catalog.lower(order_id::TEXT)
    FROM settlement_fixtures
    WHERE fixture_name = 'valid'
  ),
  pg_temp.webhook_key(
    (SELECT provider_name FROM settlement_runtime_context),
    'evt-valid-001'
  )
);

DO $$
DECLARE
  v_valid pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture
    FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'valid'
  );
BEGIN
  IF (SELECT pg_catalog.count(*) FROM pg_temp.settlement_first_result) <> 1
     OR (SELECT replayed FROM pg_temp.settlement_first_result)
     OR (SELECT escrow_status FROM pg_temp.settlement_first_result)
          <> 'HELD_IN_ESCROW'
     OR (SELECT case_stage FROM pg_temp.settlement_first_result)
          <> 'ESCROW_LOCKED'
     OR (SELECT order_status FROM pg_temp.settlement_first_result) <> 'ACTIVE'
     OR (SELECT provider_event_status FROM pg_temp.settlement_first_result)
          <> 'PROCESSED'
     OR (SELECT funded_milestone_count FROM pg_temp.settlement_first_result) < 1 THEN
    RAISE EXCEPTION 'VALID_SETTLEMENT_RESULT_INVALID';
  END IF;

  IF (SELECT pg_catalog.count(*) FROM pg_temp.settlement_replay_result) <> 1
     OR NOT (SELECT replayed FROM pg_temp.settlement_replay_result)
     OR (SELECT event_id FROM pg_temp.settlement_replay_result)
          <> (SELECT event_id FROM pg_temp.settlement_first_result) THEN
    RAISE EXCEPTION 'IDENTICAL_SETTLEMENT_REPLAY_INVALID';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.service_orders
    WHERE order_id = v_valid.order_id AND status = 'ACTIVE'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.corporate_service_cases
    WHERE case_id = v_valid.corporate_case_id
      AND current_stage = 'ESCROW_LOCKED'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.escrow_transactions
    WHERE escrow_id = v_valid.escrow_id
      AND status = 'HELD_IN_ESCROW'
      AND funds_locked_at IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM public.payment_milestones
    WHERE order_id = v_valid.order_id AND status <> 'FUNDED'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.provider_webhook_events
    WHERE provider_event_id = 'evt-valid-001'
      AND order_id = v_valid.order_id
      AND payload_digest_sha256 = pg_catalog.repeat('a', 64)
      AND signature_verified
      AND processed_status = 'PROCESSED'
      AND processed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'VALID_SETTLEMENT_CANONICAL_STATE_INVALID';
  END IF;

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_PAYMENT_WEBHOOK_EVENT_CONFLICT',
    'evt-valid-001',
    pg_catalog.repeat('b', 64),
    v_valid.order_id,
    v_valid.corporate_case_id,
    v_valid.escrow_id,
    v_valid.total_amount_idr,
    ('CORP-' || pg_catalog.lower(v_valid.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(
      (SELECT provider_name FROM pg_temp.settlement_runtime_context),
      'evt-valid-001'
    )
  );

  IF (SELECT pg_catalog.count(*) FROM public.provider_webhook_events
      WHERE provider_event_id = 'evt-valid-001') <> 1
     OR (SELECT payload_digest_sha256 FROM public.provider_webhook_events
         WHERE provider_event_id = 'evt-valid-001') <> pg_catalog.repeat('a', 64) THEN
    RAISE EXCEPTION 'MUTATED_REPLAY_CHANGED_CANONICAL_EVENT';
  END IF;
END;
$$;

DO $$
DECLARE
  v_amount pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'amount_mismatch'
  );
  v_reference pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'reference_mismatch'
  );
  v_order pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'order_mismatch'
  );
  v_case pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'case_mismatch'
  );
  v_escrow pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'escrow_mismatch'
  );
  v_idempotency pg_temp.settlement_fixtures%ROWTYPE := (
    SELECT fixture FROM pg_temp.settlement_fixtures AS fixture
    WHERE fixture.fixture_name = 'idempotency_mismatch'
  );
  v_provider TEXT := (
    SELECT provider_name FROM pg_temp.settlement_runtime_context
  );
BEGIN
  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_ESCROW_LOCK_PAYMENT_MISMATCH',
    'evt-amount-mismatch',
    pg_catalog.repeat('b', 64),
    v_amount.order_id,
    v_amount.corporate_case_id,
    v_amount.escrow_id,
    v_amount.total_amount_idr + 1,
    ('CORP-' || pg_catalog.lower(v_amount.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(v_provider, 'evt-amount-mismatch')
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_PAYMENT_WEBHOOK_REFERENCE_MISMATCH',
    'evt-reference-mismatch',
    pg_catalog.repeat('c', 64),
    v_reference.order_id,
    v_reference.corporate_case_id,
    v_reference.escrow_id,
    v_reference.total_amount_idr,
    'CORP-b3b00000-0000-4000-8000-ffffffffffff',
    pg_temp.webhook_key(v_provider, 'evt-reference-mismatch')
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_ESCROW_WEBHOOK_ORDER_CASE_MISMATCH',
    'evt-order-mismatch',
    pg_catalog.repeat('d', 64),
    v_order.order_id,
    v_case.corporate_case_id,
    v_case.escrow_id,
    v_case.total_amount_idr,
    ('CORP-' || pg_catalog.lower(v_order.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(v_provider, 'evt-order-mismatch')
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_ESCROW_WEBHOOK_ORDER_CASE_MISMATCH',
    'evt-case-mismatch',
    pg_catalog.repeat('e', 64),
    v_case.order_id,
    v_order.corporate_case_id,
    v_order.escrow_id,
    v_order.total_amount_idr,
    ('CORP-' || pg_catalog.lower(v_case.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(v_provider, 'evt-case-mismatch')
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_ESCROW_LOCK_ESCROW_NOT_FOUND',
    'evt-escrow-mismatch',
    pg_catalog.repeat('f', 64),
    v_escrow.order_id,
    v_escrow.corporate_case_id,
    v_idempotency.escrow_id,
    v_escrow.total_amount_idr,
    ('CORP-' || pg_catalog.lower(v_escrow.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(v_provider, 'evt-escrow-mismatch')
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_PAYMENT_WEBHOOK_IDEMPOTENCY_CONFLICT',
    'evt-idempotency-mismatch',
    pg_catalog.repeat('1', 64),
    v_idempotency.order_id,
    v_idempotency.corporate_case_id,
    v_idempotency.escrow_id,
    v_idempotency.total_amount_idr,
    ('CORP-' || pg_catalog.lower(v_idempotency.order_id::TEXT))::VARCHAR,
    pg_catalog.repeat('0', 48)::VARCHAR
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_PAYMENT_WEBHOOK_INVALID_AMOUNT',
    'evt-nan',
    pg_catalog.repeat('2', 64),
    v_amount.order_id,
    v_amount.corporate_case_id,
    v_amount.escrow_id,
    'NaN'::NUMERIC,
    ('CORP-' || pg_catalog.lower(v_amount.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(v_provider, 'evt-nan')
  );

  PERFORM pg_temp.expect_settlement_failure(
    'CORPORATE_PAYMENT_WEBHOOK_INVALID_AMOUNT',
    'evt-null',
    pg_catalog.repeat('3', 64),
    v_amount.order_id,
    v_amount.corporate_case_id,
    v_amount.escrow_id,
    NULL,
    ('CORP-' || pg_catalog.lower(v_amount.order_id::TEXT))::VARCHAR,
    pg_temp.webhook_key(v_provider, 'evt-null')
  );
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_temp.settlement_fixtures AS fixture
    JOIN public.service_orders AS service_order
      ON service_order.order_id = fixture.order_id
    WHERE fixture.fixture_name <> 'valid'
      AND service_order.status <> 'PAYMENT_PENDING'
  ) OR EXISTS (
    SELECT 1
    FROM pg_temp.settlement_fixtures AS fixture
    JOIN public.corporate_service_cases AS corporate_case
      ON corporate_case.case_id = fixture.corporate_case_id
    WHERE fixture.fixture_name <> 'valid'
      AND corporate_case.current_stage <> 'DRAFT'
  ) OR EXISTS (
    SELECT 1
    FROM pg_temp.settlement_fixtures AS fixture
    JOIN public.escrow_transactions AS escrow
      ON escrow.escrow_id = fixture.escrow_id
    WHERE fixture.fixture_name <> 'valid'
      AND escrow.status <> 'PENDING_PAYMENT'
  ) OR EXISTS (
    SELECT 1
    FROM pg_temp.settlement_fixtures AS fixture
    JOIN public.payment_milestones AS milestone
      ON milestone.order_id = fixture.order_id
    WHERE fixture.fixture_name <> 'valid'
      AND milestone.status <> 'PENDING'
  ) OR EXISTS (
    SELECT 1
    FROM public.provider_webhook_events
    WHERE provider_event_id IN (
      'evt-amount-mismatch',
      'evt-reference-mismatch',
      'evt-order-mismatch',
      'evt-case-mismatch',
      'evt-escrow-mismatch',
      'evt-idempotency-mismatch',
      'evt-nan',
      'evt-null'
    )
  ) THEN
    RAISE EXCEPTION 'REJECTED_SETTLEMENT_LEFT_PARTIAL_WRITE';
  END IF;
END;
$$;

DO $$
DECLARE
  v_case_id UUID := (
    SELECT corporate_case_id
    FROM pg_temp.settlement_fixtures
    WHERE fixture_name = 'amount_mismatch'
  );
  v_actor_id UUID := (
    SELECT actor_id FROM pg_temp.settlement_runtime_context
  );
BEGIN
  BEGIN
    UPDATE public.corporate_service_cases
    SET assigned_notary_id = v_actor_id
    WHERE case_id = v_case_id;
    RAISE EXCEPTION 'EXPECTED_NOTARY_ASSIGNMENT_REJECTION';
  EXCEPTION
    WHEN OTHERS THEN
      IF pg_catalog.strpos(
        SQLERRM,
        'NOTARY_ASSIGNMENT_REQUIRES_HELD_ESCROW'
      ) = 0 THEN
        RAISE;
      END IF;
  END;
END;
$$;

SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM *
    FROM public.fn_process_corporate_payment_webhook_atomic(
      'sandbox-provider',
      'evt-anon-denied',
      'INVOICE_PAID',
      pg_catalog.repeat('4', 64),
      'b3b00000-0000-4000-8000-000000000001'::UUID,
      '00000000-0000-4000-8000-000000000001'::UUID,
      '00000000-0000-4000-8000-000000000002'::UUID,
      1,
      'CORP-b3b00000-0000-4000-8000-000000000001',
      pg_catalog.repeat('4', 48)::VARCHAR
    );
    RAISE EXCEPTION 'ANON_RPC_EXECUTE_WAS_NOT_DENIED';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.provider_webhook_events (
      order_id,
      provider_name,
      provider_event_id,
      event_type,
      payload_digest_sha256,
      signature_verified
    ) VALUES (
      'b3b00000-0000-4000-8000-000000000001'::UUID,
      'sandbox-provider',
      'evt-anon-dml',
      'INVOICE_PAID',
      pg_catalog.repeat('5', 64),
      TRUE
    );
    RAISE EXCEPTION 'ANON_PROVIDER_EVENT_DML_WAS_NOT_DENIED';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;
RESET ROLE;

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM *
    FROM public.fn_process_corporate_payment_webhook_atomic(
      'sandbox-provider',
      'evt-authenticated-denied',
      'INVOICE_PAID',
      pg_catalog.repeat('6', 64),
      'b3b00000-0000-4000-8000-000000000001'::UUID,
      '00000000-0000-4000-8000-000000000001'::UUID,
      '00000000-0000-4000-8000-000000000002'::UUID,
      1,
      'CORP-b3b00000-0000-4000-8000-000000000001',
      pg_catalog.repeat('6', 48)::VARCHAR
    );
    RAISE EXCEPTION 'AUTHENTICATED_RPC_EXECUTE_WAS_NOT_DENIED';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.provider_webhook_events (
      order_id,
      provider_name,
      provider_event_id,
      event_type,
      payload_digest_sha256,
      signature_verified
    ) VALUES (
      'b3b00000-0000-4000-8000-000000000001'::UUID,
      'sandbox-provider',
      'evt-authenticated-dml',
      'INVOICE_PAID',
      pg_catalog.repeat('7', 64),
      TRUE
    );
    RAISE EXCEPTION 'AUTHENTICATED_PROVIDER_EVENT_DML_WAS_NOT_DENIED';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;
RESET ROLE;

SELECT
  'assertions-complete' AS runtime_status,
  (SELECT event_id FROM settlement_first_result) AS canonical_event_id,
  (SELECT funded_milestone_count FROM settlement_first_result)
    AS funded_milestone_count;

ROLLBACK;
