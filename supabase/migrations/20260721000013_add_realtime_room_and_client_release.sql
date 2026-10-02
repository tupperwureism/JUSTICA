DO $$
BEGIN
    ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN insufficient_privilege THEN NULL;
END $$;

DROP POLICY IF EXISTS "consultation participants receive broadcasts" ON realtime.messages;
CREATE POLICY "consultation participants receive broadcasts"
ON realtime.messages FOR SELECT TO authenticated
USING (
    extension = 'broadcast' AND EXISTS (
        SELECT 1 FROM public.booking_sessions AS booking
        WHERE (SELECT realtime.topic()) = 'consultation:' || booking.booking_id::TEXT || ':messages'
          AND auth.uid() IN (booking.client_id, booking.advocate_id)
          AND booking.status IN ('SCHEDULED', 'ACTIVE')
    )
);

DROP POLICY IF EXISTS "consultation participants send broadcasts" ON realtime.messages;
CREATE POLICY "consultation participants send broadcasts"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
    extension = 'broadcast' AND EXISTS (
        SELECT 1 FROM public.booking_sessions AS booking
        WHERE (SELECT realtime.topic()) = 'consultation:' || booking.booking_id::TEXT || ':messages'
          AND auth.uid() IN (booking.client_id, booking.advocate_id)
          AND booking.status IN ('SCHEDULED', 'ACTIVE')
    )
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-opinions', 'legal-opinions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "participants download legal opinions" ON storage.objects;
CREATE POLICY "participants download legal opinions"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'legal-opinions' AND EXISTS (
        SELECT 1 FROM public.legal_opinions AS opinion
        WHERE opinion.pdf_storage_path = storage.objects.name
          AND auth.uid() IN (opinion.client_id, opinion.advocate_id)
    )
);

CREATE OR REPLACE FUNCTION public.fn_release_escrow_to_advocate_mutex(p_escrow_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_escrow public.escrow_transactions%ROWTYPE;
    v_client_wallet public.wallet_balances%ROWTYPE;
    v_advocate_wallet_id UUID;
    v_net_payout NUMERIC(15,2);
BEGIN
    SELECT * INTO v_escrow FROM public.escrow_transactions
    WHERE escrow_id = p_escrow_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ESCROW_NOT_FOUND: Transaksi Escrow tidak ditemukan.'; END IF;
    IF auth.uid() IS NOT NULL AND (
        auth.uid() <> v_escrow.client_id OR
        coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') <> 'CLIENT'
    ) THEN RAISE EXCEPTION 'ESCROW_RELEASE_FORBIDDEN: Hanya Klien pemilik perkara yang dapat menyetujui release.'; END IF;
    IF v_escrow.status NOT IN ('HELD_IN_ESCROW', 'HOLDING_PERIOD_24H') THEN
        RAISE EXCEPTION 'INVALID_ESCROW_STATUS: Escrow berstatus % tidak dapat dilepaskan.', v_escrow.status;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.legal_opinions
        WHERE booking_id = v_escrow.booking_id AND client_id = v_escrow.client_id
          AND status = 'STAMPED_SIGNED'
    ) THEN RAISE EXCEPTION 'SIGNED_DELIVERABLE_REQUIRED: Dokumen WORM ber-e-Meterai belum tersedia.'; END IF;

    IF v_escrow.total_amount_idr > 0 THEN
        SELECT * INTO v_client_wallet FROM public.wallet_balances
        WHERE user_id = v_escrow.client_id AND user_type = 'CLIENT' FOR UPDATE;
        IF NOT FOUND OR v_client_wallet.balance_held_idr < v_escrow.total_amount_idr THEN
            RAISE EXCEPTION 'HELD_BALANCE_MISMATCH: Saldo tertahan Klien tidak sesuai transaksi Escrow.';
        END IF;
        UPDATE public.wallet_balances
        SET balance_held_idr = balance_held_idr - v_escrow.total_amount_idr,
            updated_at = clock_timestamp()
        WHERE wallet_id = v_client_wallet.wallet_id;
    END IF;

    INSERT INTO public.wallet_balances (user_id, user_type)
    VALUES (v_escrow.advocate_id, 'ADVOCATE') ON CONFLICT (user_id, user_type) DO NOTHING;
    SELECT wallet_id INTO v_advocate_wallet_id FROM public.wallet_balances
    WHERE user_id = v_escrow.advocate_id AND user_type = 'ADVOCATE' FOR UPDATE;
    v_net_payout := v_escrow.total_amount_idr * v_escrow.advocate_payout_ratio / 100.00;
    UPDATE public.wallet_balances
    SET balance_available_idr = balance_available_idr + v_net_payout,
        updated_at = clock_timestamp()
    WHERE wallet_id = v_advocate_wallet_id;
    UPDATE public.escrow_transactions
    SET status = 'RELEASED_TO_ADVOCATE', is_mutex_locked = false, updated_at = clock_timestamp()
    WHERE escrow_id = p_escrow_id;
    UPDATE public.booking_sessions SET status = 'COMPLETED', updated_at = clock_timestamp()
    WHERE booking_id = v_escrow.booking_id;
    INSERT INTO public.escrow_payout_ledgers
        (escrow_id, wallet_id, mutation_type, amount_idr, description)
    VALUES (p_escrow_id, v_advocate_wallet_id, 'RELEASE_ADVOCATE', v_net_payout,
        'Pencairan dana Escrow setelah persetujuan deliverable WORM oleh Klien');
    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_release_escrow_to_advocate_mutex(UUID)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_release_escrow_to_advocate_mutex(UUID)
TO authenticated, service_role, postgres;
