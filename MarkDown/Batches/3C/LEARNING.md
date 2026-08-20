# LEARNING & ARCHITECTURAL DECISIONS — BATCH 3.C

## 1. Konteks & Ringkasan Eksekutif

Batch 3.C menyelesaikan arsitektur **Browser-Safe Notary Assignment and CDD Approval Workspace** untuk platform Justica, menghubungkan penyelesaian dana escrow korporasi (Batch 3.B) dengan alur kerja profesional notaris dan kepatuhan hukum Indonesia.

Pekerjaan ini mencakup:
1. **Model Kualifikasi Notaris Terverifikasi (`public.notary_profiles`)**: Membedakan advokat umum (`users_advocate`) dari notaris berlisensi aktif yang telah diverifikasi oleh Admin Kepatuhan (`COMPLIANCE_OFFICER` / `SUPER_ADMIN`).
2. **RPC Penugasan Notaris Atomik (`public.fn_assign_corporate_notary_atomic`)**: Mengunci baris perkara dan pesanan secara eksklusif (`FOR UPDATE`), memverifikasi status dana escrow `HELD_IN_ESCROW` + `ESCROW_LOCKED`, menugaskan notaris aktif, mencatat log audit, dan mengubah tahap perkara menjadi `CDD_REVIEW` dalam 1 transaksi PostgreSQL.
3. **RPC Persetujuan CDD Atomik (`public.fn_approve_notary_cdd_atomic`)**: Mengunci baris penilaian kepatuhan, memverifikasi bahwa seluruh Pemilik Manfaat (Beneficial Owners) telah berstatus `VERIFIED` dan screening PEP / sanksi berstatus `NO_MATCH` / `NOT_APPLICABLE`, lalu mengubah keputusan menjadi `APPROVED` dan tahap perkara menjadi `DOCUMENTS_PENDING` dalam 1 transaksi.
4. **Edge Function Boundary (`supabase/functions/notary-workspace/`)**: Menyediakan gerbang terotorisasi untuk operasi `list_assignment_context`, `assign_notary`, dan `approve_cdd` dengan sanitasi error tanpa membocorkan rincian SQL/PII.
5. **Pencabutan Direct Browser DML**: Menghapus seluruh izin direct `INSERT`/`UPDATE` dari role `authenticated` browser pada tabel `compliance_assessments` dan kolom penugasan perkara; seluruh mutasi wajib melalui backend/Edge Function.
6. **Multi-Case Notary Workspace**: Mengganti batasan `.limit(1)` pada frontend sehingga notaris dapat mengelola beberapa perkara sekaligus.
7. **Panel Penugasan Admin (`AdminNotaryAssignmentPanel.tsx`)**: Antarmuka bagi Admin Kepatuhan untuk menugaskan notaris ke perkara yang layak escrow dengan proteksi idempotensi single-flight.

---

## 2. Keputusan Arsitektur Utama

### A. Pemisahan Advokat vs Notaris Terverifikasi
- **Masalah**: Pada batch sebelumnya, semua pengguna dengan role `ADVOCATE` dianggap dapat menyetujui CDD perkara korporasi tanpa bukti lisensi notaris yang sah.
- **Solusi**: Dibuat tabel `public.notary_profiles` dengan relasi 1:1 ke `public.users_advocate`. Notaris harus memiliki SK lisensi, wilayah kerja, dan status `VERIFIED_ACTIVE` yang diverifikasi secara eksplisit oleh `users_admin` (`verified_by_admin_id IS NOT NULL`).

### B. Transaksionalitas Mutasi dan Row-Mutex
- **Masalah**: Race condition pada penugasan paralel atau persetujuan CDD ganda dapat merusak konsistensi lifecycle perkara.
- **Solusi**: Menggunakan `SELECT ... FOR UPDATE` pada `corporate_service_cases` dan `service_orders` / `compliance_assessments`. Semua pengecekan prasyarat dan perubahan status dieksekusi di dalam fungsi PL/pgSQL dengan `SECURITY DEFINER` dan `SET search_path = public, pg_catalog`.

### C. Idempotensi Zero-Write
- **Masalah**: Gangguan jaringan browser dapat menyebabkan retry request yang berpotensi menghasilkan error palsu atau mutasi ganda.
- **Solusi**: Tabel `public.notary_workspace_idempotency_records` menyimpan hash SHA-256 payload dan respons canonical. Replay dengan payload identik mengembalikan hasil sukses dengan flag `replayed: true` tanpa menulis ulang database; perubahan payload dengan kunci yang sama ditolak dengan kode `IDEMPOTENCY_CONFLICT`.

### D. Penegakan Zero Direct Table DML di Browser
- **Masalah**: Memberikan izin `UPDATE` pada `compliance_assessments` ke role `authenticated` memungkinkan browser memanipulasi keputusan penilaian kepatuhan secara langsung.
- **Solusi**: Hak akses `UPDATE` dan `INSERT` dicabut dari `authenticated` dan `anon`. Seluruh aksi CDD dieksekusi melalui Edge Function `notary-workspace` yang memverifikasi JWT dan memanggil RPC backend tepercaya.

---

## 3. Hasil Verifikasi & Testing

| Komponen / Gate | Command / Test Suite | Hasil |
|---|---|---|
| Edge Function Unit Suite | `node --test supabase/functions/notary-workspace/handler.test.ts` | **12 / 12 PASS** |
| Seluruh Edge Functions | `node --test supabase/functions/**/*.test.ts` | **31 / 31 PASS** |
| Frontend Integration Suite | `npm run test:phase2` | **115 / 115 PASS** |
| Typecheck Frontend Tests | `npm run typecheck:phase2-tests` | **PASS (0 errors)** |
| Typecheck Project | `npx tsc -b` | **PASS (0 errors)** |
| Linter Frontend | `npm run lint` | **PASS (0 warnings, 0 errors)** |
| Production Build | `npm run build` | **PASS (dist generated)** |
| Symbol Maps Verification | `node Tools/generate_symbol_map.mjs --check` | **PASS (58,624 chars)** |
| Symbol Generator Tests | `node --test --test-isolation=none Tools/symbol_map_lib.test.mjs` | **7 / 7 PASS** |

---

## 4. Batasan Jujur & Pekerjaan Mendatang (Non-Goals)

1. **Integrasi AHU & OSS**: Belum ada koneksi live ke sistem Kemenkumham atau OSS-RBA; integrasi tetap berstatus blocked/future work dan UI hanya menampilkan referensi terverifikasi yang tersimpan.
2. **E-KYC & Signing (Batch 3.D)**: Penandatanganan digital dokumen akta oleh para pihak merupakan lingkup batch berikutnya.
3. **Penyelesaian Pembayaran Pasca-Akta (Batch 3.E)**: Pelepasan dana escrow ke notaris setelah akta terbit merupakan lingkup settlement akhir.
