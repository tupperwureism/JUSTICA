-- ==============================================================================
-- Migration: 20260716000008_fix_anon_security_definer_exec.sql
-- Description: [Batch 2 of 3] Revoke EXECUTE privileges from PUBLIC and anon
--              roles on SECURITY DEFINER and critical domain stored procedures
--              to resolve anon_security_definer_function_executable warnings.
-- Author: Antigravity AI Technical Partner
-- ==============================================================================

-- 1. Revoke from fn_book_consultation_slot_mutex (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id uuid,
    p_client_id uuid,
    p_booking_type character varying,
    p_notes text
) FROM PUBLIC, anon;

-- 2. Revoke from fn_mutate_wallet_balance_mutex (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.fn_mutate_wallet_balance_mutex(
    p_wallet_id uuid,
    p_amount numeric,
    p_mutation_type character varying,
    p_reference_id uuid
) FROM PUBLIC, anon;

-- 3. Revoke from fn_refund_escrow_to_client_mutex (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.fn_refund_escrow_to_client_mutex(
    p_escrow_id uuid,
    p_refund_reason text
) FROM PUBLIC, anon;

-- 4. Revoke from fn_release_escrow_to_advocate_mutex
REVOKE ALL ON FUNCTION public.fn_release_escrow_to_advocate_mutex(
    p_escrow_id uuid
) FROM PUBLIC, anon;

-- 5. Revoke from fn_record_immutable_audit_log
REVOKE ALL ON FUNCTION public.fn_record_immutable_audit_log(
    p_actor_user_id uuid,
    p_actor_type character varying,
    p_action_type character varying,
    p_target_resource character varying,
    p_metadata_json jsonb
) FROM PUBLIC, anon;
