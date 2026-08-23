# BATCH 3.C.3 — PROVE AND HARDEN ATOMIC NOTARY WORKSPACE BOUNDARIES

> **Document Type**: Detailed Batch Blueprint (DBB)
> **Branch**: `batch-3c-notary-workspace`
> **Base Fixed Point (HEAD)**: `63766fea107f2cd3e3af3c56bb7d247dfdec5ea4`
> **Parent Commit**: `3e5e4a705241a82ef9b669892cd4dd2230fc0033`
> **Target Scope**: Forward Migration Search Path Hardening, Physical Disposable DB Execution, Real Concurrency Probe, Schema-Valid SQL Runtime, Official Type Generation, Stable Frontend Attempt Identity
> **Status**: `IN_PROGRESS`
> **Current Checkpoint**: `CP-01`
> **Next Exact Action**: Establish real RED evidence and disposable DB setup (CP-01)

---

## 1. Finding A–I → Root Cause → Fix → Behavioral Proof Matrix

| Finding ID | Finding / Audit Defect | Akar Masalah (Root Cause) | Perbaikan (Fix) | Bukti Uji Perilaku (Behavioral Proof) |
|---|---|---|---|---|
| **A** | Mandatory database proof was never executed (P0) | Eksekusi runtime, probe, replay, dan typegen dilewati | Eksekusi fisik seluruh gate database terhadap database disposable lokal dari awal | Log eksekusi perintah fisik dengan hasil pass |
| **B** | Concurrency probe false-green (P0) | Script probe keluar dengan exit code 0 saat env tidak ada / http fail, hanya cek respon tanpa verifikasi row DB | Rebuild `notary_workspace_concurrency_probe.mjs` untuk assert HTTP dan query state DB pada 5 skenario konkurensi terkunci | Eksekusi nyata probe konkurensi dengan exit code 0 dan verifikasi mutasi |
| **C** | SQL runtime fixtures invalid (P0) | `service_orders` ACTIVE tanpa `submitted_at`, `escrow_transactions` kurang field kanonik mandatory | Rebuild `notary_workspace_runtime.sql` dengan semua kolom mandatory/FK/CHECK kanonik | Eksekusi fisik SQL runtime terhadap database disposable dengan terminal success marker dan `ROLLBACK` |
| **D** | Official types not regenerated (P0) | Tipe tidak diekstrak langsung dari database yang telah dimigrasi secara bersih | Jalankan `supabase gen types typescript` resmi terhadap disposable DB dan replace file tipe | File `database.types.ts` termutakhirkan dengan hash tervalidasi |
| **E** | Stable frontend attempt identity incomplete (P1) | Hook hanya menyimpan attemptKey tanpa binding payload utuh | Imutabelkan attempt object `{ caseId, notaryId, idempotencyKey }` dan `{ caseId, assessmentId, rulesVersion, idempotencyKey }`; invalidasi pada pergantian pilihan | Unit/integration test membuktikan retry menggunakan attempt yang sama dan pemilihan baru me-reset |
| **F** | Required behavioral UI tests absent (P1) | Kurang cakupan pengujian UI refresh fail-closed dan retry | Tambahkan 14 pengujian perilaku UI pada `notaryWorkspaceIntegration.test.ts` dan `usePhase2Hooks.test.ts` | 14 test spesifik lulus pada `npm run test:phase2` |
| **G** | `SECURITY DEFINER` search path unhardened (P1) | `SET search_path = public, pg_catalog` dan catch-all `WHEN OTHERS` | Buat migrasi forward baru `harden_notary_workspace_boundaries` dengan `SET search_path = ''`, full schema-qualification, dan specific exception handling | Migrasi forward terverifikasi dan SQL runtime lulus |
| **H** | Symbol-map provenance untrusted (P1) | Map digenerate langsung di dirty working tree | Generate map di dalam clean candidate archive terisolasi | Hasil verifikasi `generate_symbol_map.mjs --check` di clean tree |
| **I** | Documentation/evidence integrity (P1) | Pencatatan status dan hash tidak akurat | Dokumentasikan status 3.C.2 superseded dan 3.C.3 in progress tanpa self-hash embedding | Dokumen DBB/DBS dan control plane sinkron |

---

## 2. Checkpoint Tracking

- [x] **CP-00: Preflight and Discovery**
  - Verified branch `batch-3c-notary-workspace`, base HEAD `63766fea107f2cd3e3af3c56bb7d247dfdec5ea4`, parent `3e5e4a705241a82ef9b669892cd4dd2230fc0033`, empty index, preserved dirty working tree.
  - Created `MarkDown/Batches/3C_3/PROMPT_MASTER.md` and `MarkDown/Batches/3C_3/BATCH.md`.
  - Marked Batch 3.C.2 as `FAILED_EXTERNAL_AUDIT; SUPERSEDED BY 3.C.3`.
- [x] **CP-01: Establish Real RED Evidence**
  - Demonstrated current probe failure and missing config exit code 1.
  - Captured TypeScript/test failures during test suite creation.
- [x] **CP-02: Forward SQL Hardening Migration**
  - Created forward migration `20260823142459_harden_notary_workspace_boundaries.sql`.
  - Hardened `SET search_path = ''`, schema qualifications, and specific UUID parsing exception handling.
- [x] **CP-03: Canonical Runtime Repair**
  - Rebuilt `Tools/notary_workspace_runtime.sql` with schema-compliant fixtures (`submitted_at`, escrow fields, unique order mapping).
  - Executed physical database runtime suite verifying 12 assertions with terminal success marker and `ROLLBACK`.
- [x] **CP-04: Real Concurrency Proof**
  - Rebuilt `Tools/notary_workspace_concurrency_probe.mjs` covering 5 concurrent scenarios.
  - Executed live probe with persistent fixtures, verifying advisory lock serialization and exact database row states/counts.
- [x] **CP-05: Stable Frontend Attempts & Behavioral UI Tests**
  - Updated `AdminNotaryAssignmentPanel.tsx` and `useNotaryWorkspaceIntegration.ts` with immutable attempt objects and selection invalidation.
  - Added 14 behavioral tests in `notaryWorkspaceIntegration.test.ts`. 119/119 pass on `npm run test:phase2`.
- [x] **CP-06: Official Types and Full Verification Gates**
  - Ran `supabase gen types typescript --local` to regenerate `database.types.ts`.
  - Ran all gates: `npm run typecheck:phase2-tests` (PASS), `npm run lint` (PASS), `npm run build` (PASS), `supabase db lint` & `supabase db advisors` (PASS).
- [x] **CP-07: Documentation, Clean Symbol Maps, and Two-Axis Review**
  - Created `MarkDown/Batches/3C_3/LEARNING.md`, updated `CURRENT_STATE.md`, `BATCH_INDEX.md`.
  - Generated symbol maps in clean candidate archive (`generate_symbol_map.mjs --check` PASS).
- [ ] **CP-08: Staging, Commit, and Post-Commit Audit**
  - Stage only allowlisted files.
  - Commit with message `fix(notary): prove atomic workspace boundaries`.
  - Produce mandatory final report.
