-- =============================================================================
-- DB-2: Canonical PL/pgSQL mutex functions and immutable WORM vault hardening
-- PostgreSQL 15+ / Supabase
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.fn_prevent_worm_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'WORM Vault violation: UPDATE and DELETE operations are strictly prohibited on immutable tables';
END;
$$;

DROP TRIGGER IF EXISTS trg_worm_legal_opinions_vault ON public.legal_opinions;
CREATE TRIGGER trg_worm_legal_opinions_vault
    BEFORE UPDATE OR DELETE ON public.legal_opinions
    FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worm_mutation();
ALTER TABLE public.legal_opinions ENABLE ALWAYS TRIGGER trg_worm_legal_opinions_vault;

DROP TRIGGER IF EXISTS trg_worm_emeterai_stamping_logs ON public.emeterai_stamping_logs;
CREATE TRIGGER trg_worm_emeterai_stamping_logs
    BEFORE UPDATE OR DELETE ON public.emeterai_stamping_logs
    FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worm_mutation();
ALTER TABLE public.emeterai_stamping_logs ENABLE ALWAYS TRIGGER trg_worm_emeterai_stamping_logs;

DROP TRIGGER IF EXISTS trg_worm_audit_logs_vault ON public.audit_logs_worm;
CREATE TRIGGER trg_worm_audit_logs_vault
    BEFORE UPDATE OR DELETE ON public.audit_logs_worm
    FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worm_mutation();
ALTER TABLE public.audit_logs_worm ENABLE ALWAYS TRIGGER trg_worm_audit_logs_vault;

CREATE OR REPLACE FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id UUID,
    p_client_id UUID,
    p_booking_type VARCHAR DEFAULT 'STANDARD',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_advocate_id UUID;
    v_slot_status VARCHAR(32);
    v_price NUMERIC(15,2);
    v_booking_id UUID;
    v_booking_code VARCHAR(32);
BEGIN
    SELECT slot.advocate_id, slot.status, tier.price_idr
    INTO v_advocate_id, v_slot_status, v_price
    FROM public.consultation_slots AS slot
    JOIN public.advocate_service_tiers AS tier ON tier.tier_id = slot.tier_id
    WHERE slot.slot_id = p_slot_id AND tier.is_active = true
    FOR UPDATE OF slot;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Consultation slot % does not exist or its tier is inactive.', p_slot_id;
    END IF;
    IF v_slot_status <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'SLOT_ALREADY_BOOKED: Consultation slot % has status %.', p_slot_id, v_slot_status;
    END IF;

    UPDATE public.consultation_slots
    SET status = 'BOOKED', updated_at = clock_timestamp()
    WHERE slot_id = p_slot_id;

    v_booking_code := 'REQ-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
        upper(substr(replace(extensions.gen_random_uuid()::TEXT, '-', ''), 1, 12));

    INSERT INTO public.booking_sessions (
        client_id, advocate_id, slot_id, booking_code, status,
        case_summary, meeting_method, booked_price_idr, created_at, updated_at
    ) VALUES (
        p_client_id, v_advocate_id, p_slot_id, v_booking_code, 'PENDING_PAYMENT',
        p_notes,
        CASE WHEN upper(coalesce(p_booking_type, 'STANDARD')) = 'OFFLINE' THEN 'OFFLINE' ELSE 'ONLINE' END,
        v_price, clock_timestamp(), clock_timestamp()
    )
    RETURNING booking_id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_mutate_wallet_balance_mutex(
    p_wallet_id UUID,
    p_amount NUMERIC,
    p_mutation_type VARCHAR,
    p_reference_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_current_balance NUMERIC(15,2);
    v_new_balance NUMERIC(15,2);
    v_wallet_user_id UUID;
    v_wallet_user_type VARCHAR(16);
BEGIN
    IF p_amount IS NULL OR nullif(trim(p_mutation_type), '') IS NULL THEN
        RAISE EXCEPTION 'INVALID_WALLET_MUTATION: Amount and mutation type must not be null.';
    END IF;

    SELECT balance_available_idr, user_id, user_type
    INTO v_current_balance, v_wallet_user_id, v_wallet_user_type
    FROM public.wallet_balances
    WHERE wallet_id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: Wallet balance record % does not exist.', p_wallet_id;
    END IF;

    v_new_balance := v_current_balance + p_amount;
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Wallet % has balance %, cannot deduct %.',
            p_wallet_id, v_current_balance, abs(p_amount);
    END IF;

    UPDATE public.wallet_balances
    SET balance_available_idr = v_new_balance, updated_at = clock_timestamp()
    WHERE wallet_id = p_wallet_id;

    PERFORM public.fn_record_immutable_audit_log(
        v_wallet_user_id,
        v_wallet_user_type,
        left('WALLET_MUTATION_' || upper(trim(p_mutation_type)), 64),
        'wallet_balances/' || p_wallet_id::TEXT,
        jsonb_build_object(
            'referenceId', p_reference_id,
            'amount', p_amount,
            'newBalance', v_new_balance
        )
    );

    RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_refund_escrow_to_client_mutex(
    p_escrow_id UUID,
    p_refund_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_status VARCHAR(32);
    v_amount NUMERIC(15,2);
    v_client_id UUID;
    v_client_wallet_id UUID;
BEGIN
    SELECT status, total_amount_idr, client_id
    INTO v_status, v_amount, v_client_id
    FROM public.escrow_transactions
    WHERE escrow_id = p_escrow_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ESCROW_NOT_FOUND: Escrow transaction % does not exist.', p_escrow_id;
    END IF;
    IF v_status NOT IN ('HELD_IN_ESCROW', 'HOLDING_PERIOD_24H', 'FROZEN_DISPUTE') THEN
        RAISE EXCEPTION 'INVALID_ESCROW_STATUS: Cannot refund escrow % with status %.', p_escrow_id, v_status;
    END IF;

    INSERT INTO public.wallet_balances (user_id, user_type, balance_available_idr, balance_held_idr)
    VALUES (v_client_id, 'CLIENT', 0.00, 0.00)
    ON CONFLICT (user_id, user_type) DO NOTHING;

    SELECT wallet_id INTO v_client_wallet_id
    FROM public.wallet_balances
    WHERE user_id = v_client_id AND user_type = 'CLIENT';

    PERFORM public.fn_mutate_wallet_balance_mutex(
        v_client_wallet_id, v_amount, 'REFUND_CLIENT', p_escrow_id
    );

    INSERT INTO public.escrow_payout_ledgers (
        escrow_id, wallet_id, mutation_type, amount_idr, description
    ) VALUES (
        p_escrow_id, v_client_wallet_id, 'REFUND_CLIENT', v_amount,
        'Pengembalian penuh dana Escrow kepada Klien'
    );

    UPDATE public.escrow_transactions
    SET status = 'REFUNDED_TO_CLIENT',
        client_payout_ratio = 100.00,
        advocate_payout_ratio = 0.00,
        is_mutex_locked = false,
        resolution_notes = concat_ws(
            ' ', nullif(resolution_notes, ''),
            '[REFUNDED: ' || coalesce(nullif(p_refund_reason, ''), 'No reason supplied') || ']'
        ),
        updated_at = clock_timestamp()
    WHERE escrow_id = p_escrow_id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_record_immutable_audit_log(
    p_actor_user_id UUID,
    p_actor_type VARCHAR,
    p_action_type VARCHAR,
    p_target_resource VARCHAR,
    p_metadata_json JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_audit_id UUID;
    v_prev_hash VARCHAR(64);
    v_computed_hash VARCHAR(64);
    v_payload TEXT;
BEGIN
    IF p_actor_user_id IS NULL OR p_actor_type IS NULL OR p_action_type IS NULL OR
       p_target_resource IS NULL OR p_metadata_json IS NULL THEN
        RAISE EXCEPTION 'INVALID_AUDIT_EVENT: Immutable audit fields must not be null.';
    END IF;

    LOCK TABLE public.audit_logs_worm IN SHARE ROW EXCLUSIVE MODE;
    SELECT worm_sha256_hash INTO v_prev_hash
    FROM public.audit_logs_worm
    ORDER BY created_at DESC, audit_id DESC
    LIMIT 1;

    v_prev_hash := coalesce(v_prev_hash, repeat('0', 64));
    v_payload := concat_ws(
        '|', p_actor_user_id::TEXT, p_actor_type, p_action_type,
        p_target_resource, p_metadata_json::TEXT, v_prev_hash
    );
    v_computed_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');

    INSERT INTO public.audit_logs_worm (
        actor_user_id, actor_type, action_type, target_resource,
        metadata_json, worm_sha256_hash
    ) VALUES (
        p_actor_user_id, p_actor_type, p_action_type, p_target_resource,
        p_metadata_json, v_computed_hash
    ) RETURNING audit_id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_prevent_worm_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_prevent_worm_mutation() TO postgres;

REVOKE ALL ON FUNCTION public.fn_book_consultation_slot_mutex(UUID, UUID, VARCHAR, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_book_consultation_slot_mutex(UUID, UUID, VARCHAR, TEXT)
    TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_mutate_wallet_balance_mutex(UUID, NUMERIC, VARCHAR, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_mutate_wallet_balance_mutex(UUID, NUMERIC, VARCHAR, UUID)
    TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_refund_escrow_to_client_mutex(UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_refund_escrow_to_client_mutex(UUID, TEXT)
    TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_record_immutable_audit_log(UUID, VARCHAR, VARCHAR, VARCHAR, JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_record_immutable_audit_log(UUID, VARCHAR, VARCHAR, VARCHAR, JSONB)
    TO service_role, postgres;
