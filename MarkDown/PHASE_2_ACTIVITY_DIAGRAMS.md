# Phase 2 Activity Diagrams — Business Logic Tracking

Dokumen ini memuat Activity Diagram PlantUML untuk dua workflow Phase 2 Justifiqa. Diagram memakai ID aktivitas stabil agar setiap aktivitas, keputusan, loop, dan terminal state dapat dipetakan 1-to-1 ke Sequence Diagram BCE di `PHASE_2_SEQUENCE_DIAGRAMS.md`.

> **Konvensi:** `Supabase BaaS` adalah backend aktif (controller, domain service, scheduler, provider adapter, repository, trigger, dan RLS), bukan database pasif. Operasi provider eksternal tidak menyimpan credential atau payload mentah di database workflow.

## Cara import ke Draw.io

1. Buka Draw.io (`app.diagrams.net`).
2. Pilih **Arrange → Insert → Advanced → PlantUML**.
3. Tempel kode PlantUML, lalu pilih **Insert**.

---

## AD-P2-01: Corporate Intake & Notary Stamping

Alur ini mencakup intake PT/CV, validasi berulang, order dan milestone, escrow, review Notaris, submission AHU/OSS yang dapat ditolak berulang, WORM anchoring, serta payout idempoten. Klien hanya menerima status netral; detail internal PMPJ/compliance tidak ditampilkan.

```plantuml
@startuml
title AD-P2-01: Corporate Intake & Notary Stamping

|Klien|
start
:[AD01-01] Isi dan submit Corporate Intake\n(PT/CV, KBLI, struktur, natural-person BO,\nconsent dan versi legal scope);

|Sistem UI|
:[AD01-02] Validasi format dan kelengkapan;
while (Payload valid?) is (Tidak)
  :Tampilkan error terarah;
  |Klien|
  :Perbaiki dan submit ulang;
  |Sistem UI|
  :Validasi ulang payload;
endwhile (Ya)

|Supabase BaaS|
:[AD01-03] Simpan case DRAFT, parties, BO,\nservice order, fee lines, dan milestone\nsecara atomik;

|Sistem UI|
:[AD01-04] Tampilkan checkout dan penawaran berversi;
|Klien|
:Setujui penawaran dan pilih metode pembayaran;

|Payment Gateway / Escrow|
:Terima transfer ke rekening bersama;
:Kirim webhook pembayaran bertanda tangan;

|Supabase BaaS|
:[AD01-05] Verifikasi HMAC, event, order, dan nominal;\nlock event + escrow row (SELECT ... FOR UPDATE);
if (Webhook dan pembayaran valid?) then (Tidak)
  :Tolak mutasi finansial;\norder tetap PENDING_PAYMENT;
  |Sistem UI|
  :Tampilkan pembayaran gagal/pending;
  |Klien|
  :Ulangi pembayaran atau batalkan checkout;
  stop
else (Ya)
  :Set escrow_transactions = HELD_IN_ESCROW;\nset milestone = FUNDED;\ncatat ledger append-only;
endif

|Supabase BaaS|
:[AD01-06] Set case = ESCROW_LOCKED;\ntugaskan dan notifikasi Notaris;

|Notaris|
:[AD01-07] Buka workspace dan review intake,\nBO, identitas, KBLI, domisili, dan formalitas;
while (Intake lengkap dan dapat diproses?) is (Tidak)
  :Tandai CUSTOMER_ACTION_REQUIRED\n(tanpa alasan compliance sensitif);
  |Supabase BaaS|
  :Simpan expected-state transition dan notifikasi Klien;\ndana tetap HELD_IN_ESCROW;
  |Klien|
  :Lengkapi data/dokumen dan submit ulang;
  |Supabase BaaS|
  :Simpan revisi dan audit metadata;
  |Notaris|
  :[AD01-08] Review ulang revisi;
endwhile (Ya)

|Notaris|
:[AD01-09] Siapkan submission AHU/OSS\nmelalui kanal resmi dengan credential sendiri;

|Supabase BaaS|
:Buat government_submission_job SUBMITTED\n(digest + idempotency key, tanpa raw credential/payload);
while (Submission disetujui?) is (Tidak — REJECTED)
  :[AD01-10] Catat REJECTED dan alasan yang boleh disimpan;
  |Notaris|
  :Revisi data/dokumen;
  |Supabase BaaS|
  :Buat job DRAFT baru dengan idempotency key baru;
  |Notaris|
  :Submit ulang melalui kanal resmi;
  |Supabase BaaS|
  :Set job revisi = SUBMITTED;
endwhile (Ya — APPROVED)

|Supabase BaaS|
:[AD01-11] Rekonsiliasi nomor AHU/NIB,\nexternal reference, dan digest final;
if (Rekonsiliasi final valid?) then (Tidak)
  :Set COMPLIANCE_HOLD;\nblok payout dan minta review internal;
  stop
else (Ya)
endif

|Notaris|
:Unggah dokumen final ke bucket privat;
|Supabase BaaS|
:[AD01-12] MIME allow-list + malware scan;\nhitung SHA-256 server-side;\nsimpan document_integrity_anchors\nappend-only dan kunci case;

:[AD01-13] Siapkan payout milestone;\ncommit intent + idempotency key;\npanggil provider di luar transaksi DB;\nfinalize dengan row lock dan rekonsiliasi;
|Payment Gateway / Escrow|
:Transfer dana escrow ke rekening Notaris;\nkembalikan reference terautentikasi;
|Supabase BaaS|
:Set milestone = RELEASED;\ncatat payout result dan audit_logs_worm;

|Sistem UI|
:[AD01-14] Tampilkan status selesai,\ndokumen WORM, dan payout terkonfirmasi;
|Klien|
:Unduh dokumen final melalui akses terotorisasi;
|Notaris|
:Terima konfirmasi payout;
stop
@enduml
```

---

## AD-P2-02: High-Stakes Property Transaction — e-KYC Forensik Multi-Pihak

Escrow harus terkunci sebelum undangan e-KYC aktif. TTL global adalah **7 × 24 jam sejak `escrow_locked_at`**. Scheduler dan setiap command/callback memeriksa deadline yang sama. Satu pihak yang terbukti ilegal, gagal liveness pada percobaan ketiga, atau tidak merespons sampai TTL berakhir memicu **Global Halt**: envelope dibatalkan untuk semua pihak dan escrow dikembalikan penuh secara idempoten.

```plantuml
@startuml
title AD-P2-02: Property Transaction — e-KYC, TTL 7 Hari, Global Halt & Escrow Refund

|Pihak Transaksi|
start
:[AD02-01] Inisiator membuat transaksi,\nmendaftarkan seluruh pihak dan e-kertas;

|Supabase BaaS|
:Bekukan digest dokumen;\nbuat envelope DRAFT dan party PENDING;
|Sistem UI|
:[AD02-02] Tampilkan checkout escrow;
|Pihak Transaksi|
:Setujui biaya dan transfer ke rekening bersama;
|Payment Gateway / Escrow|
:Verifikasi sumber dana dan kirim webhook bertanda tangan;
|Supabase BaaS|
:[AD02-03] Verifikasi webhook + nominal;\nrow-lock escrow; set HELD_IN_ESCROW;\nset expires_at = escrow_locked_at + 7 hari;\ncatat audit append-only;
if (Escrow berhasil dikunci?) then (Tidak)
  :Batalkan aktivasi e-KYC;\ntidak ada dana yang direfund;
  stop
else (Ya)
endif

:[AD02-04] Kirim undangan unik ke seluruh pihak;\naktifkan watchdog TTL 7 hari;

while (Semua pihak berstatus PASSED?) is (Belum)
  :[AD02-05] Pilih pihak PENDING berikutnya\natau tunggu event/callback;
  if (Sekarang >= expires_at dan ada pihak belum PASSED?) then (Ya)
    :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
    :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
    stop
  else (Tidak)
  endif

  |Pihak Transaksi|
  :Buka tautan auto-login dan baca e-kertas 1..n;\nsetujui tiap halaman dan bubuhkan TTD final;
  |Sistem UI|
  :[AD02-06] Verifikasi sesi, consent per halaman,\ndan digest dokumen yang telah dibekukan;

  while (Pihak belum PASSED dan liveness_attempt_count < 3?) is (Ya)
    |Supabase BaaS|
    :Row-lock envelope; pastikan status masih aktif\ndan now < expires_at sebelum membuat sesi provider;
    if (Deadline telah lewat?) then (Ya)
      :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
      :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
      stop
    else (Tidak)
    endif
    |Sistem UI|
    :[AD02-07] Buka SDK/redirect provider;\nmedia mentah dikirim langsung ke provider,\ntidak melalui API/storage/log Justifiqa;
    |Pihak Transaksi|
    :Ambil bukti forensik:\nsetengah badan + KTP + device berisi TTD final;
    |Provider e-KYC / CV AI|
    :Liveness anti-spoof/editan;\nOCR KTP; deteksi device dan TTD;\nvalidasi terhadap sumber pemerintah;
    :Kirim callback metadata bertanda tangan\n(reference, status, digest, timestamp);
    |Supabase BaaS|
    :[AD02-08] Verifikasi signature, timestamp,\nnonce/idempotency dan anti-replay;
    if (Callback valid?) then (Tidak)
      :Tolak callback tanpa mengubah status;\nTTL tetap berjalan;
    else (Ya)
      :Row-lock envelope; periksa expires_at dan status terminal\nsebelum menerima outcome atau mengubah status;
      if (Callback tiba setelah deadline?) then (Ya)
        :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
        :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
        stop
      else (Tidak)
        :Simpan metadata allow-list saja;\nTANPA media/payload biometrik mentah;
      endif

      if (Ilegal/fraud terkonfirmasi?) then (Ya)
        :[AD02-09] GLOBAL HALT — ILLEGAL_CONFIRMED;\nset pihak = REJECTED;\nset envelope = VOIDED;\nblok semua pihak;
        :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
        stop
      else (Tidak)
      endif

      if (Hasil meragukan, OCR/device/TTD mismatch,\natau perlu keputusan manusia?) then (Ya)
        :[AD02-11] Set REQUIRES_MANUAL_REVIEW;\nreviewer menerima metadata minimum,\nbukan raw media melalui Justifiqa;
        :Saat callback reviewer tiba, verifikasi signature/anti-replay;\nrow-lock envelope dan periksa deadline yang sama;
        if (Callback reviewer tiba setelah deadline?) then (Ya)
          :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
          :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
          stop
        else (Tidak)
        endif
        if (Review mengonfirmasi ilegal?) then (Ya)
          :[AD02-09] GLOBAL HALT — ILLEGAL_CONFIRMED;\nset pihak = REJECTED;\nset envelope = VOIDED;
          :[AD02-17] Refund idempoten 100%;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit; notifikasi semua pihak;
          stop
        else (Tidak — Clear)
          :Set hasil review = PASSED;
        endif
      else (Keputusan otomatis dapat diterima)
        if (Liveness lulus?) then (Ya)
          :Set hasil = PASSED;
        else (Tidak)
          :[AD02-10] Increment liveness_attempt_count;\ncatat kegagalan liveness terpisah;
        endif
      endif
    endif
  endwhile (Tidak)

  if (Pihak berstatus PASSED?) then (Tidak — 3 liveness gagal)
    :[AD02-12] GLOBAL HALT — LIVENESS_FAILED_3X;\nset pihak = REJECTED;\nset envelope = VOIDED;\nblok semua pihak;
    :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
    stop
  else (Ya)
    :[AD02-13] Pertahankan status DB = PASSED;\nproyeksi UI = GREEN;
  endif

  :[AD02-14] Cek ulang seluruh pihak;\nreschedule watchdog bila masih PENDING;
endwhile (Ya)

:[AD02-16] Tandai fase e-KYC selesai;\nenvelope dapat lanjut ke fase signing;\nescrow tetap HELD_IN_ESCROW sampai\nmilestone berikutnya terpenuhi;
|Sistem UI|
:Tampilkan semua pihak GREEN dan deadline selesai;
|Pihak Transaksi|
:Lanjut ke fase signing/milestone berikutnya;
stop
@enduml
```

---

## Keputusan arsitektur dan status kanonik

1. **Corporate rejection loop diperbaiki:** `REJECTED → DRAFT → SUBMITTED` kini kembali ke keputusan approval, bukan jatuh otomatis ke jalur `APPROVED`.
2. **Payout Notaris tidak memakai fungsi payout Advokat:** diagram memakai port payout role-aware dengan prepare/commit → external call → finalize/reconcile. `fn_release_escrow_to_advocate_mutex` tidak diklaim dapat membayar Notaris.
3. **e-KYC zero raw biometric:** browser berinteraksi langsung dengan SDK/provider. Justifiqa hanya menerima callback metadata yang telah diverifikasi.
4. **Status e-KYC:** status database adalah `PENDING | PASSED | REJECTED | REQUIRES_MANUAL_REVIEW`; warna **GREEN** hanya proyeksi UI untuk `PASSED`.
5. **Global Halt:** `VOIDED` digunakan untuk ilegal/fraud atau tiga kegagalan liveness; `EXPIRED` untuk TTL; histori individual tidak dihapus.
6. **Escrow:** sukses e-KYC tidak otomatis mencairkan uang. Dana tetap `HELD_IN_ESCROW`; semua terminal Global Halt menghasilkan `REFUNDED_TO_CLIENT`.
7. **Gap implementasi yang disengaja terlihat:** migrasi saat ini belum memiliki aggregate property transaction dan kolom deadline khusus yang mengikat envelope ke escrow. Diagram ini adalah kontrak target Batch 2; remediasi SQL berada di luar kewenangan batch ini.

## Tabel terkait yang benar-benar tersedia

| Diagram | Tabel utama |
| --- | --- |
| AD-P2-01 | `corporate_service_cases`, `corporate_parties`, `beneficial_owners`, `service_orders`, `service_fee_lines`, `payment_milestones`, `escrow_transactions`, `payout_idempotency_keys`, `government_submission_jobs`, `document_integrity_anchors`, `audit_logs_worm`, `user_notifications` |
| AD-P2-02 | `ekyc_verification_logs`, `signing_envelopes`, `signing_envelope_parties`, `escrow_transactions`, `payment_milestones`, `escrow_payout_ledgers`, `audit_logs_worm`, `user_notifications` |
