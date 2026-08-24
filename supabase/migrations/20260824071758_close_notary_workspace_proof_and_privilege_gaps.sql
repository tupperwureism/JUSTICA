-- ============================================================================
-- Migration: Close Notary Workspace Proof and Privilege Gaps
-- Batch 3.C.4 Forward Migration (CLI Generated: 20260824071758)
-- ============================================================================

-- 1. Revoke ALL direct table privileges on notary_workspace_idempotency_records
-- Direct DML from service_role, authenticated, anon, or PUBLIC is strictly prohibited.
-- All idempotency reads/writes MUST happen strictly through SECURITY DEFINER RPCs.
REVOKE ALL ON TABLE public.notary_workspace_idempotency_records FROM PUBLIC, anon, authenticated, service_role;

-- 2. Ensure Row Level Security and FORCE RLS on idempotency records
ALTER TABLE public.notary_workspace_idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_workspace_idempotency_records FORCE ROW LEVEL SECURITY;

-- Drop all permissive direct policies on idempotency records
DROP POLICY IF EXISTS p_notary_idempotency_service_role ON public.notary_workspace_idempotency_records;
DROP POLICY IF EXISTS p_notary_workspace_idempotency_records_service_role ON public.notary_workspace_idempotency_records;
DROP POLICY IF EXISTS p_notary_workspace_idempotency_records_all ON public.notary_workspace_idempotency_records;

-- 3. Confirm WORM table protection: service_role has NO direct INSERT/UPDATE/DELETE on WORM events
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.compliance_workflow_events_worm FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE public.compliance_workflow_events_worm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_workflow_events_worm FORCE ROW LEVEL SECURITY;

-- 4. Re-enforce Column-Level Update Security on corporate_service_cases
-- service_role MUST NOT directly update assigned_notary_id or current_stage.
REVOKE UPDATE ON TABLE public.corporate_service_cases FROM PUBLIC, anon, authenticated, service_role;
GRANT UPDATE (
    order_id,
    entity_type,
    proposed_name,
    domicile_city,
    domicile_province,
    kbli_snapshot,
    authorized_capital_idr,
    paid_up_capital_idr,
    target_sla_at,
    legal_scope_version,
    assigned_compliance_reviewer_id,
    updated_at
) ON public.corporate_service_cases TO service_role;

-- 5. Privileged RPC Execution Grants: only service_role (and database owner) may execute
REVOKE EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_assign_corporate_notary_atomic(UUID, UUID, UUID, VARCHAR) TO service_role;

REVOKE EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_approve_notary_cdd_atomic(UUID, UUID, UUID, VARCHAR, VARCHAR) TO service_role;
