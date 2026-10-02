-- ==============================================================================
-- Migration: 20260716000009_fix_authenticated_security_definer_exec.sql
-- Description: [Batch 3 of 3] Revoke EXECUTE privileges from authenticated role
--              on SECURITY DEFINER and internal backend stored procedures and
--              GRANT strictly to service_role to clear all remaining warnings.
-- Author: Antigravity AI Technical Partner
-- ==============================================================================

-- 1. Revoke and isolate fn_book_consultation_slot_mutex (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id uuid,
    p_client_id uuid,
    p_booking_type character varying,
    p_notes text
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id uuid,
    p_client_id uuid,
    p_booking_type character varying,
    p_notes text
) TO service_role, postgres;

-- 2. Revoke and isolate fn_mutate_wallet_balance_mutex (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.fn_mutate_wallet_balance_mutex(
    p_wallet_id uuid,
    p_amount numeric,
    p_mutation_type character varying,
    p_reference_id uuid
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.fn_mutate_wallet_balance_mutex(
    p_wallet_id uuid,
    p_amount numeric,
    p_mutation_type character varying,
    p_reference_id uuid
) TO service_role, postgres;

-- 3. Revoke and isolate fn_refund_escrow_to_client_mutex (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.fn_refund_escrow_to_client_mutex(
    p_escrow_id uuid,
    p_refund_reason text
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.fn_refund_escrow_to_client_mutex(
    p_escrow_id uuid,
    p_refund_reason text
) TO service_role, postgres;

-- 4. Revoke and isolate fn_release_escrow_to_advocate_mutex
REVOKE ALL ON FUNCTION public.fn_release_escrow_to_advocate_mutex(
    p_escrow_id uuid
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.fn_release_escrow_to_advocate_mutex(
    p_escrow_id uuid
) TO service_role, postgres;

-- 5. Revoke and isolate fn_record_immutable_audit_log
REVOKE ALL ON FUNCTION public.fn_record_immutable_audit_log(
    p_actor_user_id uuid,
    p_actor_type character varying,
    p_action_type character varying,
    p_target_resource character varying,
    p_metadata_json jsonb
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.fn_record_immutable_audit_log(
    p_actor_user_id uuid,
    p_actor_type character varying,
    p_action_type character varying,
    p_target_resource character varying,
    p_metadata_json jsonb
) TO service_role, postgres;
