# BATCH 3.C.1 — REPAIR CANONICAL NOTARY ASSIGNMENT AND CDD BOUNDARIES

> **Document Type**: Detailed Batch Blueprint (DBB)
> **Branch**: `batch-3c-notary-workspace`
> **Base Fixed Point (HEAD)**: `1a6c89e00d8d6087542b9bb230d50197f020f23f`
> **Parent Commit**: `e1620733da62b0851ae9d74b27f4a46886e1fb16`
> **Target Scope**: Production-Grade Local Implementation Correction (Canonical Schema, Row-Mutex, Atomic Lifecycle, Zero Browser Table DML)
> **Status**: `READY_FOR_EXTERNAL_REAUDIT`
> **Current Checkpoint**: `CP-07 Complete / CP-08 Ready`
> **Next Exact Action**: Commit and Handoff Report

---

## 1. Finding → Root Cause → Fix → Test Matrix

| No | Finding / Audit Defect | Akar Masalah (Root Cause) | Perbaikan (Fix) | Pengujian Perilaku (Behavioral Test) |
|---|---|---|---|---|
| 1 | `users_admin.is_active` tidak ada di skema kanonik | Asumsi keliru bahwa tabel admin memiliki kolom `is_active` | Hapus seleksi/predikat `is_active`; verifikasi admin menggunakan `admin_id` dan `role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')` | Edge test `list_assignment_context requires compliance or super_admin role` & SQL runtime assertion |
| 2 | `users_advocate.is_verified` tidak ada di skema kanonik | Asumsi keliru kolom boolean; verifikasi advokat kanonik adalah `kyc_status = 'VERIFIED'` | Gunakan `notary_profiles.status = 'VERIFIED_ACTIVE'` dan fungsi kanonik `public.fn_is_verified_advocate(notary_id)` | SQL runtime `fn_is_verified_advocate` check & Edge test `approve_cdd requires verified active notary actor` |
| 3 | `service_orders.escrow_status` dan `funds_locked_at` tidak ada | Held funds dicatat pada agregat `escrow_transactions`, bukan `service_orders` | Validasi dana tertahan melalui `escrow_transactions` (`status = 'HELD_IN_ESCROW'` dan `funds_locked_at IS NOT NULL`) | SQL runtime `escrow missing rejected` & `escrow not held rejected` |
| 4 | Penugasan notaris mengubah stage ke `CDD_REVIEW` | Melewati tahap `IDENTITY_PENDING` yang merupakan milik Batch 3.D / e-KYC | Penugasan notaris HANYA mengubah `assigned_notary_id`; `current_stage` tetap `ESCROW_LOCKED` | SQL runtime assertion `assignment leaves stage ESCROW_LOCKED` & Frontend assertion |
| 5 | Persetujuan CDD tidak menggunakan `fn_transition_corporate_service_case` | Mutasi stage langsung tanpa mekanisme transisi kanonik | Gunakan `public.fn_transition_corporate_service_case(p_case_id, 'CDD_REVIEW', 'DOCUMENTS_PENDING')` dan validasi kepemilikan reviewer | SQL runtime `CDD approval and transition are atomic` |
| 6 | Frontend UI auto-select & kurang konfirmasi | UI otomatis memilih item pertama dan belum mewajibkan konfirmasi eksplisit | Wajibkan pemilihan eksplisit perkara & notaris serta modal/langkah konfirmasi sebelum mutasi | Frontend integration test `AdminNotaryAssignmentPanel requires explicit selection and confirmation` |
| 7 | Success gate UI tidak memverifikasi refresh kanonik | UI langsung menampilkan sukses sebelum data hasil refresh diverifikasi | Tampilkan sukses HANYA jika data hasil refresh membuktikan mutasi kanonik cocok | Frontend integration test `UI success displayed only after canonical refresh confirmation` |

---

## 2. Checkpoint Tracking

- [x] **CP-00: Preflight & Provenance Verification**
  - Verified branch `batch-3c-notary-workspace`, HEAD `1a6c89e`, parent `e162073`, empty index, and preserved user working tree.
- [x] **CP-01: Correction DBB & Failing Tests Setup**
  - Created `MarkDown/Batches/3C_1/PROMPT_MASTER.md`, `MarkDown/Batches/3C_1/BATCH.md`.
  - Marked Batch 3.C as `FAILED_EXTERNAL_AUDIT; SUPERSEDED BY 3.C.1`.
- [x] **CP-02: Database Repair & SQL Runtime Suite**
  - Repaired `supabase/migrations/20260820000001_add_browser_safe_notary_workspace_boundary.sql` in-place with canonical schema.
  - Repaired `Tools/notary_workspace_runtime.sql` to remove fictitious columns and test canonical lifecycle.
- [x] **CP-03: Edge Function Repair & Production Dependency Hardening**
  - Repaired `supabase/functions/notary-workspace/handler.ts` and `index.ts`.
  - Added real `RestError` behavioral error parsing tests in `handler.test.ts` (12/12 pass).
- [x] **CP-04: Frontend Repair (Explicit Selection, Stable Retries, Canonical Refresh Gate)**
  - Repaired `AdminNotaryAssignmentPanel.tsx`, `AdvocateCorporateCaseManager.tsx`, `useNotaryWorkspaceIntegration.ts`, `phase2IntegrationService.ts`, and `phase2SupabaseGateway.ts`.
  - Updated frontend test suites (`notaryWorkspaceIntegration.test.ts`, `phase2IntegrationService.test.ts`).
- [x] **CP-05: Full Verification Gates**
  - Executed `npm run test:phase2` (115/115 pass), `npm run typecheck:phase2-tests` (0 errors), `npx tsc -b` (0 errors), `npm run lint` (0 errors), `npm run build` (success).
- [x] **CP-06: Two-Axis Review (Spec/Correctness & Standards/Security)**
  - Reviewed all audit findings, RLS/ACL boundaries, error handling, and zero direct browser DML.
- [x] **CP-07: Documentation & Symbol Maps**
  - Updated `MarkDown/Batches/3C_1/LEARNING.md`, `MarkDown/CURRENT_STATE.md`, `MarkDown/BATCH_INDEX.md`, `MarkDown/DEMO_GUIDE.md`.
  - Ran `Tools/generate_symbol_map.mjs` and verified with `--check` (58,646 chars).
- [ ] **CP-08: Staging, Single Commit, and Post-Commit Audit**
  - Stage only allowlisted Batch 3.C.1 files.
  - Commit message: `fix(notary): repair canonical assignment and CDD boundaries`.
  - Final status: `READY FOR EXTERNAL RE-AUDIT`.
