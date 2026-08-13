# Batch 3.B ? Corporate Escrow Settlement & Canonical UI Status

Status kerja: IMPLEMENTASI BERJALAN ? belum diaudit eksternal.

## Fixed point dan provenance

- Branch wajib: `batch-3b-corporate-escrow`.
- Fixed-point HEAD: `2c7f28a86109d58acf4d1319a84ed04ca2e679bf`.
- Preflight: branch dan HEAD tepat, index kosong, tidak ada merge/rebase/cherry-pick/revert/sequencer aktif.
- Working tree pengguna memang sangat kotor. Pembandingan `git diff` dan `git diff --ignore-space-at-eol` mengisolasi empat tracked semantic WIP Inkling yang diketahui serta file untracked Batch 3.B.
- Historical wording/temporal debt Batch 3.A.1 dibekukan dan tidak memblokir Batch 3.B.

## Audit WIP Inkling

Dipertahankan sebagai arah desain:

- input payment reference dihapus dari wizard dan draft browser;
- kartu informasi menggantikan input manual;
- `payment-webhook/index.ts` tetap thin entrypoint;
- path handler, behavioral test, dan runtime SQL dipertahankan.

Diganti karena tidak valid:

- handler SELECT/INSERT/PATCH terpisah dan RPC lama diganti satu RPC atomik;
- `unknown[]` dan false-green HTTP 200 diganti validasi exact-one typed result;
- runtime `SELECT 'verified'` diganti fixture, mutation, assertions, ACL, replay, mismatch, zero-partial-write, dan rollback;
- test placeholder/throwing-handler diganti test dependency-injected terhadap production handler;
- algoritme referensi berbasis fragmen UUID/modal diganti `CORP-${orderId}`.

Dihapus setelah size dan SHA-256 cocok persis:

- `supabase/functions/payment-webhook/handler_backup.ts`;
- `fix_handler_syntax.py`;
- `fix_syntax_simple.py`.

## Checkpoints

### CP-00 ? preflight dan WIP provenance

Verified state:

- branch/fixed point tepat;
- staged index kosong;
- operasi Git aktif tidak ada;
- semantic WIP cocok dengan daftar recovery;
- artefak penghapusan cocok terhadap hash terkunci.

Files changed: belum ada perubahan baru pada saat checkpoint.

Blocker/limitation: working tree pengguna tetap kotor dan harus dipertahankan unstaged.

Next Exact Action: tulis RED test pada seam publik handler, intake, RPC, dan UI.

### CP-01 ? baseline failure dan RED tests

Verified state:

- handler Inkling gagal karena tidak mengekspor factory DI dan bergantung pada `Deno.env`;
- fixture frontend lama masih membawa `paymentGatewayRef`;
- RED mencakup HMAC, malformed/unknown payload, validation, exact RPC result, replay/conflict, leakage, concurrency, browser-field rejection, dan referensi replay-stable.

Files changed:

- `supabase/functions/payment-webhook/handler.test.ts`;
- `supabase/functions/corporate-intake/handler.test.ts`;
- test dan fixture corporate frontend yang terkait.

Blocker/limitation: executable Deno tidak tersedia pada PATH; test TypeScript kompatibel dijalankan dengan Node 24.

Next Exact Action: implementasikan RPC roll-forward dan runtime PostgreSQL nyata.

### CP-02 ? atomic migration/RPC dan SQL runtime

Verified state:

- migration `20260813032019_process_corporate_payment_webhook_atomic.sql` dibuat melalui Supabase CLI;
- RPC security-definer memakai empty search path, explicit PUBLIC/anon/authenticated revoke, dan service-role-only execute;
- runtime transaksional menghasilkan event PROCESSED, escrow HELD_IN_ESCROW, case ESCROW_LOCKED, order ACTIVE, dan dua milestone FUNDED;
- identical replay memakai event sama dan `replayed=true`;
- mutated replay, amount/reference/order/case/escrow/idempotency mismatch, NaN, serta NULL ditolak tanpa partial write;
- anon/authenticated RPC dan provider-event DML ditolak;
- assignment Notaris sebelum held ditolak;
- runtime berakhir ROLLBACK.

Files changed:

- `supabase/migrations/20260813032019_process_corporate_payment_webhook_atomic.sql`;
- `Tools/corporate_escrow_settlement_runtime.sql`.

Blocker/limitation: tidak ada dedicated inbound funding ledger; evidence memakai `provider_webhook_events` dan compliance/WORM evidence yang sudah tersedia.

Next Exact Action: selesaikan production webhook handler dan behavioral suite.

### CP-03 ? payment webhook handler

Verified state:

- exact raw body dibaca sebelum parsing;
- timestamped HMAC diverifikasi sebelum JSON parse dan sebelum dependency database;
- provider name berasal dari environment server;
- hanya RPC atomik baru yang dipanggil;
- exact-one result, exact keys, identifier correlation, dan canonical statuses wajib;
- safe 401/400/409/500/502 tidak membocorkan secret, signature, raw payload, atau SQL detail;
- 22 handler tests hijau; suite handler/intake/shared webhook 44 test hijau, ditambah shared crypto/validation 7 test hijau.

Files changed:

- `supabase/functions/payment-webhook/index.ts`;
- `supabase/functions/payment-webhook/handler.ts`;
- `supabase/functions/payment-webhook/handler.test.ts`;
- `Tools/corporate_escrow_signed_webhook_probe.mjs`.

Blocker/limitation: local HTTP-to-DB probe belum dijalankan pada clean disposable stack di checkpoint ini.

Next Exact Action: ikat referensi intake server dan proyeksi UI kanonik.

### CP-04 ? intake reference dan frontend status

Verified state:

- browser contract tidak memiliki payment reference;
- Corporate Intake menolak field tersebut sebagai unknown;
- server menurunkan `CORP-${lowercase canonical order UUID}`;
- service mapper tidak mengirim field browser;
- UI membedakan pending dari held dan pending tidak disebut sukses;
- refresh/retry single-flight, retry case ID stabil, successful refresh memuat ulang workspace;
- `role=status`, `aria-live=polite`, `role=alert`, dan disabled loading tersedia;
- internal blocker code tidak tampil; copy provider sandbox manusiawi;
- tiga integration UI/hook tests hijau; Phase 2 test typecheck dan `tsc -b` hijau.

Files changed:

- corporate intake model/UI/service/tests;
- escrow checkout panel;
- client corporate hook/factory;
- frontend test loader dan escrow integration test.

Blocker/limitation: provider initiation sengaja tidak dibuat.

Next Exact Action: clean disposable migration replay dan signed HTTP-to-DB probe.

### CP-05 ? disposable migration replay dan signed HTTP-to-DB E2E

Verified state:

- clean candidate berasal dari fixed point dan hanya memuat file Batch 3.B;
- seluruh migration berhasil direplay pada PostgreSQL disposable `justifiqa_b3b_candidate`;
- runtime SQL nyata selesai dengan `assertions-complete`, dua milestone funded, dan `ROLLBACK`;
- signed HTTP probe terhadap production handler DI menghasilkan HTTP 200 untuk callback valid dan replay identik, 409 untuk replay termutasi, serta 401 untuk signature invalid dan stale;
- pembacaan database setelah HTTP 200 membuktikan order `ACTIVE`, case `ESCROW_LOCKED`, escrow `HELD_IN_ESCROW`, dua milestone `FUNDED`, dan provider event `PROCESSED`;
- secret HMAC dan service-role JWT hanya berada di environment process sementara dan tidak ditulis ke file.

Files changed:

- `Tools/corporate_escrow_local_webhook_server.mjs`;
- `Tools/corporate_escrow_signed_webhook_probe.mjs`;
- `Tools/corporate_escrow_settlement_runtime.sql`.

Blocker/limitation: wrapper `supabase functions serve` berhenti pada setup Edge Runtime di lingkungan Windows ini. Harness HTTP lokal menjalankan factory production yang sama dengan dependency PostgREST nyata; tidak ada bypass terhadap signature atau RPC.

Next Exact Action: jalankan seluruh verification gates.

### CP-06 ? verification, DBB/DBS, generated artifacts

Verified state:

- payment webhook/intake/shared suite: 44 test hijau setelah tambahan RED/green integer-IDR dan exact-raw-byte cases;
- `npm run test:phase2`: 107 test hijau;
- `npm run typecheck:phase2-tests`, `npx tsc -b`, `npm run lint`, dan `npm run build`: exit 0;
- Phase 2 forensic static audit: 7 test hijau; forensic SQL runtime selesai dan rollback;
- database lint: exit 0, tanpa error; satu warning pre-existing unused variable di fungsi e-KYC di luar Batch 3.B;
- clean candidate symbol-map generation/check dan generator regression: 7 test hijau;
- `database.types.ts` dibuat mekanis dari postgres-meta database disposable, dengan diff hanya RPC Batch 3.B;
- build sandbox semula gagal `spawn EPERM`; rerun terisolasi di luar sandbox berhasil. Warning chunk-size/dynamic-import tetap debt pre-existing.

Files changed:

- `justifiqa-frontend/src/types/database.types.ts`;
- `MarkDown/SYMBOLS_MAP.md`;
- `MarkDown/SQL_SECURITY_SYMBOLS.md`;
- `MarkDown/Batches/BATCH_3_B.md`;
- `MarkDown/Batches/BATCH_3_B_DBS.md`.

Blocker/limitation: provider initiation tetap sengaja diblokir sampai provider dipilih.

Next Exact Action: jalankan satu review dua-sumbu.

### CP-07 ? review, staging, commit, post-commit

Verified state:

- satu review dua-sumbu dijalankan: Axis A spec/correctness dan Axis B standards/security;
- kedua axis menemukan P1 yang sama: HMAC/digest semula memakai string hasil `request.text()`, bukan byte wire persis;
- RED test dengan UTF-8 BOM membuktikan callback byte-valid ditolak oleh implementasi lama;
- handler diperbaiki untuk membaca `arrayBuffer()` sekali, memverifikasi HMAC atas timestamp prefix + exact bytes, menghitung digest byte asli, lalu melakukan fatal UTF-8 decode setelah autentikasi;
- satu re-review dua-sumbu selesai tanpa P0/P1;
- signed HTTP-to-DB E2E diulang pada fixture baru setelah fix: 200/200/409/401/401 dan seluruh state database kanonik.

Files changed: shared crypto helper, payment handler/test, generated symbol map, dan checkpoint DBB.

Blocker/limitation: tidak ada P0/P1 terbuka; audit eksternal tetap pending.

Next Exact Action: stage hanya 27 file Batch 3.B secara literal, audit staged diff, commit exact, lalu post-commit audit.

## Finding ? fix ? test

| Finding | Fix | Evidence test |
|---|---|---|
| P0-1 frontend contract tidak konsisten | Hapus field dari draft, payload, mapper, fixture | intake/frontend integration tests |
| P0-2 webhook false-green | Satu RPC transaction boundary dan exact result correlation | handler behavioral suite + SQL runtime + HTTP probe |
| P0-3 SQL runtime palsu | Fixture/mutation/assertion/ACL/replay/rollback nyata | `Tools/corporate_escrow_settlement_runtime.sql` |
| P0-4 handler tests tidak valid | Factory DI terhadap production handler | payment webhook handler suite |
| P1-1 reference collision/leak | `CORP-${orderId}` lowercase | intake replay/reference tests |
| P1-2 unreachable browser branch | Unknown-key contract tunggal | browser-field rejection test |
| P1-3 kode internal bocor | Human-facing sandbox-provider copy | escrow/intake UI tests |

## Mapping implementasi

| Boundary | Artefak |
|---|---|
| PostgreSQL transaction | `public.fn_process_corporate_payment_webhook_atomic` |
| Primitive escrow | `public.fn_lock_corporate_escrow_webhook_atomic` ? `public.fn_lock_corporate_escrow_atomic` |
| Evidence event | `public.provider_webhook_events` |
| Canonical states | `escrow_transactions`, `corporate_service_cases`, `service_orders`, `payment_milestones` |
| External webhook | `supabase/functions/payment-webhook/index.ts` + `handler.ts` |
| Intake reference | `supabase/functions/corporate-intake/handler.ts` |
| Browser projection | phase2 service/hook + `CorporateEscrowCheckoutPanel` |

## Command log ringkas

- `supabase --version` ? 2.109.1.
- PostgreSQL migration compile inside outer transaction ? berhasil, ROLLBACK.
- SQL settlement runtime inside outer transaction ? assertions-complete, 2 funded milestones, ROLLBACK.
- payment webhook + intake + shared webhook ? 44/44; shared crypto/validation ? 7/7.
- escrow UI/hook integration ? 3/3.
- `npm run test:phase2` ? 107/107.
- `npm run typecheck:phase2-tests` ? berhasil.
- `npx tsc -b` ? berhasil.
- `npm run lint` ? berhasil.
- `npm run build` ? berhasil setelah rerun di luar sandbox untuk mengatasi `spawn EPERM` Windows.
- Phase 2 backend forensic static audit ? 7/7; SQL runtime ? berhasil dan ROLLBACK.
- database lint ? tanpa error; satu warning pre-existing di fungsi e-KYC.
- clean disposable migration replay ? seluruh migration applied.
- signed HTTP-to-DB probe ? valid 200, replay 200, conflict 409, invalid/stale signature 401, state DB kanonik.
- clean-candidate symbol map generation/check ? berhasil; generator tests 7/7.
- Percobaan test `.tsx` awal gagal karena Node tidak memuat extension tersebut; loader test terarah ditambahkan dan test production component kemudian berhasil.

## Staged files

Daftar exact candidate yang di-stage secara literal setelah audit:

- `MarkDown/Batches/BATCH_3_B.md`;
- `MarkDown/Batches/BATCH_3_B_DBS.md`;
- `MarkDown/SYMBOLS_MAP.md`;
- `Tools/corporate_escrow_local_webhook_server.mjs`;
- `Tools/corporate_escrow_settlement_runtime.sql`;
- `Tools/corporate_escrow_signed_webhook_probe.mjs`;
- `justifiqa-frontend/package.json`;
- `justifiqa-frontend/src/components/corporate/CorporateEscrowCheckoutPanel.tsx`;
- `justifiqa-frontend/src/components/corporate/CorporateIntakeStepFields.tsx`;
- `justifiqa-frontend/src/hooks/useClientCorporateIntegration.ts`;
- `justifiqa-frontend/src/hooks/useClientCorporateIntegrationFactory.ts`;
- `justifiqa-frontend/src/models/corporateIntake.ts`;
- `justifiqa-frontend/src/services/phase2IntegrationService.ts`;
- `justifiqa-frontend/src/types/database.types.ts`;
- `justifiqa-frontend/test/corporateEscrowIntegration.test.ts`;
- `justifiqa-frontend/test/corporateIntakeIntegration.test.ts`;
- `justifiqa-frontend/test/corporateIntakeModel.test.ts`;
- `justifiqa-frontend/test/intakeIdempotencyConflict.test.ts`;
- `justifiqa-frontend/test/phase2IntegrationService.test.ts`;
- `justifiqa-frontend/test/tsxTestLoader.mjs`;
- `supabase/functions/_shared/crypto.ts`;
- `supabase/functions/corporate-intake/handler.test.ts`;
- `supabase/functions/corporate-intake/handler.ts`;
- `supabase/functions/payment-webhook/handler.test.ts`;
- `supabase/functions/payment-webhook/handler.ts`;
- `supabase/functions/payment-webhook/index.ts`;
- `supabase/migrations/20260813032019_process_corporate_payment_webhook_atomic.sql`.

## Limitations dan blocker

- Provider initiation: `BLOCKED_BY_PROVIDER_SELECTION`.
- Tidak ada provider tertentu, checkout URL, invoice session, QRIS, VA, atau tombol bayar palsu.
- Tidak ada dedicated inbound funding ledger; minimized provider event dan compliance/WORM evidence yang ada dipakai.
- Batch ini bukan persetujuan deployment atau klaim production-ready.

## Hardening Batch 3.B.1

Batch 3.B.1 menutup replay setelah workflow progression, bukti concurrency ke real PostgREST/database disposable, least-privilege ACL provider event, serta konfigurasi HMAC fail-closed. Bukti HTTP lokal menjalankan production handler factory melalui Node wrapper; ini bukan bukti Supabase Deno Edge Runtime. Provider initiation tetap BLOCKED_BY_PROVIDER_SELECTION. Detail faktual ada di MarkDown/Batches/BATCH_3_B_1.md.

## Next Exact Action

Selesaikan review, commit lokal Batch 3.B.1, lalu serahkan kepada external re-audit.
