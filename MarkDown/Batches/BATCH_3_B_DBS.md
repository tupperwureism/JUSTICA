# DBS Batch 3.B ? Settlement Escrow Corporate yang Atomik dan Status UI Kanonik

Dokumen belajar ini menjelaskan batas implementasi Batch 3.B. Ini bukan panduan deployment produksi dan tidak memilih provider pembayaran tertentu.

## 1. Payment initiation berbeda dari settlement

Payment initiation adalah proses membuat invoice/session/VA/QRIS/checkout URL pada provider. Bagian itu belum ada karena provider belum dipilih.

Settlement adalah penerimaan bukti callback bahwa pembayaran tertentu sudah terjadi, lalu perubahan state internal secara atomik. Batch ini hanya menyelesaikan settlement. Karena itu UI tidak memiliki tombol ?Bayar sekarang?, URL checkout palsu, atau simulasi sukses. Lihat proyeksi pengguna pada `justifiqa-frontend/src/components/corporate/CorporateEscrowCheckoutPanel.tsx`.

## 2. Mengapa external webhook memakai verify_jwt=false

Provider eksternal tidak memiliki JWT sesi pengguna Justifiqa. Karena itu `supabase/config.toml` mempertahankan `verify_jwt = false` untuk `payment-webhook`.

`verify_jwt=false` bukan berarti endpoint tanpa autentikasi. Autentikasinya diganti dengan timestamped HMAC:

1. provider mengirim raw body, timestamp, dan signature;
2. server membaca exact raw bytes sekali melalui `arrayBuffer()`;
3. server memverifikasi HMAC atas `timestamp.rawBody`;
4. server menolak signature hilang, salah, atau stale;
5. baru setelah itu JSON diparse dan database dipanggil.

Implementasi ada di `supabase/functions/payment-webhook/handler.ts`; primitive HMAC ada di `supabase/functions/_shared/crypto.ts`. Pengujian perilakunya ada di `supabase/functions/payment-webhook/handler.test.ts`.

Mengapa exact raw body penting? JSON yang secara makna sama dapat memiliki spasi, urutan karakter, BOM, atau encoding byte berbeda. Signature dan digest harus memakai byte yang benar-benar diterima, bukan hasil decode dan encode ulang.

## 3. Idempotency dan replay

Provider dapat mengirim event yang sama berkali-kali. Handler menurunkan kunci stabil dari provider name dan provider event ID, sedangkan PostgreSQL menyimpan digest SHA-256 raw payload.

Replay identik:

- menemukan event provider yang sama;
- row-lock event tersebut;
- memverifikasi provider, event type, order, dan digest tetap sama;
- mengembalikan record kanonik sama dengan `replayed=true`.

Replay termutasi:

- event ID sama tetapi digest atau binding berubah;
- ditolak sebagai conflict;
- transaksi rollback sehingga tidak ada partial write.

Lihat `public.fn_process_corporate_payment_webhook_atomic` pada `supabase/migrations/20260813032019_process_corporate_payment_webhook_atomic.sql` dan assertion nyata pada `Tools/corporate_escrow_settlement_runtime.sql`.

## 4. Row lock dan transaksi atomik

Satu pemanggilan RPC adalah satu transaksi PostgreSQL. Urutan lock-nya konsisten:

1. `provider_webhook_events`;
2. corporate case dan escrow melalui primitive kanonik;
3. `service_orders`;
4. seluruh `payment_milestones` milik order.

Jika salah satu validasi atau update gagal, seluruh statement RPC gagal dan PostgreSQL membatalkan semua mutation dalam transaksi tersebut.

State sukses yang wajib hadir bersama:

- escrow: `PENDING_PAYMENT ? HELD_IN_ESCROW`;
- case: `DRAFT ? ESCROW_LOCKED`;
- order: `PAYMENT_PENDING ? ACTIVE`;
- semua milestone: `PENDING ? FUNDED`;
- provider event: `PENDING/RETRYING ? PROCESSED`.

Handler juga menolak hasil RPC kosong, lebih dari satu baris, malformed, atau identifier mismatch. Jadi HTTP 200 tidak boleh keluar jika settlement kanonik belum lengkap.

## 5. Referensi pembayaran berasal dari server

Browser tidak boleh memilih payment reference. Corporate Intake menurunkannya sebagai:

`CORP-${lowercase canonical order UUID}`

Contoh:

`CORP-b3be0000-0000-4000-8000-000000000001`

Format ini deterministic, stabil pada replay, tidak memakai nominal modal, nama perusahaan, input bebas, atau secret. Implementasi server ada di `supabase/functions/corporate-intake/handler.ts`. Kontrak browser yang sudah menghapus field ada di:

- `justifiqa-frontend/src/models/corporateIntake.ts`;
- `justifiqa-frontend/src/services/phase2IntegrationService.ts`;
- `justifiqa-frontend/src/components/corporate/CorporateIntakeStepFields.tsx`.

Jika browser tetap mengirim `paymentGatewayRef`, strict unknown-field validation menolaknya.

## 6. Service role, SECURITY DEFINER, dan RLS

Service-role key hanya berada di server/harness lokal, tidak di browser. RPC baru:

- `SECURITY DEFINER`;
- `SET search_path = ''`;
- memakai semua nama schema secara eksplisit;
- mencabut EXECUTE dari `PUBLIC`, `anon`, dan `authenticated`;
- memberi EXECUTE hanya kepada `service_role` dan owner `postgres`.

Primitive settlement lama tidak lagi executable oleh `service_role`, sehingga tidak dapat dipakai untuk membuat hanya sebagian state menjadi sukses.

RLS pada `provider_webhook_events` tetap dipaksa. Browser hanya dapat membaca event order miliknya sesuai policy historis dan tidak memiliki INSERT/UPDATE/DELETE. Negative ACL tests ada di `Tools/corporate_escrow_settlement_runtime.sql`.

## 7. Evidence yang disimpan

Raw provider payload tidak disimpan. Evidence inbound yang disimpan dibatasi pada:

- provider name;
- provider event ID;
- event type;
- SHA-256 digest raw payload;
- signature-verified flag;
- processed status dan timestamps;
- binding order.

Repository belum memiliki dedicated inbound funding ledger. Batch ini tidak mengarang tabel baru; `provider_webhook_events` dan compliance/WORM evidence yang sudah ada menjadi limitation yang dicatat.

## 8. Canonical UI projection

UI tidak menebak keberhasilan dari respons browser atau status mutation saja. Data mengalir melalui gateway ? service ? hook ? component:

- `justifiqa-frontend/src/services/phase2SupabaseGateway.ts`;
- `justifiqa-frontend/src/services/phase2IntegrationService.ts`;
- `justifiqa-frontend/src/hooks/useClientCorporateIntegrationFactory.ts`;
- `justifiqa-frontend/src/components/corporate/CorporateEscrowCheckoutPanel.tsx`.

`PENDING_PAYMENT` menampilkan bahwa pembayaran belum terkonfirmasi dan bukan sukses. Hanya state workspace `HELD_IN_ESCROW` yang menampilkan dana telah berada di escrow. Loading mencegah double refresh, retry memakai case ID yang sama, dan success memicu refresh workspace lagi.

Aksesibilitas:

- `role=status` + `aria-live=polite` untuk status kanonik;
- `role=alert` untuk error;
- tombol refresh/retry disabled saat loading.

## 9. Simulasi provider lokal

`Tools/corporate_escrow_signed_webhook_probe.mjs`:

- membaca secret ephemeral dari environment;
- menandatangani exact raw body;
- menguji valid callback, identical replay, mutated replay, invalid signature, dan stale signature;
- membaca order/case/escrow/milestone/event setelah respons;
- gagal bila HTTP 200 tidak diikuti state database kanonik.

`Tools/corporate_escrow_local_webhook_server.mjs` menjalankan production handler melalui seam dependency injection terhadap PostgREST disposable. Tidak ada secret yang disimpan ke repository.

## Mini-kuis

1. Mengapa JSON harus diverifikasi sebelum diparse?
2. Mengapa event ID saja tidak cukup untuk replay aman?
3. Apa yang terjadi jika milestone gagal diubah setelah escrow berubah?
4. Mengapa `PENDING_PAYMENT` tidak boleh ditampilkan sebagai sukses?
5. Mengapa provider initiation tidak boleh dipalsukan oleh tombol checkout dummy?

Jawaban singkat:

1. Signature berlaku atas exact raw body.
2. Digest dan seluruh binding juga harus sama.
3. Seluruh RPC rollback; tidak ada partial write.
4. Itu belum bukti dana held.
5. Karena belum ada kontrak/provider nyata dan akan membuat false success.

## Checklist operator lokal

- [ ] Secret webhook hanya ada di environment proses.
- [ ] Timestamp berada dalam skew yang diizinkan.
- [ ] Raw body tidak diubah sebelum HMAC.
- [ ] Provider name berasal dari server.
- [ ] RPC menghasilkan tepat satu row terkorelasi.
- [ ] Order ACTIVE, case ESCROW_LOCKED, escrow HELD_IN_ESCROW.
- [ ] Semua milestone FUNDED dan event PROCESSED.
- [ ] Replay identik `replayed=true`.
- [ ] Mutated replay dan signature invalid ditolak.
- [ ] UI membaca ulang workspace sebelum menyatakan held.
- [ ] Tidak ada provider initiation palsu.
