# Pembelajaran & Keputusan Arsitektur — Batch 3.C.1 (Dokumen Belajar Singkat)

> **Topik**: Rekonsiliasi Skema Kanonik, Row-Mutex Idempotensi, Siklus Hidup Transisi Atomik, dan Boundary Keamanan Notaris
> **Status**: `READY_FOR_EXTERNAL_REAUDIT`
> **Tanggal**: 20 Agustus 2026

---

## 1. Konsep Utama (Dalam Bahasa Indonesia Sederhana)

### 1.1 Skema Kanonik vs Kolom Rekaan
Dalam audit eksternal Batch 3.C, ditemukan asumsi keliru mengenai kolom database:
- `users_admin` tidak memiliki kolom `is_active`. Status dan wewenang admin ditentukan dari record keberadaan admin dan kolom `role_group` (`COMPLIANCE_OFFICER` atau `SUPER_ADMIN`).
- `users_advocate` tidak memiliki boolean `is_verified` atau `license_number`. Verifikasi advokat kanonik dicatat pada `kyc_status = 'VERIFIED'` dan diperiksa menggunakan helper tersertifikasi `public.fn_is_verified_advocate(UUID)`.
- `service_orders` tidak mencatat `escrow_status` atau `funds_locked_at`. Bukti dana tersimpan dicatat pada tabel agregat terpisah yaitu `public.escrow_transactions`.

### 1.2 Escrow Sebagai Agregat Terpisah
Dana tertahan dalam sistem Justifiqa dikelola secara ACID di tabel `escrow_transactions`:
- `corporate_case_id`: UUID relasi ke perkara korporasi.
- `status`: Wajib bernilai `'HELD_IN_ESCROW'`.
- `funds_locked_at`: Wajib tidak null (`IS NOT NULL`).

### 1.3 Siklus Hidup Perkara Korporasi & Batas Penugasan Notaris
Urutan tahap kanonik setelah pembayaran adalah:
$$\text{ESCROW\_LOCKED} \longrightarrow \text{IDENTITY\_PENDING} \longrightarrow \text{CDD\_REVIEW} \longrightarrow \text{DOCUMENTS\_PENDING}$$

- **Penugasan Notaris (Batch 3.C.1)**: Administrator memilih notaris dan menugaskannya ke perkara berstatus `ESCROW_LOCKED`. Penugasan ini **TIDAK** mengubah `current_stage`. Tahap perkara tetap berada pada `ESCROW_LOCKED`.
- **E-KYC Para Pihak (Batch 3.D)**: Memajukan perkara dari `ESCROW_LOCKED` $\to$ `IDENTITY_PENDING` $\to$ `CDD_REVIEW`.
- **Persetujuan CDD (Batch 3.C.1)**: Dilakukan oleh notaris saat perkara sudah mencapai `CDD_REVIEW`. Persetujuan ini memajukan tahap perkara menjadi `DOCUMENTS_PENDING` secara atomik melalui `public.fn_transition_corporate_service_case`.

### 1.4 Penguncian Baris (Row-Mutex) & Idempotensi Zero-Write
Untuk mencegah race condition dan mutasi ganda:
```sql
-- Penguncian baris perkara dan transaksi escrow secara deterministik
SELECT * INTO v_case FROM public.corporate_service_cases WHERE case_id = p_case_id FOR UPDATE;
SELECT * INTO v_escrow FROM public.escrow_transactions WHERE corporate_case_id = p_case_id FOR UPDATE;
```
Ketika kunci idempotensi yang sama dikirimkan ulang dengan muatan data identik:
- Database mengembalikan hasil asli yang tersimpan dalam `notary_workspace_idempotency_records` dengan flag `replayed: true`.
- Zero effective writes: Tidak ada update tambahan pada data perkara maupun penambahan log audit baru.

### 1.5 Otorisasi Sisi Server & Zero Direct Table DML dari Browser
Browser tidak boleh dipercaya untuk mengirimkan `adminId`, `notaryId`, `role`, atau `escrowStatus`. Seluruh identitas aktor diambil langsung dari JWT terverifikasi di Edge Function:
- Browser hanya dapat memanggil Edge Function `notary-workspace`.
- Seluruh hak akses direct `INSERT`, `UPDATE`, `DELETE` pada tabel `compliance_assessments` dan `assigned_notary_id` dicabut dari role `authenticated` dan `anon`.

### 1.6 Penyegaran Kanonik Sebagai Gate Sukses UI
UI tidak boleh menampilkan pesan sukses sebelum melakukan *canonical refresh* ke server:
1. Panggil RPC melalui gateway.
2. Lakukan `listAssignmentContext()` atau `loadNotaryWorkspaces()`.
3. Verifikasi bahwa data hasil refresh benar-benar membuktikan perubahan (misalnya `assignedNotaryId` cocok dan `currentStage` sesuai).
4. Jika refresh gagal atau data belum berubah, UI wajib fail-closed dan menampilkan error.

---

## 2. Checklist Verifikasi Mandiri

- [x] Tidak ada referensi ke kolom fiktif `is_active`, `is_verified`, atau `service_orders.escrow_status`.
- [x] Penugasan notaris mempertahankan tahap `ESCROW_LOCKED`.
- [x] Persetujuan CDD menggunakan fungsi kanonik `fn_transition_corporate_service_case`.
- [x] Seluruh error database disanitasi dan tidak membocorkan teks SQL atau PII.
- [x] Hak akses direct browser DML dicabut.
- [x] Unit test dan typecheck frontend 100% lulus.

---

## 3. Mini Kuis Pemahaman

1. **Pertanyaan**: Mengapa penugasan notaris tidak boleh langsung mengubah tahap perkara menjadi `CDD_REVIEW`?
   **Jawaban**: Karena secara hukum dan alur proses kanonik, para pendiri PT harus melewati verifikasi identitas / e-KYC terlebih dahulu (`IDENTITY_PENDING`), yang merupakan domain Batch 3.D. Penugasan notaris hanya menetapkan siapa pejabat yang akan memproses perkara tersebut di kemudian hari.

2. **Pertanyaan**: Mengapa mock unit test di frontend tidak cukup untuk membuktikan kepatuhan database?
   **Jawaban**: Mock hanya menguji logika pengkondisian frontend terhadap objek tiruan, bukan constraint skema nyata, foreign key, trigger, atau RLS PostgreSQL. Verifikasi penuh memerlukan test suite runtime transaksi SQL nyata (`Tools/notary_workspace_runtime.sql`).
