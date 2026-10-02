-- ==============================================================================
-- Migration: 20260716000006_domain_hardening_worm_and_acid_mutex.sql
-- Description: Hardening WORM immutability triggers on sensitive logs and
--              implementing ACID concurrency mutex stored procedures for
--              financial and consultation scheduling operations.
-- Author: Antigravity AI Technical Partner
-- ==============================================================================

-- ==============================================================================
-- 1. WORM IMMUTABILITY HARDENING (RULE 3 - ANTI-TAMPER VAULTS)
-- ==============================================================================
-- Ensure fn_prevent_worm_mutation exists (safe check)
CREATE OR REPLACE FUNCTION public.fn_prevent_worm_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'WORM_IMMUTABILITY_VIOLATION: Table % is append-only (WORM). Modification or deletion of records is strictly prohibited by legal & ethical governance.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- 1.1 Advocate Sanctions Log WORM Trigger
DROP TRIGGER IF EXISTS trg_worm_advocate_sanctions_vault ON public.advocate_sanctions_log;
CREATE TRIGGER trg_worm_advocate_sanctions_vault
BEFORE UPDATE OR DELETE ON public.advocate_sanctions_log
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_worm_mutation();

-- 1.2 Dispute Mediator Signatures WORM Trigger
DROP TRIGGER IF EXISTS trg_worm_dispute_signatures_vault ON public.dispute_mediator_signatures;
CREATE TRIGGER trg_worm_dispute_signatures_vault
BEFORE UPDATE OR DELETE ON public.dispute_mediator_signatures
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_worm_mutation();

-- 1.3 Escrow Payout Ledgers WORM Trigger
DROP TRIGGER IF EXISTS trg_worm_escrow_payout_ledgers_vault ON public.escrow_payout_ledgers;
CREATE TRIGGER trg_worm_escrow_payout_ledgers_vault
BEFORE UPDATE OR DELETE ON public.escrow_payout_ledgers
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_worm_mutation();


-- ==============================================================================
-- 2. ACID CONCURRENCY MUTEX STORED PROCEDURES (RULE 3 - FOR UPDATE)
-- ==============================================================================

-- 2.1 Consultation Slot Double-Booking Prevention Mutex
-- Locks the consultation slot row FOR UPDATE and creates a booking session atomically
CREATE OR REPLACE FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id UUID,
    p_client_id UUID,
    p_booking_type VARCHAR(50) DEFAULT 'STANDARD',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_advocate_id UUID;
    v_is_booked BOOLEAN;
    v_price NUMERIC(15,2);
    v_booking_id UUID;
BEGIN
    -- 1. Acquire row-level mutex lock on the slot to prevent race conditions
    SELECT advocate_id, is_booked, price_idr
    INTO v_advocate_id, v_is_booked, v_price
    FROM public.consultation_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Consultation slot % does not exist.', p_slot_id;
    END IF;

    -- 2. Verify availability
    IF v_is_booked = TRUE THEN
        RAISE EXCEPTION 'SLOT_ALREADY_BOOKED: Consultation slot % is currently reserved or booked.', p_slot_id;
    END IF;

    -- 3. Mark slot as booked
    UPDATE public.consultation_slots
    SET is_booked = TRUE,
        updated_at = clock_timestamp()
    WHERE id = p_slot_id;

    -- 4. Create booking session record
    INSERT INTO public.booking_sessions (
        slot_id,
        client_id,
        advocate_id,
        status,
        booked_price_idr,
        client_notes,
        created_at,
        updated_at
    ) VALUES (
        p_slot_id,
        p_client_id,
        v_advocate_id,
        'PENDING_PAYMENT',
        v_price,
        p_notes,
        clock_timestamp(),
        clock_timestamp()
    )
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$;


-- 2.2 Wallet Balance Mutation Race Condition Prevention Mutex
-- Safely mutates wallet balance with explicit row lock and prevents overdrafts
CREATE OR REPLACE FUNCTION public.fn_mutate_wallet_balance_mutex(
    p_wallet_id UUID,
    p_amount NUMERIC(15,2),
    p_mutation_type VARCHAR(50),
    p_reference_id UUID DEFAULT NULL
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance NUMERIC(15,2);
    v_new_balance NUMERIC(15,2);
BEGIN
    -- 1. Acquire row-level mutex lock on wallet
    SELECT balance INTO v_current_balance
    FROM public.wallet_balances
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: Wallet balance record % does not exist.', p_wallet_id;
    END IF;

    -- 2. Calculate new balance
    v_new_balance := v_current_balance + p_amount;

    -- 3. Prevent negative balance on deductions (if amount is negative)
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Wallet % has balance %, cannot deduct %.', p_wallet_id, v_current_balance, abs(p_amount);
    END IF;

    -- 4. Apply mutation atomically
    UPDATE public.wallet_balances
    SET balance = v_new_balance,
        updated_at = clock_timestamp()
    WHERE id = p_wallet_id;

    RETURN v_new_balance;
END;
$$;


-- 2.3 Escrow Refund to Client Mutex
-- Safely refunds funds from escrow back to client with row-level locking
CREATE OR REPLACE FUNCTION public.fn_refund_escrow_to_client_mutex(
    p_escrow_id UUID,
    p_refund_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status VARCHAR(50);
    v_amount NUMERIC(15,2);
    v_client_id UUID;
    v_client_wallet_id UUID;
BEGIN
    -- 1. Acquire row-level mutex lock on escrow transaction
    SELECT status, amount_idr, client_id INTO v_status, v_amount, v_client_id
    FROM public.escrow_transactions
    WHERE id = p_escrow_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ESCROW_NOT_FOUND: Escrow transaction % does not exist.', p_escrow_id;
    END IF;

    -- 2. Verify status
    IF v_status <> 'HELD' AND v_status <> 'DISPUTED' THEN
        RAISE EXCEPTION 'INVALID_ESCROW_STATUS: Cannot refund escrow % with status %.', p_escrow_id, v_status;
    END IF;

    -- 3. Find client wallet
    SELECT id INTO v_client_wallet_id
    FROM public.wallet_balances
    WHERE user_id = p_client_id
    LIMIT 1;

    IF FOUND THEN
        -- Safely credit client wallet using mutex mutation
        PERFORM public.fn_mutate_wallet_balance_mutex(
            v_client_wallet_id,
            v_amount,
            'ESCROW_REFUND',
            p_escrow_id
        );
    END IF;

    -- 4. Update escrow record to REFUNDED
    UPDATE public.escrow_transactions
    SET status = 'REFUNDED',
        resolution_notes = coalesce(resolution_notes, '') || ' [REFUNDED: ' || p_refund_reason || ']',
        updated_at = clock_timestamp()
    WHERE id = p_escrow_id;

    RETURN TRUE;
END;
$$;
