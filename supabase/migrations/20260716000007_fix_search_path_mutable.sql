-- ==============================================================================
-- Migration: 20260716000007_fix_search_path_mutable.sql
-- Description: [Batch 1 of 3] Hardening function definitions by setting an
--              explicit search_path = public on all 6 WORM and Mutex functions
--              to resolve Supabase linter function_search_path_mutable warnings.
-- Author: Antigravity AI Technical Partner
-- ==============================================================================

-- 1. fn_prevent_worm_mutation
CREATE OR REPLACE FUNCTION public.fn_prevent_worm_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    RAISE EXCEPTION 'WORM_IMMUTABILITY_VIOLATION: Table % is append-only (WORM). Modification or deletion of records is strictly prohibited by legal & ethical governance.', TG_TABLE_NAME;
END;
$function$;

-- 2. fn_record_immutable_audit_log
CREATE OR REPLACE FUNCTION public.fn_record_immutable_audit_log(
    p_actor_user_id uuid,
    p_actor_type character varying,
    p_action_type character varying,
    p_target_resource character varying,
    p_metadata_json jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
    v_audit_id UUID;
    v_prev_hash VARCHAR(64);
    v_computed_hash VARCHAR(64);
    v_payload TEXT;
BEGIN
    -- Get last SHA-256 hash for Merkle tree chaining
    SELECT worm_sha256_hash INTO v_prev_hash
    FROM audit_logs_worm
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prev_hash IS NULL THEN
        v_prev_hash := 'GENESIS_00000000000000000000000000000000000000000000000000000000';
    END IF;

    v_payload := p_actor_user_id::TEXT || p_actor_type || p_action_type || p_target_resource || p_metadata_json::TEXT || v_prev_hash;
    v_computed_hash := encode(digest(v_payload, 'sha256'), 'hex');

    INSERT INTO audit_logs_worm (
        actor_user_id, actor_type, action_type, target_resource, metadata_json, worm_sha256_hash
    ) VALUES (
        p_actor_user_id, p_actor_type, p_action_type, p_target_resource, p_metadata_json, v_computed_hash
    )
    RETURNING audit_id INTO v_audit_id;

    RETURN v_audit_id;
END;
$function$;

-- 3. fn_release_escrow_to_advocate_mutex
CREATE OR REPLACE FUNCTION public.fn_release_escrow_to_advocate_mutex(p_escrow_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
    v_escrow RECORD;
    v_advocate_wallet_id UUID;
    v_net_payout NUMERIC(15,2);
BEGIN
    -- 1. Mutex Row Lock on escrow_transactions
    SELECT * INTO v_escrow
    FROM escrow_transactions
    WHERE escrow_id = p_escrow_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Escrow Transaction % not found.', p_escrow_id;
    END IF;

    -- 2. State Guard Rule validation
    IF v_escrow.status <> 'HOLDING_PERIOD_24H' THEN
        RAISE EXCEPTION 'Guard Rule Failed: Escrow status is %, expected HOLDING_PERIOD_24H.', v_escrow.status;
    END IF;

    -- 3. Lock or create target advocate wallet balance row
    SELECT wallet_id INTO v_advocate_wallet_id
    FROM wallet_balances
    WHERE user_id = v_escrow.advocate_id AND user_type = 'ADVOCATE'
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO wallet_balances (user_id, user_type, balance_available_idr, balance_held_idr)
        VALUES (v_escrow.advocate_id, 'ADVOCATE', 0.00, 0.00)
        RETURNING wallet_id INTO v_advocate_wallet_id;
    END IF;

    -- 4. Calculate Net Payout (75% to advocate after platform fee)
    v_net_payout := v_escrow.total_amount_idr * 0.75;

    -- 5. Atomic Updates
    UPDATE escrow_transactions
    SET status = 'RELEASED_TO_ADVOCATE',
        is_mutex_locked = false
    WHERE escrow_id = p_escrow_id;

    UPDATE wallet_balances
    SET balance_available_idr = balance_available_idr + v_net_payout,
        updated_at = CURRENT_TIMESTAMP
    WHERE wallet_id = v_advocate_wallet_id;

    INSERT INTO escrow_payout_ledgers (
        escrow_id, wallet_id, mutation_type, amount_idr, description
    ) VALUES (
        p_escrow_id, v_advocate_wallet_id, 'RELEASE_ADVOCATE', v_net_payout,
        'Pencairan dana Escrow 75% setelah melewati masa sanggah 24 jam'
    );

    RETURN TRUE;
END;
$function$;

-- 4. fn_book_consultation_slot_mutex
CREATE OR REPLACE FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id uuid,
    p_client_id uuid,
    p_booking_type character varying DEFAULT 'STANDARD'::character varying,
    p_notes text DEFAULT NULL::text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- 5. fn_mutate_wallet_balance_mutex
CREATE OR REPLACE FUNCTION public.fn_mutate_wallet_balance_mutex(
    p_wallet_id uuid,
    p_amount numeric,
    p_mutation_type character varying,
    p_reference_id uuid DEFAULT NULL::uuid
)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- 6. fn_refund_escrow_to_client_mutex
CREATE OR REPLACE FUNCTION public.fn_refund_escrow_to_client_mutex(
    p_escrow_id uuid,
    p_refund_reason text
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;
