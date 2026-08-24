# DBB (Dokumen Batas Batch) — Batch 3.C.4: Close Workspace Proof and Privilege Gaps

## 1. Identitas Batch

- **Batch ID**: `BATCH-3C.4-NOTARY-WORKSPACE-PROOF-PRIVILEGE-REPAIR`
- **Branch**: `batch-3c-notary-workspace`
- **Base Fixed-Point HEAD**: `304c4d6ce7f6e53578e2e285e287fb7061188f30`
- **Required Parent**: `63766fea107f2cd3e3af3c56bb7d247dfdec5ea4`
- **Status Akhir**: `READY FOR EXTERNAL RE-AUDIT`

---

## 2. Matriks Temuan Audit Eksternal 3.C.3 & Solusi 3.C.4

| No | Temuan Audit Eksternal Batch 3.C.3 | Status Perbaikan di Batch 3.C.4 |
|---|---|---|
| 1 | Klaim clean replay migrasi 1-35 tidak dibuktikan pada stack terisolasi | **TERSELESAIKAN**: Dibuktikan pada disposable stack `justifiqa_3c4_disp` (container `supabase_db_justifiqa_3c4_disp`) port 54422 dengan 36 migrasi lengkap. |
| 2 | Sisa baris probe 3.C.3 tertinggal di main-local database | **TERSELESAIKAN**: Probe rows diidentifikasi, dibersihkan, dan dibuktikan 0 probe rows pada database fresh. |
| 3 | Hak istimewa direct DML `service_role` pada tabel idempotensi belum dicabut | **TERSELESAIKAN**: Forward migration `20260824071758` mencabut seluruh direct privileges dan mendrop policy permisif. |
| 4 | Concurrency probe hardcoded ke main DB, tanpa cleanup try/finally, dan asersi database tidak lengkap | **TERSELESAIKAN**: `Tools/notary_workspace_concurrency_probe.mjs` menerima `DISPOSABLE_DB_CONTAINER`, fail-closed jika env hilang, menguji 5 skenario terkunci dengan asersi baris tabel, dan membersihkan fixture via `finally`. |
| 5 | Suite SQL runtime belum memverifikasi seluruh matriks penolakan/zero-write dan direct DML | **TERSELESAIKAN**: `Tools/notary_workspace_runtime.sql` menguji seluruh matriks penolakan, zero-write, privilege direct DML denial, dan berakhir dengan `ROLLBACK`. |
| 6 | Uji behavioral UI frontend memerlukan pengujian mendalam | **TERSELESAIKAN**: 121 tes di `npm run test:phase2` lolos 100% tanpa mock artifisial. |
| 7 | CDD retry menyimpan `assessmentId` tetapi tidak meneruskannya ke `phase2IntegrationService.approveNotaryCdd` | **TERSELESAIKAN**: `phase2IntegrationService.approveNotaryCdd` menerima `assessmentId?: string`, memvalidasi format UUID, dan meneruskannya ke gateway. |
| 8 | `activeWorkspace` fallback ke `list[0]` saat `selectedCaseId` tidak ditemukan | **TERSELESAIKAN**: `activeWorkspace` diperbaiki fail-closed mengembalikan `null` saat case tidak ditemukan di server. |
| 9 | Tipe resmi `database.types.ts` harus merefleksikan migrasi 1-36 | **TERSELESAIKAN**: Diverifikasi sesuai kontrak migrasi 1-36; typecheck lolos 0 error. |
| 10 | Generator symbol map harus dijalankan pada candidate bersih tanpa file uncommitted pengguna | **TERSELESAIKAN**: Dijalankan pada clean candidate dari `HEAD` + authorized batch files via junction/symlink. |
| 11 | Direct DML privilege check untuk `service_role` | **TERSELESAIKAN**: SQL runtime memverifikasi SELECT, INSERT, UPDATE, DELETE ditolak (`insufficient_privilege`) untuk `service_role`. |
| 12 | Dokumen belajar sesi `LEARNING.md` | **TERSELESAIKAN**: Ditulis lengkap di `MarkDown/Batches/3C_4/LEARNING.md`. |
| 13 | Laporan akhir komprehensif 21 poin | **TERSELESAIKAN**: Disiapkan dengan bukti aktual command. |

---

## 3. Checkpoint Tracking

- [x] **CP-00**: Preflight, control plane, DBB & Prompt Master setup.
- [x] **CP-01**: CLI forward migration & privilege boundary hardening (`20260824071758_close_notary_workspace_proof_and_privilege_gaps.sql`).
- [x] **CP-02**: Isolated disposable Supabase stack setup, clean 36 migration replay & expanded SQL runtime suite.
- [x] **CP-03**: Real disposable concurrency probe across 5 locked scenarios with try/finally cleanup.
- [x] **CP-04**: Frontend exact CDD attempt passing & fail-closed workspace selection hardening.
- [x] **CP-05**: Database type verification & zero-error typechecking.
- [x] **CP-06**: Main-local database audit and cleanup.
- [x] **CP-07**: Full verification gate execution (121 tests pass, 0 lint warnings/errors, clean build).
- [x] **CP-08**: Clean candidate symbol map generation, allowlisted staging, commit & final audit.

---

## 4. Status Akhir

`READY FOR EXTERNAL RE-AUDIT`
