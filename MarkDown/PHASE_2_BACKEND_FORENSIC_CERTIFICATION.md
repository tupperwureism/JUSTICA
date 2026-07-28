# Phase 2 Backend PostgreSQL Forensic Certification

**Tanggal audit:** 28 Juli 2026
**Scope:** PostgreSQL Phase 2 (`20260722000016`–`20260722000024`) beserta roll-forward hardening `20260728000025`
**Putusan:** **CERTIFIED — SIAP UNTUK FASE INTEGRASI**

Sertifikasi ini menyatakan fondasi PostgreSQL siap dikabelkan ke boundary/service
Frontend–Backend. Sertifikasi ini **bukan** production go-live approval dan tidak
menggantikan provider-live certification, WAF/rate-limit, backup/restore drill,
legal sign-off, atau replay seluruh migration chain dari database kosong.

## Temuan dan remediasi

| ID | Temuan terkonfirmasi | Risiko | Remediasi |
|---|---|---|---|
| F-01 | Envelope dapat diikat ke escrow yang belum `HELD_IN_ESCROW` atau timestamp historis hasil tebakan | Aktivasi e-KYC prematur dan deadline palsu | Timestamp lock otoritatif + provenance flag + trigger binding scope/status/deadline `ENABLE ALWAYS` |
| F-02 | RPC Corporate Intake parsial tidak membuat parties/fee/milestone/order dalam satu command | Partial write dan pelanggaran AD01-03 | RPC kanonik `fn_create_corporate_intake_complete_atomic` dengan advisory mutex dan digest idempoten |
| F-03 | Assignment Notaris tidak bergantung pada escrow held/verified registry | Workspace terbuka sebelum pembayaran | Trigger assignment memeriksa escrow held dan `fn_is_verified_advocate` |
| F-04 | Rejected government job dapat melompat langsung ke approved | Bypass rejection loop | State guard `DRAFT → SUBMITTED → REJECTED/APPROVED`; terminal immutable |
| F-05 | Dua payout silang mengunci wallet Client lalu Advocate tanpa urutan global | Deadlock wallet A↔B | Semua wallet dikunci berdasarkan `wallet_id` terurut setelah escrow lock |
| F-06 | Ledger payout WORM belum `ENABLE ALWAYS`; ACL lama terlalu lebar | Mutasi bukti finansial/least-privilege failure | FORCE RLS, trigger ALWAYS, policy authenticated-only, revoke DML berlebih |
| F-07 | Webhook event dan payout idempotency key dapat dihapus/ditulis ulang oleh service role | Replay/double-settlement evidence loss | Append-only identity + terminal-state triggers dan ACL minimum |
| F-08 | Dua anchor constraint masih `NOT VALID` | Historical row tidak ikut tervalidasi | `VALIDATE CONSTRAINT` untuk corporate dan PSrE anchors |
| F-09 | Helper trigger serta helper privileged audit/wallet/refund/verified-advocate masih mewarisi EXECUTE atau `pg_temp` search path | Permukaan ACL/name resolution dan temporary-schema shadowing | Empty fixed search path; trigger helper EXECUTE owner-only; katalog seluruh `SECURITY DEFINER` bersih |
| F-10 | `database.types.ts` stale terhadap aggregate escrow/e-KYC terbaru | Wiring frontend memakai nullability/RPC salah | Regenerasi langsung dari PostgreSQL Meta lokal setelah migrasi |

## Bukti rekonsiliasi himpunan dua arah

Untuk scope PostgreSQL, himpunan kewajiban normatif:

`S_AD-P2-DB = {atomic intake, held-escrow notary gate, webhook mutex,
government rejection loop, WORM anchor/payout, envelope–escrow scope, exact
7-day deadline, liveness counter, ambiguous/manual review, illegal/3x/TTL global
halt, idempotent full refund, zero raw biometric, RLS, fixed search path,
restricted SECURITY DEFINER ACL}`.

Himpunan kontrol efektif setelah migrasi:

`S_IMPLEMENTED = {complete intake RPC, notary guard, event+escrow locks,
government transition guard, ALWAYS WORM triggers, binding trigger,
funds_locked_at + 7 days, capped ordinal attempts, manual-review enum/path,
global-halt RPC, unique replay evidence + wallet/ledger refund, metadata-only
schema, FORCE RLS, empty fixed proconfig, facade/server-only proacl}`.

Hasil:

- `S_AD-P2-DB − S_IMPLEMENTED = ∅`
- `S_IMPLEMENTED − S_AD-P2-DB = ∅` untuk kontrol domain; kolom/trigger hardening
  tambahan adalah mekanisme implementasi dari elemen yang sama, bukan perilaku
  bisnis baru.

## MATRIKS VERIFIKASI FORENSIK EAGLE-EYE (360-DEGREE TRACEABILITY PROOF)

| Upstream Source / Specification | Downstream Target / Component | Physical Line / Location Proof | Verification Status | Notes |
|---|---|---|:---:|---|
| AD01-01 | Complete intake command | `...00025`: `fn_create_corporate_intake_complete_atomic`, L523 | COMPLETE | Payload allow-list dan digest idempoten |
| AD01-02 | Server validation | `...00023` BO validation + `...00025` party/financial validation | COMPLETE | Invalid array/field/total menggagalkan seluruh transaksi |
| AD01-03 | Order, fees, milestones, case, parties, BO, escrow | `...00025` L523–850 | COMPLETE | Satu SECURITY DEFINER transaction + advisory mutex |
| AD01-04 | Versioned quote | `service_orders.accepted_quote_version`; fee/milestone `quote_version` | COMPLETE | Quote v1 diterima atomik sebelum `PAYMENT_PENDING` |
| AD01-05 | Webhook/event/escrow mutex | `...00019`: `fn_webhook_settle_escrow_mutex`; `...00024`: corporate wrapper | COMPLETE | Event dan escrow di-row-lock; amount/order/signature diverifikasi |
| AD01-06 | Escrow locked before assignment | `...00025`: escrow guard L28; notary guard L217 | COMPLETE | `funds_locked_at` immutable dan professional harus verified |
| AD01-07 | Notary review gate | `corporate_service_cases` state machine + assignment guard | COMPLETE | DRAFT/CANCELLED tidak dapat menerima Notaris |
| AD01-08 | Customer revision loop | `...00023`: `fn_transition_corporate_service_case` | COMPLETE | Expected-state row lock mencegah lost update |
| AD01-09 | Authorized government submission | `government_submission_jobs` FK/identity guard | COMPLETE | Notary, target, digest, idempotency immutable |
| AD01-10 | `REJECTED → new DRAFT → SUBMITTED` | `...00025`: government transition guard L261 | COMPLETE | Rejected row terminal; revisi harus job baru |
| AD01-11 | Reconciliation/compliance hold | `...00023`: absorbing `COMPLIANCE_HOLD` | COMPLETE | Payout progression tidak dapat keluar dari hold |
| AD01-12 | Final document WORM | `document_integrity_anchors` WORM + validated constraints | COMPLETE | Trigger ALWAYS; browser insert ditutup |
| AD01-13 | Payout intent/result/idempotency | payout key guard + escrow ledger WORM | COMPLETE | Identity/terminal immutable; wallet lock order deterministik |
| AD01-14 | Authorized projection | participant RLS + generated database types | COMPLETE | No cross-tenant row in runtime RLS probe |
| AD02-01 | Envelope and parties aggregate | `signing_envelopes`, `signing_envelope_parties` | COMPLETE | Polymorphic case guard and immutable party identity |
| AD02-02 | Escrow checkout | `escrow_transactions` exact-one-scope constraint | COMPLETE | Consultation/corporate scope mutually exclusive |
| AD02-03 | Held escrow and exact window | `...00025`: binding guard L126 | COMPLETE | `expires_at = funds_locked_at + 7 days` |
| AD02-04 | Parties remain under global aggregate | envelope global status + party FK pair | COMPLETE | Cross-envelope party reference rejected |
| AD02-05 | Active-envelope event processing | `...00024`: callback RPC L65 | COMPLETE | Envelope row locked before callback mutation |
| AD02-06 | Party/user/digest scope | callback RPC party/user/role checks | COMPLETE | Mismatched party/user/provider evidence rejected |
| AD02-07 | Zero raw biometric | metadata-only columns + static no-`BYTEA` scan | COMPLETE | KTP/selfie/video/template/provider raw payload absent |
| AD02-08 | Anti-replay callback persistence | unique provider reference + idempotency conflict checks | COMPLETE | Replayed payload must be byte-semantically equal |
| AD02-09 | Illegal confirmation | `fn_confirm_party_illegal_atomic` + WORM confirmation event | COMPLETE | Generic rejection alone cannot trigger illegal halt |
| AD02-10 | Liveness ordinal | `liveness_attempt_count 0..3` + unique attempt index | COMPLETE | Only `LIVENESS_FAILED` increments |
| AD02-11 | Ambiguous/manual review | `REQUIRES_MANUAL_REVIEW` transition guard | COMPLETE | Ambiguous OCR/device result is not irreversible rejection |
| AD02-12 | Third failure global halt | callback + `fn_global_halt_ekyc_and_refund_atomic` | COMPLETE | Exactly attempt 3 required |
| AD02-13 | Passed projection | canonical `PASSED`; GREEN remains UI-only | COMPLETE | Database enum matches AD terminology |
| AD02-14 | Aggregate recheck | envelope lock serializes every callback/halt | COMPLETE | Party update uses NOWAIT retry against global transition |
| AD02-15 | TTL global halt | cron every five minutes + same global-halt RPC | COMPLETE | Database time and locked `expires_at` decide expiry |
| AD02-16 | Success leaves escrow held | callback PASSED path does not mutate escrow | COMPLETE | No e-KYC-success payout side effect |
| AD02-17 | Full idempotent refund | global-halt RPC + wallet mutex + WORM ledger | COMPLETE | Runtime replay credited exactly once |
| RLS | All 17 Phase 2/financial tables | catalog query `relrowsecurity` + `relforcerowsecurity` | COMPLETE | `0` missing/disabled |
| SECURITY DEFINER | All Phase 2 privileged functions | catalog `proconfig`/`proacl` audit | COMPLETE | Only deliberate public/auth facades executable client-side |
| WORM | Compliance events, anchors, payout ledger | catalog `tgenabled = A` | COMPLETE | `0` critical trigger not ALWAYS |

**Matrix result:** `0 omissions / 0 discrepancies` for the PostgreSQL Phase 2
integration scope.

## Verification record

| Verification | Result |
|---|---|
| New static forensic suite | PASS — 7/7 |
| Existing Phase 2 database assertions | PASS — all database-focused assertions |
| Runtime SQL transaction suite | PASS — finishes with `ROLLBACK` |
| e-KYC illegal callback replay | PASS — same verification replayed, one refund credit/ledger |
| RLS owner vs foreign tenant | PASS — owner 1 row, foreign tenant 0 rows |
| Catalog RLS/FORCE violations | 0 |
| Catalog critical trigger-not-ALWAYS violations | 0 |
| Catalog unvalidated anchor constraints | 0 |
| Catalog internal helper ACL leaks | 0 |
| Catalog mutable/missing helper search paths | 0 |
| Symbol map generation/check | PASS |
| TypeScript + Vite production build | PASS |

Catatan kejujuran: full holistic test juga membaca komponen frontend pengguna dan
tetap memiliki satu kegagalan out-of-scope berupa hardcoded red palette pada
`CorporateCaseTrackerPanel.tsx`. Kegagalan tersebut sudah ada sebelum batch
database ini dan tidak dipakai untuk menutupi atau menurunkan gate backend.

## Certification stamp

> **BACKEND POSTGRESQL PHASE 2 — CERTIFIED READY FOR INTEGRATION**
>
> Seluruh discrepancy PostgreSQL yang ditemukan dalam audit ini telah
> diremediasi dan dibuktikan secara statis, melalui katalog aktual, serta
> melalui transaksi runtime rollback. Production go-live tetap memerlukan gate
> operasional eksternal yang dinyatakan di awal dokumen.
