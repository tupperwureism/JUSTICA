# Batch 3.B.1 — Durable Corporate Payment Webhook Replay

Status kerja: IMPLEMENTASI BERJALAN — external re-audit belum dilakukan.

## Fixed point dan inherited state

- Branch: `batch-3b-corporate-escrow`.
- Fixed point dan required parent: `4cddf6866c50cf410697d330bc528d0daafd99fe`.
- Preflight fisik: branch/HEAD tepat, index kosong, dan tidak ada merge, rebase, cherry-pick, revert, atau sequencer aktif.
- Working tree inherited tetap sangat kotor: 458 tracked dan 33 untracked entry; seluruh pekerjaan di luar allowlist dipertahankan.
- Batch 3.B menyediakan exact-byte HMAC, satu RPC settlement atomik, canonical UI projection, SQL runtime, dan handler-factory HTTP-to-PostgREST probe.

## External findings

1. Replay event `PROCESSED` masih bergantung pada mutable downstream workflow state.
2. Concurrency baru dibuktikan oleh mocked `callRpc`, belum dua request terhadap database disposable nyata.
3. `service_role` masih memiliki direct `INSERT`/`UPDATE` pada `provider_webhook_events` walau tidak ada live dependency yang ditemukan oleh `rg`.
4. Secret/skew config belum memiliki batas fail-closed yang terkunci.
5. Local RPC harness belum mengirim header `apikey`.
6. HTTP probe menjalankan production handler factory melalui Node wrapper, bukan Deno Edge index/runtime.

## Checkpoints

### CP-00 — preflight, provenance, authoritative reading

Verified state:

- hard preflight cocok persis;
- committed migration lama tidak akan diedit;
- source-of-truth menunjukkan case transition RPC `fn_transition_corporate_service_case` mendukung `ESCROW_LOCKED → IDENTITY_PENDING`;
- tidak ditemukan dedicated milestone-transition RPC; status-only transition tetap melewati constraint dan immutable-terms trigger;
- tidak ditemukan live direct DML dependency pada `provider_webhook_events` di luar migration/test runtime.

Files intentionally changed: dokumen checkpoint ini saja.

Unresolved blocker/limitation: Supabase Edge Runtime lokal belum diuji pada batch ini; maksimal satu percobaan di CP-04.

Next Exact Action: tulis RED tests untuk replay-after-progression, real concurrency contract, ACL, HMAC config, dan header `apikey`.

### CP-01 — RED tests

Verified state:

- handler tests menghasilkan RED yang tepat: secret di bawah 32 byte, di atas 4096 byte, dan skew invalid masih diterima (22 pass, 2 fail);
- import test harness menghasilkan RED karena module membaca environment saat import dan belum menyediakan injectable PostgREST caller;
- migration fixed-point berhasil direplay pada database disposable setelah platform prerequisite schema disiapkan;
- runtime ACL menghasilkan RED PROVIDER_WEBHOOK_EVENT_SERVICE_ROLE_ACL_INVALID;
- setelah ACL intent diterapkan hanya pada database disposable, replay pasca-transisi case IDENTITY_PENDING dan milestone RELEASABLE menghasilkan RED CORPORATE_ESCROW_LOCK_CASE_STAGE_INVALID.

Files intentionally changed:

- supabase/functions/payment-webhook/handler.test.ts;
- Tools/corporate_escrow_settlement_runtime.sql;
- dokumen checkpoint ini.

Unresolved blocker/limitation: startup otomatis stack disposable macet sebelum container database berjalan; verifikasi dilanjutkan secara terisolasi dengan database container disposable dan platform prerequisite schema tanpa menyentuh instance utama.

Next Exact Action: buat tepat satu migration roll-forward melalui Supabase CLI dan implementasikan durable replay serta least-privilege ACL.

### CP-02 — roll-forward migration dan SQL regression

Verified state:

- CLI membuat tepat satu roll-forward 20260813064656_preserve_corporate_payment_webhook_replay.sql;
- RPC signature tetap, processed replay mengunci event, memverifikasi immutable identity dan persistent order/case/escrow/amount/reference binding, lalu short-circuit zero-write;
- original settlement receipt memakai funded_at evidence, bukan mutable milestone status;
- service_role hanya memiliki SELECT tabel dan EXECUTE RPC; mutation tabel langsung ditolak;
- SQL runtime nyata lulus sampai ROLLBACK, termasuk IDENTITY_PENDING, RELEASABLE, replay event ID sama, processed_at tetap, mutated replay, zero partial write, dan ACL.

Files intentionally changed:

- supabase/migrations/20260813064656_preserve_corporate_payment_webhook_replay.sql;
- Tools/corporate_escrow_settlement_runtime.sql;
- dokumen checkpoint ini.

Unresolved blocker/limitation: dedicated inbound funding ledger tetap tidak tersedia; evidence memakai provider_webhook_events dan bukti existing.

Next Exact Action: harden handler secret/skew dan koreksi local PostgREST harness.

### CP-03 — handler configuration dan harness

Verified state:

- secret wajib 32..4096 UTF-8 bytes; floor ini bukan bukti entropy;
- skew default 300 hanya saat unset, konfigurasi lain wajib integer literal 1..900;
- seluruh config invalid mengembalikan 500 SERVER_MISCONFIGURED tanpa database mutation;
- PostgREST caller injectable mengirim Bearer dan apikey tanpa membaca environment saat import;
- handler behavioral suite lulus 25/25.

Files intentionally changed:

- supabase/functions/payment-webhook/handler.ts;
- supabase/functions/payment-webhook/handler.test.ts;
- Tools/corporate_escrow_local_webhook_server.mjs;
- Tools/corporate_escrow_signed_webhook_probe.mjs;
- dokumen checkpoint ini.

Unresolved blocker/limitation: handler-factory wrapper bukan Deno Edge Runtime.

Next Exact Action: jalankan dua signed HTTP request concurrent ke real PostgREST/database disposable.

### CP-04 — real concurrent HTTP-to-database

Verified state:

- dua signed request dikirim bersamaan melalui Promise.all ke production handler factory, local Node HTTP wrapper, real PostgREST, dan RPC database disposable;
- response HTTP 200/200 dengan replayed false/true dan event ID sama a4e16e07-30f4-43c4-af9a-6c89525a1aa4;
- database: satu provider event PROCESSED, order ACTIVE, case ESCROW_LOCKED, escrow HELD_IN_ESCROW, dua milestone FUNDED, dua fee line tanpa duplikasi;
- sequential identical replay 200; mutated replay 409; invalid dan stale signature masing-masing 401.

Files intentionally changed:

- Tools/corporate_escrow_signed_webhook_probe.mjs;
- dokumen checkpoint ini.

Unresolved blocker/limitation: bukti ini menjalankan production handler factory, bukan payment-webhook/index.ts atau Supabase Deno Edge Runtime.

Next Exact Action: lakukan satu percobaan Edge Runtime bounded, lalu jalankan seluruh gate CP-05.

### CP-05 — full verification dan generated artifacts

Verified state:

- satu percobaan bounded Supabase Edge Runtime berhenti karena timeout pada setup Windows tanpa bukti request dieksekusi; proses lokal yang tertinggal dihentikan berdasarkan PID yang diverifikasi dan percobaan tidak diulang;
- clean disposable replay menerapkan seluruh 32 migration, termasuk migration Batch 3.B.1;
- transactional settlement runtime lulus hingga assertions-complete lalu ROLLBACK, termasuk progression ESCROW_LOCKED → IDENTITY_PENDING dan milestone FUNDED → RELEASABLE;
- signed HTTP probe nyata menghasilkan concurrent 200/200, replay distribution false/true, event ID sama, satu provider event, dua milestone, dua fee line, serta state order ACTIVE, case ESCROW_LOCKED, escrow HELD_IN_ESCROW, event PROCESSED;
- sequential replay 200, mutated replay 409, invalid signature 401, dan stale signature 401;
- handler/intake/shared Deno suite 54/54; Phase 2 test 107/107; backend forensic static 7/7; symbol-map library 7/7;
- typecheck Phase 2, TypeScript build, lint, production build, backend forensic SQL runtime, database lint, dan database advisors selesai tanpa error;
- holistic forensic audit 16/17; satu kegagalan berada pada dirty user file out-of-scope CorporateCaseTrackerPanel.tsx dan tidak diubah atau di-stage;
- database lint memiliki satu warning pre-existing pada fungsi e-KYC; advisor total 138 baseline warning dengan 0 temuan relevan Batch 3.B.1;
- mechanical database type generation tidak menghasilkan semantic/schema diff; database.types.ts tidak menjadi kandidat;
- SYMBOLS_MAP diregenerasi dari clean candidate fixed point + file Batch 3.B.1; check berhasil dan SQL_SECURITY_SYMBOLS tidak berubah.

Actual command/result ringkas:

- Deno handler/intake/shared tests: 54/54;
- npm run test:phase2: 107/107;
- npm run typecheck:phase2-tests: berhasil;
- npx tsc -b: berhasil;
- npm run lint: berhasil, nol warning baru;
- npm run build: berhasil setelah satu rerun identik di luar sandbox untuk spawn EPERM;
- node --test --test-isolation=none Tools/phase2_backend_forensic_audit.test.mjs: 7/7;
- Tools/phase2_backend_forensic_runtime.sql: berhasil, ROLLBACK;
- Tools/corporate_escrow_settlement_runtime.sql: assertions-complete, ROLLBACK;
- supabase db lint --local --schema public --level warning --fail-on error: exit 0;
- supabase db advisors --local --type all --level warn --fail-on error: exit 0;
- node Tools/generate_symbol_map.mjs dan --check: berhasil pada clean candidate;
- node --test --test-isolation=none Tools/symbol_map_lib.test.mjs: 7/7;
- git diff --check: dijalankan lagi setelah dokumentasi final.

Files intentionally changed:

- MarkDown/SYMBOLS_MAP.md;
- MarkDown/Batches/BATCH_3_B.md;
- MarkDown/Batches/BATCH_3_B_1.md;
- MarkDown/Batches/BATCH_3_B_1_DBS.md;
- seluruh implementation/runtime file yang sudah dicatat CP-02 sampai CP-04.

Unresolved blocker/limitation: handler-to-real-database terverifikasi, tetapi Supabase Deno Edge index/config/runtime tidak terverifikasi pada environment ini.

Next Exact Action: jalankan satu review dua-sumbu, perbaiki seluruh P0/P1, audit diff, stage literal, commit, dan post-commit audit.

### CP-06 — review, staging, commit, post-commit

Verified state:

- review Axis A spec/correctness tidak menemukan P0/P1/P2;
- review Axis B standards/security menemukan satu P1: nullable escrow binding memakai SQL <> sehingga NULL dapat melewati penolakan;
- RED database nyata memakai consultation escrow valid dengan booking_id terisi dan corporate_case_id=NULL; RPC lama salah menerima replay sampai assertion EXPECTED_SETTLEMENT_REJECTION gagal;
- fix memakai IS DISTINCT FROM; GREEN runtime menghasilkan assertions-complete, event tunggal, funded milestone count 2, lalu ROLLBACK;
- re-review tunggal memastikan P1 teratasi dan tidak menemukan P0/P1 baru; satu P2 karakter kontrol dokumentasi diperbaiki sebelum staging.

Files intentionally changed:

- supabase/migrations/20260813064656_preserve_corporate_payment_webhook_replay.sql;
- Tools/corporate_escrow_settlement_runtime.sql;
- dokumen checkpoint ini.

Unresolved blocker/limitation: external audit tetap terpisah; executor tidak menyatakan PASS.

Next Exact Action: stage literal, audit staged diff, commit exact, dan post-commit audit.

## Finding → fix → behavioral test

| Finding | Fix | Behavioral evidence |
|---|---|---|
| Replay bergantung pada mutable state | Short-circuit PROCESSED setelah immutable identity dan persistent binding verification | SQL replay sesudah case IDENTITY_PENDING dan milestone RELEASABLE, event ID/processed_at tetap |
| Mock-only concurrency | Dua signed HTTP request simultan ke handler factory dan real RPC | 200/200, replay false/true, event ID sama, satu row event |
| Direct service-role DML terlalu luas | Revoke INSERT/UPDATE/DELETE dan privilege mutation lain; pertahankan SELECT + RPC EXECUTE | ACL runtime menolak direct DML tetapi RPC service_role tetap memutasi |
| Secret/skew permissive | Secret 32..4096 UTF-8 byte dan configured skew integer 1..900 fail-closed | Handler boundary tests dan zero database call |
| RPC harness kurang apikey | Kirim Authorization Bearer dan apikey | Header behavioral test dan real PostgREST run |
| Edge Runtime claim terlalu luas | Bedakan handler-factory HTTP proof dari Deno Edge Runtime | Bounded attempt dicatat gagal tanpa false-green |
| Nullable escrow binding dapat melewati check | Gunakan IS DISTINCT FROM untuk menolak corporate_case_id NULL | RED/GREEN consultation escrow fixture dan zero-write assertion |

## Committed-file candidate list

- MarkDown/Batches/BATCH_3_B.md
- MarkDown/Batches/BATCH_3_B_1.md
- MarkDown/Batches/BATCH_3_B_1_DBS.md
- MarkDown/SYMBOLS_MAP.md
- Tools/corporate_escrow_local_webhook_server.mjs
- Tools/corporate_escrow_settlement_runtime.sql
- Tools/corporate_escrow_signed_webhook_probe.mjs
- supabase/functions/payment-webhook/handler.ts
- supabase/functions/payment-webhook/handler.test.ts
- supabase/migrations/20260813064656_preserve_corporate_payment_webhook_replay.sql

## Limitations dan blocker

- Provider initiation tetap BLOCKED_BY_PROVIDER_SELECTION.
- Tidak ada provider, checkout URL, QRIS/VA/session dummy, browser webhook invocation, deployment, atau remote migration.
- HTTP-to-database proof menjalankan production handler factory melalui Node wrapper dan real PostgREST/database disposable; ini bukan full Deno Edge Runtime E2E.
- Tidak ada dedicated inbound funding ledger; provider_webhook_events dan evidence existing tetap menjadi receipt evidence.
- Holistic audit tunggal yang gagal menyentuh dirty user file out-of-scope dan tidak menjadi bagian kandidat commit.
- Warning lint/advisor database yang dicatat bersifat pre-existing dan tidak relevan ke objek Batch 3.B.1.
- External audit tetap terpisah; status executor tidak pernah PASS atau production-ready.

## Next Exact Action

Jalankan CP-06: review dua-sumbu, audit staged candidate secara literal, commit exact, dan post-commit audit.
