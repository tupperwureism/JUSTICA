> **Document Type**: Detailed Batch Blueprint (DBB)
> **Branch**: `batch-3c-notary-workspace`
> **Base Commit (Fixed Point)**: `e1620733da62b0851ae9d74b27f4a46886e1fb16`
> **Target Scope**: Production-Grade Local Implementation (Notary Workspace, CDD Approval, Admin Assignment)
> **Status**: `FAILED_EXTERNAL_AUDIT; SUPERSEDED BY 3.C.1`
> **Audit Failure Summary**: External audit rejected commit `1a6c89e` due to schema mismatches (`users_admin.is_active`, `users_advocate.is_verified`, `service_orders.escrow_status` do not exist in canonical schema), invalid stage jumping in notary assignment (skipping `IDENTITY_PENDING` which belongs to Batch 3.D), and non-canonical CDD lifecycle transition.

---

## 1. Objective & Scope

### In-Scope Deliverables
1. **Verified Notary Profile Registry (`public.notary_profiles`)**:
   - DDL with lifecycle status (`PENDING`, `VERIFIED_ACTIVE`, `SUSPENDED`, `REVOKED`), admin verification audit trail, and strict RLS.
2. **Atomic Notary Assignment (`public.fn_assign_corporate_notary_atomic`)**:
   - Authorized Compliance Officer / Super Admin assignment of verified notaries to cases with held escrow (`ESCROW_LOCKED`).
   - Row-level mutex locking, idempotency replay, and assignment conflict rejection.
3. **Multi-Case Notary Workspace**:
   - Upgrade frontend service and gateway from `.limit(1)` to loading all assigned cases for the authenticated notary.
4. **Atomic CDD Approval & Lifecycle Transition (`public.fn_approve_notary_cdd_atomic`)**:
   - Server-enforced approval of canonical PEP/sanctions screening and verified BO prerequisites.
   - Atomic transition from `CDD_REVIEW` to `DOCUMENTS_PENDING` with zero partial writes.
5. **Privileged Edge Function (`supabase/functions/notary-workspace/`)**:
   - Protected server boundary with JWT verification, server-derived actor authorization, sanitized errors, and no browser-direct DML.
6. **Frontend Integration (Admin & Notary UI)**:
   - Admin Notary Assignment panel (`justifiqa-frontend/src/components/admin/AdminNotaryAssignmentPanel.tsx`).
   - Notary Multi-Case Workspace selector and Edge Function CDD approval wiring.
   - Single-flight mutation guards, stable idempotency retry, and accessible error/loading states.
7. **Verification & Testing**:
   - Edge handler unit/integration tests (`handler.test.ts`).
   - Frontend service/hook integration tests.
   - PostgreSQL transactional SQL runtime test suite with rollback (`Tools/notary_workspace_runtime.sql`).
   - Control plane documentation and symbol map generation.

### Explicit Out-of-Scope (Non-Goals)
- No live AHU/OSS/SABH/SABU integration.
- No government submission jobs mutation or fake Kemenkumham stamping success.
- No document upload / WORM document anchor completion (modal remains honestly blocked).
- No e-KYC / digital signature / Batch 3.D scope.
- No payout / escrow release execution.
- No modification of Final Report artifacts or historical migrations.

---

## 2. Checkpoint Tracking

- [x] **CP-00: Hard Preflight, Provenance, and Branch Setup**
  - Verified starting HEAD `e1620733da62b0851ae9d74b27f4a46886e1fb16` on `batch-3b-corporate-escrow`.
  - Created and switched to `batch-3c-notary-workspace`.
  - Preserved existing unstaged files in dirty working tree.
- [x] **CP-01: Discovery & Locked Architectural Contracts**
  - Inspected existing schema, RLS policies, and frontend services.
  - Frozen RPC signatures, Edge Function endpoints, and error mappings.
- [x] **CP-02: TDD Red Test Suite Creation**
  - Created Edge Function test suite: `supabase/functions/notary-workspace/handler.test.ts`.
  - Created Frontend integration test suite: `justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts`.
- [x] **CP-03: PostgreSQL Migration, Atomic RPCs, and SQL Runtime Suite**
  - Implemented migration `supabase/migrations/20260820000001_add_browser_safe_notary_workspace_boundary.sql`.
  - Implemented runtime test suite `Tools/notary_workspace_runtime.sql`.
- [x] **CP-04: Edge Function Implementation & Boundary Hardening**
  - Implemented `supabase/functions/notary-workspace/handler.ts` and `index.ts`.
  - Configured `supabase/config.toml` (`verify_jwt = true`).
  - Verified Edge handler tests pass (12/12 Green).
- [x] **CP-05: Frontend Wiring & UI Components**
  - Implemented `AdminNotaryAssignmentPanel.tsx` and wired into Admin Dashboard.
  - Updated `phase2IntegrationService.ts`, `phase2SupabaseGateway.ts`, and `useNotaryWorkspaceIntegration.ts`.
  - Updated `AdvocateCorporateCaseManager.tsx` for multi-case selection.
- [x] **CP-06: Full Test Suite & Behavioral Verification**
  - Executed `npm run test:phase2` (115/115 pass), `npm run typecheck:phase2-tests` (0 errors), `npx tsc -b` (0 errors), `npm run lint` (0 errors), `npm run build` (success).
- [x] **CP-07: Symbol Map Generation & Documentation Package**
  - Ran `Tools/generate_symbol_map.mjs` and verified (`--check` clean).
  - Completed `MarkDown/Batches/3C/LEARNING.md`, `MarkDown/CURRENT_STATE.md`, `MarkDown/BATCH_INDEX.md`, and `MarkDown/DEMO_GUIDE.md`.
- [ ] **CP-08: Staging, Commit, and Post-Commit Verification**
  - Stage only authorized Batch 3.C files.
  - Commit message: `feat(notary): wire browser-safe assignment and approval workspace`.
  - Handoff report with status `READY FOR EXTERNAL RE-AUDIT`.

---

## 3. Locked Interface & RPC Contracts

### 3.1 Database Objects
1. `public.notary_profiles`:
   - `notary_id UUID PRIMARY KEY REFERENCES public.users_advocate(advocate_id)`
   - `license_number VARCHAR(128) NOT NULL`
   - `jurisdiction_city VARCHAR(128) NOT NULL`
   - `jurisdiction_province VARCHAR(128) NOT NULL`
   - `status VARCHAR(24) NOT NULL DEFAULT 'PENDING'` (`PENDING`, `VERIFIED_ACTIVE`, `SUSPENDED`, `REVOKED`)
   - `verified_by_admin_id UUID REFERENCES public.users_admin(admin_id)`
   - `verified_at TIMESTAMPTZ`
2. `public.notary_workspace_idempotency_records`:
   - `idempotency_key VARCHAR(128) PRIMARY KEY`
   - `operation_type VARCHAR(32) NOT NULL`
   - `case_id UUID NOT NULL`
   - `actor_id UUID NOT NULL`
   - `payload_digest CHAR(64) NOT NULL`
   - `result_payload JSONB NOT NULL`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()`
3. `public.fn_assign_corporate_notary_atomic(p_case_id UUID, p_notary_id UUID, p_admin_id UUID, p_idempotency_key VARCHAR)`
4. `public.fn_approve_notary_cdd_atomic(p_case_id UUID, p_assessment_id UUID, p_notary_id UUID, p_rules_version VARCHAR, p_idempotency_key VARCHAR)`

### 3.2 Edge Function Operations (`notary-workspace`)
- `POST /notary-workspace` with `action`:
  - `list_assignment_context`: Administrator only (returns eligible cases & verified notaries).
  - `assign_notary`: Administrator only (`caseId`, `notaryId`, `idempotencyKey`).
  - `approve_cdd`: Assigned Notary only (`caseId`, `assessmentId`, `rulesVersion`, `idempotencyKey`).

---

*Current Checkpoint: CP-01 complete. Moving to CP-02.*
