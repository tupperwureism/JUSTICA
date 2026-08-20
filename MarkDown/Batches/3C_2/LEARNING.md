# Pembelajaran & Keputusan Arsitektur — Batch 3.C.2 (Dokumen Belajar Singkat)

> **Topik**: Serialisasi Idempotensi dengan Advisory Lock, Primitive WORM Kanonik, Migrasi Forward-Only, dan Fail-Closed Canonical Refresh
> **Status**: `READY_FOR_EXTERNAL_REAUDIT`
> **Tanggal**: 20 Agustus 2026

---

## 1. Konsep Utama (Dalam Bahasa Indonesia Sederhana)

### 1.1 Mengapa Mengunci Baris yang Belum Ada Gagal Menserialisasi Concurrency?
Perintah SQL `SELECT ... FOR UPDATE` mengunci baris fisik yang dikembalikan oleh query. Jika sebuah kunci idempotensi baru dikirimkan untuk pertama kali, baris tersebut **belum ada** di tabel `notary_workspace_idempotency_records`.
Akibatnya:
- `SELECT ... FOR UPDATE` mengembalikan 0 baris dan **tidak mengunci apapun**.
- Dua request bersamaan (racing) akan sama-sama menganggap baris belum ada, lalu keduanya melanjutkan eksekusi mutasi.
- Salah satu request akan gagal dengan `unique_violation` atau `STAGE_CONFLICT`, alih-alih mendapatkan hasil replay yang mulus (`replayed: true`).

### 1.2 Solusi: Global Transaction Advisory Lock (`pg_advisory_xact_lock`)
Untuk menserialisasi request pertama kali pada kunci yang sama:
```sql
-- Normalisasi kunci UUID menjadi string teks kanonik
v_normalized_key := (p_idempotency_key::UUID)::TEXT;

-- Kunci ruang nama global berbasis hash 64-bit selama transaksi aktif
PERFORM pg_advisory_xact_lock(hashtextextended(concat('NOTARY_WORKSPACE:', v_normalized_key), 0));

-- Setelah advisory lock didapat, barulah baca tabel idempotensi dengan FOR UPDATE
SELECT * INTO v_existing
FROM public.notary_workspace_idempotency_records
WHERE idempotency_key = v_normalized_key
FOR UPDATE;
```
Ketika request A dan B tiba bersamaan:
1. Request A memperoleh advisory lock untuk kunci tersebut.
2. Request B tertahan (blocked) menunggu request A selesai.
3. Request A melakukan mutasi, menyimpan record idempotensi, dan commit.
4. Request B terbangun, membaca baris yang baru saja disimpan oleh Request A, dan langsung mengembalikan hasil asli dengan `replayed: true` (*zero-write*).

### 1.3 Replay Eksak vs Kemiripan Status Lokal
Sebuah sistem tidak boleh menganggap request sebagai "replay" hanya karena data di layar sudah berstatus `APPROVED` atau `ESCROW_LOCKED`:
- **Salah**: Browser memeriksa `if (decision === 'APPROVED') return { replayed: true }`. Ini menyembunyikan kenyataan bahwa penyerang atau pengguna lain mungkin mengirim mutasi liar.
- **Benar**: Browser wajib selalu memanggil server RPC. Hanya server database yang berhak menentukan replay berdasarkan rekaman fisik di `notary_workspace_idempotency_records` dengan payload digest yang cocok. Kunci baru terhadap data yang sudah selesai wajib ditolak sebagai konflik.

### 1.4 Evolusi Migrasi Maju (Forward-Only Migrations)
Dalam siklus hidup database profesional:
- Migrasi yang sudah di-commit ke repositori (`20260820000001`) tidak boleh diedit secara *in-place*, karena instance database yang sudah menerapkan migrasi tersebut tidak akan pernah menjalankan perbaikannya.
- Setiap perbaikan wajib dibuat sebagai migrasi forward baru (`20260820000100_close_notary_workspace_atomicity_gaps.sql`) menggunakan konstruksi aman seperti `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

### 1.5 Primitive Audit Kanonik: WORM Compliance Event
Tabel fiktif `public.audit_events` tidak ada dalam Justifiqa. Pencatatan audit kepatuhan kanonik menggunakan:
- Fungsi: `public.fn_append_compliance_workflow_event(p_case_id, NULL, NULL, NULL, p_event_type, p_actor_id, p_idempotency_key, p_occurred_at)`
- Tabel WORM: `public.compliance_workflow_events_worm`
- Event Type:
  - `'NOTARY_ASSIGNED'` untuk penugasan notaris oleh admin.
  - `'CDD_APPROVED'` untuk persetujuan CDD oleh notaris.

### 1.6 Prinsip Least Privilege: Pencabutan Update Langsung dari `service_role`
Kolom sensitif `assigned_notary_id` tidak boleh dapat di-update langsung melalui DML tabel oleh role apapun, termasuk `service_role`:
- Hak `UPDATE` pada `assigned_notary_id` dicabut dari `service_role`.
- Satu-satunya jalur mutasi adalah melalui fungsi `SECURITY DEFINER` yang dimiliki oleh `postgres` dan dieksekusi dengan validasi wewenang admin.

### 1.7 Fail-Closed Canonical Refresh Sebagai Gate Sukses UI
UI frontend dilarang menampilkan pesan sukses sebelum memverifikasi hasil penyegaran data dari database:
1. Panggil RPC mutasi.
2. Segarkan data konteks dari server (`listAssignmentContext()` atau `loadNotaryWorkspaces()`).
3. Cari perkara spesifik dalam hasil refresh. Jika perkara hilang atau kolomnya tidak cocok, UI wajib melempar error dan **mempertahankan `attemptKey`**.
4. Pengguna dapat menekan tombol Retry yang akan mengirim ulang data dengan kunci idempotensi yang persis sama.

---

## 2. Checklist Verifikasi Mandiri

- [x] Advisory lock `pg_advisory_xact_lock` diterapkan di awal kedua RPC.
- [x] Primitive audit menggunakan `public.fn_append_compliance_workflow_event` dan menulis ke `compliance_workflow_events_worm`.
- [x] Migrasi dibuat sebagai file baru `20260820000100_close_notary_workspace_atomicity_gaps.sql`.
- [x] Hak `UPDATE (assigned_notary_id)` dicabut dari `service_role`.
- [x] Fixture runtime SQL memenuhi seluruh NOT NULL dan CHECK constraints kanonik.
- [x] Replay tiruan di browser service telah dihapus.
- [x] Canonical refresh di UI bersifat fail-closed dan mempertahankan `attemptKey`.
- [x] Seluruh unit test, integration test, typecheck, lint, dan build 100% lulus.

---

## 3. Mini Kuis Pemahaman

1. **Pertanyaan**: Mengapa `SELECT ... FOR UPDATE` tidak cukup untuk mencegah race condition pada request pertama yang menggunakan kunci idempotensi baru?
   **Jawaban**: Karena pada request pertama baris tersebut belum ada di tabel, sehingga query mengembalikan 0 baris dan tidak ada baris yang dikunci. Dua transaksi bersamaan akan sama-sama melewatinya dan saling bertabrakan saat insert. `pg_advisory_xact_lock` diperlukan untuk mengunci kunci tersebut pada tingkat transaksi sebelum tabel dibaca.

2. **Pertanyaan**: Mengapa kolom `assigned_notary_id` dicabut dari grant update `service_role`?
   **Jawaban**: Untuk mematuhi prinsip *least privilege* dan *defense-in-depth*. Penugasan notaris wajib melewati verifikasi status notaris aktif, kualifikasi advokat terverifikasi, wewenang admin kepatuhan, status dana tertahan di escrow, dan pencatatan WORM event yang hanya dijamin di dalam RPC `fn_assign_corporate_notary_atomic`.
