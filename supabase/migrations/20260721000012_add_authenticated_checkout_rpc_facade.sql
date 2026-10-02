CREATE OR REPLACE FUNCTION public.fn_client_checkout_consultation_mutex(
    p_slot_id UUID,
    p_case_summary TEXT,
    p_booking_type VARCHAR DEFAULT 'STANDARD'
)
RETURNS TABLE (
    booking_id UUID,
    booking_code VARCHAR,
    escrow_id UUID,
    slot_id UUID,
    tier_id UUID,
    advocate_id UUID,
    advocate_name VARCHAR,
    amount_idr NUMERIC,
    escrow_status VARCHAR,
    created_at TIMESTAMPTZ,
    mutex_lock_id VARCHAR,
    payment_gateway_ref VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_client_id UUID := auth.uid();
    v_claims JSONB := auth.jwt();
    v_advocate_id UUID;
    v_advocate_name VARCHAR(128);
    v_tier_id UUID;
    v_slot_status VARCHAR(32);
    v_start_time TIMESTAMPTZ;
    v_price NUMERIC(15,2);
    v_wallet_id UUID;
    v_available NUMERIC(15,2);
    v_held NUMERIC(15,2);
    v_booking_id UUID := extensions.gen_random_uuid();
    v_escrow_id UUID := extensions.gen_random_uuid();
    v_booking_code VARCHAR(32);
    v_mutex_lock_id VARCHAR(64);
    v_payment_ref VARCHAR(64);
    v_now TIMESTAMPTZ := clock_timestamp();
    v_nik VARCHAR(16);
BEGIN
    IF v_client_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED: Sesi Klien tidak ditemukan.'; END IF;
    IF coalesce(v_claims -> 'user_metadata' ->> 'role', '') <> 'CLIENT' THEN
        RAISE EXCEPTION 'ROLE_FORBIDDEN: Hanya akun CLIENT yang dapat melakukan checkout.';
    END IF;
    IF nullif(trim(p_case_summary), '') IS NULL THEN
        RAISE EXCEPTION 'CASE_SUMMARY_REQUIRED: Ringkasan perkara wajib diisi.';
    END IF;

    v_nik := nullif(v_claims -> 'user_metadata' ->> 'nik', '');
    IF v_nik IS NOT NULL AND length(v_nik) <> 16 THEN v_nik := NULL; END IF;
    INSERT INTO public.users_client (
        client_id, full_name, email, phone_e164, nik_ktp, kyc_status, password_hash
    ) VALUES (
        v_client_id,
        coalesce(nullif(v_claims -> 'user_metadata' ->> 'full_name', ''), 'Klien Justica'),
        coalesce(nullif(v_claims ->> 'email', ''), v_client_id::TEXT || '@gotrue.local'),
        coalesce(nullif(v_claims -> 'user_metadata' ->> 'phone', ''), '+620000000000'),
        v_nik, 'UNVERIFIED', '!GOTRUE_MANAGED!'
    ) ON CONFLICT (client_id) DO NOTHING;

    SELECT slot.advocate_id, advocate.full_name, slot.tier_id, slot.status,
           slot.start_time, tier.price_idr
    INTO v_advocate_id, v_advocate_name, v_tier_id, v_slot_status, v_start_time, v_price
    FROM public.consultation_slots AS slot
    JOIN public.users_advocate AS advocate ON advocate.advocate_id = slot.advocate_id
    JOIN public.advocate_service_tiers AS tier ON tier.tier_id = slot.tier_id
    WHERE slot.slot_id = p_slot_id AND tier.is_active = true
    FOR UPDATE OF slot;

    IF NOT FOUND THEN RAISE EXCEPTION 'SLOT_NOT_FOUND: Slot tidak ditemukan atau tier tidak aktif.'; END IF;
    IF v_slot_status <> 'AVAILABLE' OR v_start_time <= v_now THEN
        RAISE EXCEPTION 'SLOT_ALREADY_BOOKED: Slot sudah dipesan atau telah kedaluwarsa.';
    END IF;

    IF v_price > 0 THEN
        SELECT wallet.wallet_id, wallet.balance_available_idr, wallet.balance_held_idr
        INTO v_wallet_id, v_available, v_held
        FROM public.wallet_balances AS wallet
        WHERE wallet.user_id = v_client_id AND wallet.user_type = 'CLIENT'
        FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'WALLET_NOT_FOUND: Dompet Klien belum tersedia.'; END IF;
        IF v_available < v_price THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Saldo Klien tidak mencukupi.'; END IF;
        UPDATE public.wallet_balances
        SET balance_available_idr = v_available - v_price,
            balance_held_idr = v_held + v_price, updated_at = v_now
        WHERE wallet_id = v_wallet_id;
    END IF;

    UPDATE public.consultation_slots
    SET status = 'BOOKED', is_mutex_locked = true, updated_at = v_now
    WHERE consultation_slots.slot_id = p_slot_id;

    v_booking_code := 'REQ-' || to_char(v_now, 'YYYYMMDD') || '-' || upper(substr(replace(v_booking_id::TEXT, '-', ''), 1, 12));
    v_mutex_lock_id := 'MUTEX-' || upper(replace(v_escrow_id::TEXT, '-', ''));
    v_payment_ref := 'WALLET-' || upper(substr(replace(extensions.gen_random_uuid()::TEXT, '-', ''), 1, 24));

    INSERT INTO public.booking_sessions (
        booking_id, client_id, advocate_id, slot_id, booking_code, status,
        case_summary, meeting_method, booked_price_idr, created_at, updated_at
    ) VALUES (
        v_booking_id, v_client_id, v_advocate_id, p_slot_id, v_booking_code, 'SCHEDULED',
        trim(p_case_summary), CASE WHEN upper(p_booking_type) = 'OFFLINE' THEN 'OFFLINE' ELSE 'ONLINE' END,
        v_price, v_now, v_now
    );

    INSERT INTO public.escrow_transactions (
        escrow_id, booking_id, client_id, advocate_id, total_amount_idr, status,
        holding_expires_at, payment_gateway_ref, is_mutex_locked, mutex_lock_id, created_at, updated_at
    ) VALUES (
        v_escrow_id, v_booking_id, v_client_id, v_advocate_id, v_price, 'HELD_IN_ESCROW',
        v_now + INTERVAL '24 hours', v_payment_ref, true, v_mutex_lock_id, v_now, v_now
    );

    RETURN QUERY SELECT v_booking_id, v_booking_code, v_escrow_id, p_slot_id, v_tier_id,
        v_advocate_id, v_advocate_name, v_price, 'HELD_IN_ESCROW'::VARCHAR,
        v_now, v_mutex_lock_id, v_payment_ref;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_client_checkout_consultation_mutex(UUID, TEXT, VARCHAR)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_client_checkout_consultation_mutex(UUID, TEXT, VARCHAR)
    TO authenticated;

COMMENT ON FUNCTION public.fn_client_checkout_consultation_mutex(UUID, TEXT, VARCHAR) IS
    'Authenticated client checkout façade: provisions client profile, locks slot and wallet, then creates booking and HELD escrow atomically.';
