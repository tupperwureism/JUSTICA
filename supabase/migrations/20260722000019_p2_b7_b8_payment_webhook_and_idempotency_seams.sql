-- P2-B7/B8: expand-only payment webhook, payout idempotency, and integrity seams.
-- Provider network calls MUST occur outside every database transaction/mutex.

CREATE TYPE public.webhook_processed_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'RETRYING');
CREATE TYPE public.payout_channel AS ENUM ('BI_FAST', 'RTGS', 'VIRTUAL_ACCOUNT');
CREATE TYPE public.payout_idempotency_status AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');
CREATE TYPE public.document_anchor_source AS ENUM ('JUSTICA_WORM', 'PERURI_EMETERAI', 'PSRE_DIGITAL_SIGN');

CREATE TABLE public.provider_webhook_events (
    event_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.service_orders(order_id) ON DELETE RESTRICT,
    provider_name VARCHAR(64) NOT NULL,
    provider_event_id VARCHAR(192) NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    payload_digest_sha256 TEXT NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT false,
    processed_status public.webhook_processed_status NOT NULL DEFAULT 'PENDING',
    received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT chk_webhook_provider_name CHECK (btrim(provider_name) <> ''),
    CONSTRAINT chk_webhook_event_type CHECK (event_type IN ('INVOICE_PAID', 'DISBURSEMENT_SUCCESS', 'DISBURSEMENT_FAILED')),
    CONSTRAINT chk_webhook_payload_digest CHECK (payload_digest_sha256 ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_webhook_processed_at CHECK ((processed_status = 'PROCESSED' AND processed_at IS NOT NULL) OR (processed_status <> 'PROCESSED' AND processed_at IS NULL))
);

CREATE TABLE public.payout_idempotency_keys (
    key_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,
    escrow_transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(escrow_id) ON DELETE RESTRICT,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL,
    payout_channel public.payout_channel NOT NULL,
    status public.payout_idempotency_status NOT NULL DEFAULT 'INITIATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_payout_idempotency_digest CHECK (idempotency_key ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_payout_idempotency_amount CHECK (amount > 0)
);

CREATE TABLE public.document_integrity_anchors (
    anchor_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    document_type VARCHAR(32) NOT NULL,
    document_id UUID NOT NULL,
    anchor_source public.document_anchor_source NOT NULL,
    serial_number VARCHAR(192) UNIQUE,
    sha256_document_hash TEXT NOT NULL,
    anchored_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_integrity_document_type CHECK (document_type IN ('LEGAL_OPINION', 'CORPORATE_DEED', 'MOU')),
    CONSTRAINT chk_integrity_serial CHECK (serial_number IS NULL OR btrim(serial_number) <> ''),
    CONSTRAINT chk_integrity_digest CHECK (sha256_document_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_provider_webhook_order_received ON public.provider_webhook_events(order_id, received_at DESC);
CREATE INDEX idx_provider_webhook_pending ON public.provider_webhook_events(received_at) WHERE processed_status IN ('PENDING', 'RETRYING');
CREATE INDEX idx_payout_idempotency_escrow_created ON public.payout_idempotency_keys(escrow_transaction_id, created_at DESC);
CREATE INDEX idx_integrity_anchor_document ON public.document_integrity_anchors(document_type, document_id, anchored_at DESC);

CREATE TRIGGER trg_worm_document_integrity_anchors
BEFORE UPDATE OR DELETE ON public.document_integrity_anchors
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worm_mutation();

CREATE OR REPLACE FUNCTION public.fn_webhook_settle_escrow_mutex(
    p_provider_event_id VARCHAR,
    p_order_id UUID,
    p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_event public.provider_webhook_events%ROWTYPE;
    v_escrow public.escrow_transactions%ROWTYPE;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_SETTLEMENT_AMOUNT: Nominal settlement harus positif.';
    END IF;

    SELECT * INTO v_event
    FROM public.provider_webhook_events
    WHERE provider_event_id = p_provider_event_id
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'WEBHOOK_EVENT_NOT_FOUND: Event provider tidak ditemukan.'; END IF;
    IF v_event.order_id <> p_order_id THEN RAISE EXCEPTION 'WEBHOOK_ORDER_MISMATCH: Event bukan milik order ini.'; END IF;
    IF NOT v_event.signature_verified THEN RAISE EXCEPTION 'WEBHOOK_SIGNATURE_INVALID: Signature provider belum terverifikasi.'; END IF;
    IF v_event.event_type <> 'INVOICE_PAID' THEN RAISE EXCEPTION 'WEBHOOK_EVENT_TYPE_INVALID: Event % bukan settlement masuk.', v_event.event_type; END IF;

    SELECT escrow.* INTO v_escrow
    FROM public.service_orders AS service_order
    JOIN public.escrow_transactions AS escrow ON escrow.booking_id = service_order.origin_booking_id
    WHERE service_order.order_id = p_order_id
    FOR UPDATE OF escrow;

    IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_ESCROW_NOT_FOUND: Order tidak terhubung ke escrow.'; END IF;
    IF v_escrow.total_amount_idr <> p_amount THEN RAISE EXCEPTION 'SETTLEMENT_AMOUNT_MISMATCH: Nominal event tidak sama dengan escrow.'; END IF;

    IF v_event.processed_status = 'PROCESSED' THEN
        IF v_escrow.status <> 'HELD_IN_ESCROW' THEN RAISE EXCEPTION 'WEBHOOK_REPLAY_STATE_CONFLICT: Event telah diproses tetapi escrow tidak held.'; END IF;
        RETURN TRUE;
    END IF;
    IF v_event.processed_status NOT IN ('PENDING', 'RETRYING') THEN RAISE EXCEPTION 'WEBHOOK_STATE_INVALID: Event berstatus %.', v_event.processed_status; END IF;
    IF v_escrow.status <> 'PENDING_PAYMENT' THEN RAISE EXCEPTION 'ESCROW_STATE_INVALID: Escrow berstatus %, expected PENDING_PAYMENT.', v_escrow.status; END IF;

    UPDATE public.escrow_transactions
    SET status = 'HELD_IN_ESCROW', is_mutex_locked = false, updated_at = clock_timestamp()
    WHERE escrow_id = v_escrow.escrow_id;
    UPDATE public.provider_webhook_events
    SET processed_status = 'PROCESSED', processed_at = clock_timestamp()
    WHERE event_id = v_event.event_id;
    RETURN TRUE;
END;
$$;

ALTER TABLE public.provider_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_webhook_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payout_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_idempotency_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_integrity_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_integrity_anchors FORCE ROW LEVEL SECURITY;

CREATE POLICY rls_provider_webhook_events_client_read
ON public.provider_webhook_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.service_orders AS service_order WHERE service_order.order_id = provider_webhook_events.order_id AND service_order.client_id = auth.uid()));

REVOKE ALL ON TABLE public.provider_webhook_events, public.payout_idempotency_keys, public.document_integrity_anchors FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.provider_webhook_events TO authenticated;
GRANT ALL ON TABLE public.provider_webhook_events, public.payout_idempotency_keys, public.document_integrity_anchors TO service_role;
REVOKE ALL ON FUNCTION public.fn_webhook_settle_escrow_mutex(VARCHAR, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_webhook_settle_escrow_mutex(VARCHAR, UUID, NUMERIC) TO service_role, postgres;

COMMENT ON FUNCTION public.fn_webhook_settle_escrow_mutex(VARCHAR, UUID, NUMERIC) IS
    'Atomic verified-webhook settlement only. External provider I/O is forbidden while this database transaction is open.';
