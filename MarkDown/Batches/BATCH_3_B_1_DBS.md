# DBS Batch 3.B.1 — Hardening Replay Webhook Escrow Korporasi

## Tujuan

Batch 3.B.1 memperbaiki satu sifat penting pada settlement pembayaran korporasi: callback provider yang sama harus tetap dapat dikenali sebagai replay yang sah walaupun workflow kasus dan milestone sudah maju setelah settlement pertama. Batch ini tidak membuat payment initiation dan tidak memilih provider. Status initiation tetap BLOCKED_BY_PROVIDER_SELECTION.

## Replay durable dan state workflow yang berubah

Identitas event pembayaran bersifat tetap: provider, provider event ID, tipe event, order ID, digest SHA-256 dari exact raw body, serta signature_verified=true. Binding settlement juga tetap: relasi order–case–escrow, nominal, payment reference CORP-{orderId}, dan idempotency key.

Sebaliknya, stage kasus dan status milestone memang boleh berubah. Sesudah settlement pertama, kasus dapat bergerak dari ESCROW_LOCKED ke IDENTITY_PENDING, dan milestone dari FUNDED ke RELEASABLE. Karena itu replay yang sudah PROCESSED tidak boleh diputuskan dari status workflow terkini. RPC mengunci row event, memeriksa identitas serta binding yang tetap, lalu mengembalikan receipt settlement asli dengan replayed=true tanpa memanggil primitive settlement lagi dan tanpa write baru. Lihat public.fn_process_corporate_payment_webhook_atomic di supabase/migrations/20260813064656_preserve_corporate_payment_webhook_replay.sql.

## Row lock dan delivery konkuren

Provider bisa mengirim event identik hampir bersamaan. RPC memakai insert-on-conflict kemudian SELECT ... FOR UPDATE pada provider_webhook_events. Request pertama memproses settlement atomik. Request kedua menunggu lock, membaca event yang sudah PROCESSED, lalu mengambil jalur replay. Probe mengirim dua request lewat Promise.all dan memastikan hasilnya satu replayed=false, satu replayed=true, event ID sama, serta hanya satu row event. Lihat Tools/corporate_escrow_signed_webhook_probe.mjs dan wrapper Tools/corporate_escrow_local_webhook_server.mjs.

## SECURITY DEFINER dan least privilege

Mutasi settlement hanya boleh melalui RPC SECURITY DEFINER dengan search_path kosong dan nama objek schema-qualified. service_role tetap dapat mengeksekusi RPC, tetapi direct INSERT, UPDATE, dan DELETE pada provider_webhook_events dicabut; akses tabel yang diperlukan hanya read. PUBLIC, anon, dan authenticated tidak mendapat EXECUTE RPC privileged. RLS SELECT milik client yang sudah ada tidak diperlebar. Assertion ACL dan mutation nyata berada di Tools/corporate_escrow_settlement_runtime.sql.

## HMAC timestamped dan konfigurasi fail-closed

Handler memverifikasi timestamp serta HMAC atas exact raw request body sebelum parsing payload dan sebelum dependency database dipanggil. PAYMENT_WEBHOOK_SECRET wajib 32–4096 byte UTF-8. Batas bawah tersebut hanya length floor, bukan bukti entropy. PAYMENT_WEBHOOK_MAX_SKEW_SECONDS memakai default 300 hanya ketika unset; bila diisi, nilainya wajib integer 1–900. Nilai malformed, nol, negatif, pecahan, NaN, atau di atas 900 menghasilkan HTTP 500 SERVER_MISCONFIGURED dan tidak memanggil database. Lihat createPaymentWebhookHandler di supabase/functions/payment-webhook/handler.ts dan behavioral tests di handler.test.ts.

## Level bukti HTTP lokal

HTTP regression lokal menjalankan production handler factory melalui Node HTTP wrapper, lalu real PostgREST dan database disposable. Caller PostgREST mengirim Authorization: Bearer <service-role key> dan apikey: <service-role key>. Key dan HMAC secret hanya berasal dari process environment dan tidak dicatat.

Bukti ini kuat untuk handler-to-real-database boundary, concurrency, signature, replay, conflict, dan state akhir database. Bukti ini bukan full Supabase Deno Edge Runtime E2E: ia tidak membuktikan eksekusi supabase/functions/payment-webhook/index.ts, supabase/config.toml, atau runtime Deno lokal. Satu percobaan supabase functions serve yang dibatasi waktu tidak berhasil pada lingkungan Windows ini dan tidak diulang.

## Checklist / mini-kuis

- Apakah replay PROCESSED boleh bergantung pada case masih ESCROW_LOCKED? Tidak; stage workflow bersifat mutable.
- Apa yang wajib sama saat replay? Immutable event identity, signature evidence, binding order/case/escrow, nominal, reference, dan idempotency input.
- Mengapa perlu row lock? Agar delivery identik konkuren menghasilkan tepat satu initial processing dan satu replay, bukan dua settlement.
- Bolehkah service_role menulis event table secara langsung? Tidak untuk boundary ini; mutation dilakukan melalui RPC owner-trusted.
- Kapan skew memakai 300 detik? Hanya saat environment variable tidak disetel.
- Apakah HTTP wrapper membuktikan Edge Runtime? Tidak; ia membuktikan production handler factory ke real PostgREST/database.
- Apakah batch ini membuat checkout/provider initiation? Tidak; BLOCKED_BY_PROVIDER_SELECTION tetap berlaku.

## Referensi langsung

- supabase/migrations/20260813064656_preserve_corporate_payment_webhook_replay.sql
- supabase/functions/payment-webhook/handler.ts
- supabase/functions/payment-webhook/handler.test.ts
- Tools/corporate_escrow_settlement_runtime.sql
- Tools/corporate_escrow_local_webhook_server.mjs
- Tools/corporate_escrow_signed_webhook_probe.mjs
- MarkDown/SYMBOLS_MAP.md
