-- Batch 3.B: one server-only transaction boundary for signed corporate
-- payment callbacks. Provider initiation remains outside this migration.

CREATE OR REPLACE FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  p_provider_name VARCHAR,
  p_provider_event_id VARCHAR,
  p_event_type VARCHAR,
  p_raw_payload_sha256 TEXT,
  p_order_id UUID,
  p_case_id UUID,
  p_escrow_id UUID,
  p_expected_amount_idr NUMERIC,
  p_payment_gateway_ref VARCHAR,
  p_idempotency_key VARCHAR
)
RETURNS TABLE (
  event_id UUID,
  provider_event_id VARCHAR,
  order_id UUID,
  corporate_case_id UUID,
  escrow_id UUID,
  escrow_status VARCHAR,
  case_stage VARCHAR,
  order_status VARCHAR,
  provider_event_status public.webhook_processed_status,
  funded_milestone_count BIGINT,
  replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_event public.provider_webhook_events%ROWTYPE;
  v_order public.service_orders%ROWTYPE;
  v_case public.corporate_service_cases%ROWTYPE;
  v_escrow public.escrow_transactions%ROWTYPE;
  v_lock RECORD;
  v_expected_reference TEXT;
  v_expected_idempotency_key TEXT;
  v_total_milestones BIGINT := 0;
  v_funded_milestones BIGINT := 0;
  v_was_processed BOOLEAN := FALSE;
BEGIN
  IF p_provider_name IS NULL
     OR p_provider_name = ''
     OR p_provider_name <> pg_catalog.btrim(p_provider_name)
     OR pg_catalog.length(p_provider_name) > 64 THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_INVALID_PROVIDER';
  END IF;

  IF p_provider_event_id IS NULL
     OR p_provider_event_id = ''
     OR p_provider_event_id <> pg_catalog.btrim(p_provider_event_id)
     OR pg_catalog.length(p_provider_event_id) > 192 THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_INVALID_EVENT_ID';
  END IF;

  IF p_event_type IS NULL
     OR p_event_type <> 'INVOICE_PAID'
     OR pg_catalog.length(p_event_type) > 64 THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_INVALID_EVENT_TYPE';
  END IF;

  IF p_raw_payload_sha256 IS NULL
     OR p_raw_payload_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_INVALID_DIGEST';
  END IF;

  IF p_order_id IS NULL OR p_case_id IS NULL OR p_escrow_id IS NULL THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_INVALID_IDENTIFIER';
  END IF;

  IF p_expected_amount_idr IS NULL
     OR p_expected_amount_idr::TEXT IN ('NaN', 'Infinity', '-Infinity')
     OR p_expected_amount_idr <= 0
     OR p_expected_amount_idr <> pg_catalog.trunc(p_expected_amount_idr) THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_INVALID_AMOUNT';
  END IF;

  v_expected_reference := 'CORP-' || pg_catalog.lower(p_order_id::TEXT);
  IF p_payment_gateway_ref IS NULL
     OR p_payment_gateway_ref <> v_expected_reference
     OR pg_catalog.length(p_payment_gateway_ref) > 64 THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_REFERENCE_MISMATCH';
  END IF;

  v_expected_idempotency_key := pg_catalog.substr(
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
  );
  IF p_idempotency_key IS NULL
     OR p_idempotency_key !~ '^[0-9a-f]{48}$'
     OR p_idempotency_key <> v_expected_idempotency_key THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_IDEMPOTENCY_CONFLICT';
  END IF;

  INSERT INTO public.provider_webhook_events (
    order_id,
    provider_name,
    provider_event_id,
    event_type,
    payload_digest_sha256,
    signature_verified,
    processed_status
  ) VALUES (
    p_order_id,
    p_provider_name,
    p_provider_event_id,
    p_event_type,
    p_raw_payload_sha256,
    TRUE,
    'PENDING'::public.webhook_processed_status
  )
  ON CONFLICT ON CONSTRAINT provider_webhook_events_provider_event_id_key DO NOTHING;

  SELECT *
  INTO v_event
  FROM public.provider_webhook_events AS event_row
  WHERE event_row.provider_event_id = p_provider_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_EVENT_UNAVAILABLE';
  END IF;

  IF v_event.provider_name <> p_provider_name
     OR v_event.event_type <> p_event_type
     OR v_event.order_id <> p_order_id
     OR v_event.payload_digest_sha256 <> p_raw_payload_sha256
     OR v_event.signature_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_EVENT_CONFLICT';
  END IF;

  IF v_event.processed_status NOT IN (
    'PENDING'::public.webhook_processed_status,
    'RETRYING'::public.webhook_processed_status,
    'PROCESSED'::public.webhook_processed_status
  ) THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_EVENT_STATE_CONFLICT';
  END IF;
  v_was_processed := v_event.processed_status = 'PROCESSED'::public.webhook_processed_status;

  SELECT *
  INTO v_lock
  FROM public.fn_lock_corporate_escrow_webhook_atomic(
    p_order_id,
    p_case_id,
    p_escrow_id,
    p_expected_amount_idr,
    p_payment_gateway_ref,
    p_idempotency_key
  );

  IF NOT FOUND
     OR v_lock.corporate_case_id <> p_case_id
     OR v_lock.escrow_id <> p_escrow_id THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_ESCROW_RESULT_MISMATCH';
  END IF;

  SELECT *
  INTO v_case
  FROM public.corporate_service_cases AS corporate_case
  WHERE corporate_case.case_id = p_case_id
    AND corporate_case.order_id = p_order_id
  FOR UPDATE;

  SELECT *
  INTO v_escrow
  FROM public.escrow_transactions AS escrow
  WHERE escrow.escrow_id = p_escrow_id
    AND escrow.corporate_case_id = p_case_id
  FOR UPDATE;

  IF v_case.case_id IS NULL
     OR v_case.current_stage <> 'ESCROW_LOCKED'
     OR v_escrow.escrow_id IS NULL
     OR v_escrow.status <> 'HELD_IN_ESCROW'
     OR v_escrow.total_amount_idr <> p_expected_amount_idr
     OR v_escrow.payment_gateway_ref <> p_payment_gateway_ref THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_ESCROW_RESULT_MISMATCH';
  END IF;

  SELECT *
  INTO v_order
  FROM public.service_orders AS service_order
  WHERE service_order.order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_ORDER_NOT_FOUND';
  END IF;

  SELECT
    pg_catalog.count(*),
    pg_catalog.count(*) FILTER (WHERE milestone.status = 'FUNDED')
  INTO v_total_milestones, v_funded_milestones
  FROM public.payment_milestones AS milestone
  WHERE milestone.order_id = p_order_id;

  IF v_total_milestones = 0 THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_MILESTONES_MISSING';
  END IF;

  IF v_was_processed THEN
    IF v_order.status <> 'ACTIVE'
       OR v_funded_milestones <> v_total_milestones THEN
      RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_REPLAY_STATE_MISMATCH';
    END IF;
  ELSE
    IF v_order.status <> 'PAYMENT_PENDING' THEN
      RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_ORDER_STATE_CONFLICT';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.payment_milestones AS milestone
      WHERE milestone.order_id = p_order_id
        AND milestone.status <> 'PENDING'
    ) THEN
      RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_MILESTONE_STATE_CONFLICT';
    END IF;

    UPDATE public.payment_milestones AS milestone
    SET
      status = 'FUNDED',
      funded_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
    WHERE milestone.order_id = p_order_id
      AND milestone.status = 'PENDING';

    UPDATE public.service_orders AS service_order
    SET
      status = 'ACTIVE',
      updated_at = pg_catalog.clock_timestamp()
    WHERE service_order.order_id = p_order_id;

    UPDATE public.provider_webhook_events AS event_row
    SET
      processed_status = 'PROCESSED'::public.webhook_processed_status,
      processed_at = pg_catalog.clock_timestamp()
    WHERE event_row.event_id = v_event.event_id;
  END IF;

  SELECT pg_catalog.count(*)
  INTO v_funded_milestones
  FROM public.payment_milestones AS milestone
  WHERE milestone.order_id = p_order_id
    AND milestone.status = 'FUNDED';

  IF v_funded_milestones <> v_total_milestones THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_SETTLEMENT_INCOMPLETE';
  END IF;

  RETURN QUERY
  SELECT
    event_row.event_id,
    event_row.provider_event_id,
    p_order_id,
    p_case_id,
    p_escrow_id,
    'HELD_IN_ESCROW'::VARCHAR,
    'ESCROW_LOCKED'::VARCHAR,
    'ACTIVE'::VARCHAR,
    event_row.processed_status,
    v_funded_milestones,
    v_was_processed
  FROM public.provider_webhook_events AS event_row
  WHERE event_row.event_id = v_event.event_id
    AND event_row.processed_status = 'PROCESSED'::public.webhook_processed_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CORPORATE_PAYMENT_WEBHOOK_SETTLEMENT_INCOMPLETE';
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) IS 'Server-only signed corporate payment callback boundary. Atomically locks the canonical escrow and advances its case, order, milestones, and append-only provider event. Inbound funding evidence uses provider_webhook_events plus existing compliance/WORM evidence; no dedicated inbound funding ledger exists.';

REVOKE ALL ON FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) FROM anon;
REVOKE ALL ON FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_process_corporate_payment_webhook_atomic(
  VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) TO postgres;

-- The older webhook wrapper commits only the escrow/case portion. Keep it as an
-- internal primitive, but remove it from the externally callable service role.
REVOKE EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_atomic(
  UUID, UUID, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_webhook_atomic(
  UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.fn_webhook_settle_escrow_mutex(
  VARCHAR, UUID, NUMERIC
) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_atomic(
  UUID, UUID, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_webhook_atomic(
  UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_webhook_settle_escrow_mutex(
  VARCHAR, UUID, NUMERIC
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_atomic(
  UUID, UUID, NUMERIC, VARCHAR, VARCHAR, UUID
) TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_webhook_atomic(
  UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_webhook_settle_escrow_mutex(
  VARCHAR, UUID, NUMERIC
) TO postgres;
