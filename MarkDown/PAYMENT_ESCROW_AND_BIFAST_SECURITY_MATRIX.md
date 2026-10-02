# Payment Escrow & BI-FAST Security Matrix

> Status: kontrol desain P2-B7/P2-B8, bukan opini hukum atau bukti perizinan. Aktivasi produksi wajib melalui PJP/bank peserta yang berizin, persetujuan penasihat hukum Indonesia, uji keamanan, dan rekonsiliasi operasional.

## Dasar dan batas kepatuhan

PBI No. 23/6/PBI/2021 tentang Penyedia Jasa Pembayaran berlaku sejak 1 Juli 2021 dan menekankan sistem pembayaran yang cepat, mudah, murah, aman, andal, perlindungan konsumen, praktik bisnis sehat, tata kelola, serta manajemen risiko. Justifiqa tidak boleh mengklaim sebagai PJP atau peserta BI-FAST hanya karena memiliki adapter teknis. Dana wajib diproses melalui PJP/bank berizin dengan perjanjian yang menjelaskan hak, kewajiban, tingkat layanan, masa penampungan, segregasi, pengembalian, sengketa, dan rekonsiliasi.

Sumber primer:

- [Bank Indonesia — PBI No. 23/6/PBI/2021](https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_230621.aspx)
- [Bank Indonesia — PADG No. 17 Tahun 2023 tentang BI-FAST](https://www.bi.go.id/id/publikasi/peraturan/Pages/PADG_172023.aspx)

## Matriks kontrol

| Risiko/kewajiban | Aturan mutlak | Kontrol teknis dan bukti keluar |
|---|---|---|
| Rekening bersama dan dana mediasi | Dana pelanggan tidak boleh diperlakukan sebagai kas bebas Justifiqa. Status `HELD_IN_ESCROW` hanya mengikuti konfirmasi PJP terverifikasi. | Rekonsiliasi nominal/order/event; ledger append-only; laporan saldo provider; prosedur refund dan sengketa. |
| Escrow Legal Buffer | Pencairan ditahan sampai milestone/evidence diterima, masa sanggah atau putusan sengketa terpenuhi, serta penerima terverifikasi. | State guard database, approval/evidence hash, timestamp, audit e-Meterai/PSrE, dan jejak aktor. |
| Keaslian webhook | Callback tanpa tanda tangan valid tidak boleh mengubah saldo atau status escrow. | Verifikasi HMAC SHA-256 pada boundary server, simpan hanya digest payload dan metadata minimum; `signature_verified = true` wajib sebelum RPC settlement. |
| Replay webhook | `provider_event_id` unik global dan hasil terminal idempoten. | Unique constraint, row lock atas event, status `PENDING/RETRYING/PROCESSED/FAILED`, timestamp proses, retry terukur. |
| Nominal/order mismatch | Event tidak boleh dialihkan ke order lain atau dibayar sebagian tanpa kontrak eksplisit. | Event terikat `order_id`; RPC menolak mismatch order, nominal, tipe event, atau status escrow. |
| Zero double-payout | Setiap instruksi payout memakai `idempotency_key = SHA256(order_id + milestone_id + timestamp)` dalam representasi kanonik terdokumentasi. Kunci tidak boleh digunakan ulang untuk escrow, penerima, nominal, atau kanal lain. | Unique constraint pada `idempotency_key`, digest 64 hex, row-level mutex, dan status `INITIATED/SUCCESS/FAILED`. |
| Row-level mutex | Transisi finansial wajib `SELECT ... FOR UPDATE` terhadap event dan `escrow_transactions`, lalu validasi state sebelum mutasi. | Uji dua transaksi konkuren: tepat satu transisi menang; yang lain menghasilkan replay aman atau kegagalan deterministik. |
| Larangan I/O di transaksi | Panggilan Midtrans, Xendit, bank, atau BI-FAST Adapter **dilarang keras** selama transaksi database mutex terbuka. | Pola prepare/commit → external call → finalize/reconcile. Timeout provider tidak menahan koneksi DB dan tidak menghapus intent. |
| Gagal/timeout payout | Status gagal bukan izin membuat kunci baru secara diam-diam. Retry memakai kunci sama sampai hasil provider direkonsiliasi. | Lookup provider reference, retry policy berbatas, dead-letter/manual review, dan alarm transaksi ambigu. |
| BI-FAST reference | Nomor referensi hanya dicatat setelah respons provider terautentikasi; tidak boleh direka oleh klien. | Service-role write, immutable audit event, rekonsiliasi harian terhadap laporan bank/PJP. |
| Integritas dokumen | Hash harus lowercase SHA-256 dari byte dokumen final yang tepat; serial e-Meterai/PSrE unik bila tersedia. | `document_integrity_anchors` append-only, digest 64 hex, serial unik, sumber anchor eksplisit. |
| Least privilege/RLS | Default deny. Klien hanya membaca webhook milik order-nya; tabel payout/anchor tidak memiliki akses klien langsung tanpa projection terpisah. | `FORCE ROW LEVEL SECURITY`, grant minimum, RPC hanya `service_role`/`postgres`, negative test lintas tenant. |
| Minimisasi payload | Raw webhook, kredensial, nomor rekening lengkap, biometric, dan private key tidak disimpan di tabel log ini. | Digest payload, secret manager/KMS, log redaction, retensi pendek untuk payload terenkripsi bila secara operasional mutlak diperlukan. |

## Kontrak transaksi settlement

1. Boundary server memverifikasi HMAC memakai secret provider, menormalisasi provider event ID, menghitung SHA-256 payload, dan mencatat event satu kali.
2. `fn_webhook_settle_escrow_mutex` mengunci event dan escrow, lalu memvalidasi signature, tipe `INVOICE_PAID`, ownership order, nominal, dan state `PENDING_PAYMENT`.
3. Dalam transaksi yang sama RPC mengubah escrow menjadi `HELD_IN_ESCROW` dan event menjadi `PROCESSED`. Tidak ada network call di dalam fungsi.
4. Replay event yang sudah `PROCESSED` dengan order dan nominal sama mengembalikan sukses idempoten; konflik data ditolak.
5. Payout berikutnya dibuat sebagai intent berkunci unik. Worker baru boleh memanggil provider setelah transaksi intent selesai commit, kemudian membuka transaksi singkat baru untuk finalisasi.

## Exit gate minimum

- Replay migrasi bersih dan types hasil schema sinkron.
- Uji webhook invalid signature, duplicate event, cross-order, amount mismatch, dan concurrent settlement.
- Uji double-payout paralel membuktikan satu kunci/satu hasil ekonomi.
- RLS negative test untuk klien lain dan anon.
- Rekonsiliasi provider-versus-ledger, drill timeout/unknown outcome, serta runbook refund/dispute disetujui sebelum produksi.
