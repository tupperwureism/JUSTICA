# BATCH 3.C.3 — LEARNINGS AND SYSTEM PATTERNS

> **Document Type**: Detailed Batch Summary (DBS) / Learning Record
> **Batch**: 3.C.3 — Prove and Harden Atomic Notary Workspace Boundaries
> **Branch**: `batch-3c-notary-workspace`
> **Base Fixed Point**: `63766fea107f2cd3e3af3c56bb7d247dfdec5ea4`
> **Parent Commit**: `3e5e4a705241a82ef9b669892cd4dd2230fc0033`

---

## 1. Root Cause Summary and Structural Fixes

### A. Mandatory Database Proof Physical Execution (P0)
- **Problem**: In previous batches, database proof scripts and migration replays were created but not physically executed against a live database instance.
- **Fix**: Executed clean migration replay against local Supabase/PostgreSQL instance from zero to `20260823142459_harden_notary_workspace_boundaries.sql`. Executed `Tools/notary_workspace_runtime.sql` verifying all 12 assertions with terminal success marker and `ROLLBACK`.

### B. Concurrency Probe Fail-Fast & Real Database Verification (P0)
- **Problem**: Previous probe scripts exited with code 0 on missing env or HTTP errors and only checked HTTP response payloads without database row assertions.
- **Fix**: Rebuilt `Tools/notary_workspace_concurrency_probe.mjs` to fail closed (`process.exit(1)`) on missing config. Tested 5 locked concurrent scenarios using true concurrent dispatch (`Promise.all`), verified HTTP outcomes, and queried database tables (`corporate_service_cases`, `compliance_workflow_events_worm`, `notary_workspace_idempotency_records`) confirming exact row mutations and counts.

### C. SQL Runtime Schema Conformance (P0)
- **Problem**: Previous test fixtures violated table constraints (`service_orders` without `submitted_at` or unaccepted quotes, `escrow_transactions` missing mandatory fields).
- **Fix**: Fixtures updated to use canonical schema types, non-null mandatory fields, unique orders per case, and valid foreign keys.

### D. Official Supabase Type Generation (P0)
- **Problem**: Types were not generated directly by the official CLI against the migrated database.
- **Fix**: Ran `supabase gen types typescript --local` directly from the migrated database to generate `justifiqa-frontend/src/types/database.types.ts`.

### E. Stable Frontend Attempt Identity & Selection Invalidation (P1)
- **Problem**: Frontend hooks only tracked loose attempt keys without binding to full input parameters, leading to potential stale retry mutations.
- **Fix**: Implemented immutable attempt objects `{ caseId, notaryId, idempotencyKey }` and `{ caseId, assessmentId, rulesVersion, idempotencyKey }`. Selection changes invalidate stale attempt state. Attempts are cleared only upon verified canonical refresh.

### F. Comprehensive Behavioral UI Tests (P1)
- **Problem**: UI test suite lacked specific tests for fail-closed refresh gates and retry attempt retention.
- **Fix**: Added 14 behavioral tests in `justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts` covering missing case, mismatched notary, wrong stage, decision rejection, and retry identity preservation. 119/119 tests pass.

### G. SECURITY DEFINER Search Path Hardening (P1)
- **Problem**: Database functions used search path sets that could allow search-path shadowing or relied on broad exception catching.
- **Fix**: Implemented forward migration `20260823142459_harden_notary_workspace_boundaries.sql` with `SET search_path = ''`, full schema qualification (`pg_catalog.*`, `public.*`, `extensions.*`), and specific `invalid_text_representation` exception catching on UUID conversion.

---

## 2. Invariants and Architectural Principles Preserved

1. **Advisory Lock Serialization**: Global transaction-scoped advisory locks on normalized UUID keys serialize concurrent requests before row-level locks.
2. **WORM Immutability**: All compliance workflow events are appended via canonical functions into `compliance_workflow_events_worm` with trigger-enforced immutability.
3. **Least-Privilege Security**: Public, anon, and authenticated roles are revoked from executing privileged RPCs; direct updates to `assigned_notary_id` and `current_stage` on `corporate_service_cases` are forbidden for `service_role`.
4. **Honest Scope Boundary**: External integrations (AHU/OSS/stamping) remain honestly marked as future work.

---

## 3. Post-Commit Verification Checklist

- [x] All 35 migration files replay cleanly in order.
- [x] `Tools/notary_workspace_runtime.sql` passes with clean `ROLLBACK`.
- [x] `Tools/notary_workspace_concurrency_probe.mjs` executes and passes all 5 locked scenarios.
- [x] Concurrency probe fails closed with non-zero exit on missing env.
- [x] `supabase gen types typescript` successfully regenerated `database.types.ts`.
- [x] Frontend test suite: `119/119 pass`.
- [x] TypeScript test suite check: `0 errors`.
- [x] Frontend lint: `0 errors, 0 warnings`.
- [x] Frontend build: `0 errors`.
- [x] Database lint & advisors: `0 new errors/warnings`.
- [x] Clean candidate symbol maps generated and verified (`generate_symbol_map.mjs --check`).
