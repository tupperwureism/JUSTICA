# BATCH 3.C.2 — CLOSE NOTARY WORKSPACE RUNTIME, IDEMPOTENCY, ACL, AND CANONICAL REFRESH Gaps

> **Document Type**: Detailed Batch Blueprint (DBB)
> **Branch**: `batch-3c-notary-workspace`
> **Base Fixed Point (HEAD)**: `3e5e4a705241a82ef9b669892cd4dd2230fc0033`
> **Parent Commit**: `1a6c89e00d8d6087542b9bb230d50197f020f23f`
> **Target Scope**: Forward Migration, Canonical WORM Events, Advisory-Lock Mutex, ACL Tightening, Valid SQL Runtime & Concurrency Probe, Fail-Closed Canonical Refresh Gate
> **Status**: `READY_FOR_EXTERNAL_REAUDIT`
> **Current Checkpoint**: `CP-06 Complete / CP-07 Ready`
> **Next Exact Action**: Staging, Commit, and Final Report

---

## 1. Finding A–K → Root Cause → Fix → Behavioral Test Matrix

| Finding ID | Finding / Audit Defect | Akar Masalah (Root Cause) | Perbaikan (Fix) | Pengujian Perilaku (Behavioral Test) |
|---|---|---|---|---|
| **A** | Nonexistent audit table `public.audit_events` (P0) | RPC menulis ke `public.audit_events` yang tidak ada dalam skema repository | Ganti dengan primitive kanonik `public.fn_append_compliance_workflow_event` yang menulis ke `compliance_workflow_events_worm` | SQL runtime Assertion 3 (Assignment) & Assertion 8 (CDD) membuktikan penulisan event WORM tanpa runtime error |
| **B** | Invalid in-place migration editing | Mengedit migrasi committed `20260820000001` secara in-place | Buat forward migration baru `supabase/migrations/20260820000100_close_notary_workspace_atomicity_gaps.sql` | Migration applied in forward sequence without modifying historical migration |
| **C** | Missing idempotency serialization on new key | `SELECT ... FOR UPDATE` tidak mengunci baris yang belum ada | Tambahkan advisory lock transaksi global: `pg_advisory_xact_lock(hashtextextended('NOTARY_WORKSPACE:' \|\| v_normalized_key, 0))` | Concurrency probe `notary_workspace_concurrency_probe.mjs` membuktikan serialisasi advisory lock |
| **D** | New key must not mimic replay | Kasus yang sudah ditugaskan/disetujui dapat menerima key baru jika tidak dicek secara ketat | Kunci baru terhadap kasus yang sudah di-assign / CDD yang sudah diputuskan ditolak (`ASSIGNMENT_CONFLICT` / `CDD_ALREADY_DECIDED`) | SQL runtime Assertion 5 & Assertion 10 |
| **E** | Direct `service_role` assignment bypass | Hak `UPDATE (assigned_notary_id)` diberikan ke `service_role` pada migrasi lama | Revoke update dan regrant hanya kolom non-state; `assigned_notary_id` hanya dapat dimutasi melalui RPC `fn_assign_corporate_notary_atomic` | SQL runtime ACL assertions |
| **F** | SQL runtime fixtures & non-null fields invalid | Fixture runtime menggunakan string invalid (`PENDING_SUBMISSION`, `CORPORATE_INTAKE`) dan kolom non-null kurang | Perbaiki fixture `users_client`, `users_advocate`, `service_orders` agar memenuhi seluruh CHECK constraint dan NOT NULL kanonik | SQL runtime suite with clean `ROLLBACK` |
| **G** | Manual generated-type edit | File `database.types.ts` diedit secara manual | Sinkronkan tipe database melalui validasi tipe otomatis | `npm run typecheck:phase2-tests` & `npx tsc -b` (0 errors) |
| **H** | Admin canonical refresh fails open | Admin UI menerima response RPC lama jika case tidak ditemukan saat refresh | Validasi refresh wajib menemukan case yang sesuai dan membuktikan `assignedNotaryId` cocok dan `currentStage === 'ESCROW_LOCKED'`; jika tidak, fail-closed dan retain attempt key | Frontend test suite `AdminNotaryAssignmentPanel` |
| **I** | CDD refresh fails open and loses retry identity | Attempt key dihapus sebelum refresh dan missing case dianggap sukses | Pertahankan attempt key sampai refresh terbukti sukses (`currentStage === 'DOCUMENTS_PENDING'` dan `reviewer_decision === 'APPROVED'`); jika gagal, retain key untuk retry | Frontend test suite `useNotaryWorkspaceIntegration` |
| **J** | Browser manufactures replay | Frontend service mengembalikan `replayed: true` jika status lokal sudah `APPROVED` | Hapus shortcut replay di browser; setiap mutasi wajib memanggil RPC server yang memvalidasi binding idempotensi fisik | Frontend test `approveNotaryCdd always calls gateway and never synthesizes local replay` |
| **K** | Report provenance accuracy | Pencatatan hash dan klaim runtime tidak akurat | Catat bukti eksekusi perintah fisik yang sebenarnya dan hindari klaim tanpa log eksekusi | Actual git commit, log, and test outputs |

---

## 2. Checkpoint Tracking

- [x] **CP-00: Preflight & Physical Audit**
  - Verified branch `batch-3c-notary-workspace`, base HEAD `3e5e4a705241a82ef9b669892cd4dd2230fc0033`, parent `1a6c89e`, empty index, preserved dirty working tree.
- [x] **CP-01: DBB & PROMPT Master Record**
  - Created `MarkDown/Batches/3C_2/PROMPT_MASTER.md` and `MarkDown/Batches/3C_2/BATCH.md`.
  - Marked Batch 3.C.1 as `FAILED_EXTERNAL_AUDIT; SUPERSEDED BY 3.C.2`.
- [x] **CP-02: Forward Migration & Valid SQL Runtime**
  - Created `supabase/migrations/20260820000100_close_notary_workspace_atomicity_gaps.sql`.
  - Rebuilt `Tools/notary_workspace_runtime.sql` with canonical fixtures, advisory locks, and WORM events.
- [x] **CP-03: Real Concurrency Probe & Verification**
  - Created `Tools/notary_workspace_concurrency_probe.mjs`.
- [x] **CP-04: Edge & Frontend Stable-Attempt / Refresh Corrections**
  - Updated `AdminNotaryAssignmentPanel.tsx`, `useNotaryWorkspaceIntegration.ts`, and `phase2IntegrationService.ts` for fail-closed refresh and zero synthetic replay.
- [x] **CP-05: Full Verification Gates**
  - Executed Edge handler tests (12/12 pass), Frontend Phase 2 tests (116/116 pass), typechecks (0 errors), linter (0 errors), build (success).
- [x] **CP-06: Two-Axis Review (Spec/Correctness & Standards/Security)**
  - Reviewed all findings A–K, RLS/ACL, error handling, advisory locks.
- [ ] **CP-07: Documentation, Maps, Staging, Commit, Post-Commit Audit**
  - Updated `MarkDown/Batches/3C_2/LEARNING.md`, `CURRENT_STATE.md`, `BATCH_INDEX.md`.
  - Regenerated symbol maps (`58642 chars`).
  - Stage only allowlisted files, commit with exact message: `fix(notary): close runtime and idempotency gaps`.
  - Final status: `READY FOR EXTERNAL RE-AUDIT`.
