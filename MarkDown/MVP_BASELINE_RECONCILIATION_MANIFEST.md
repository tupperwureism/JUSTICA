# MVP Baseline Manifest & Discrepancy Reconciliation Log

**Audit snapshot:** 22 Juli 2026 (WIB)
**Baseline candidate:** `41cb5c27ee86754d8d92f14b5ca91d7c315ee3ae` (`41cb5c2`)
**Disposition:** `CLOSED — CERTIFIED READY FOR PHASE 2 EXPANSION`

Dokumen ini membedakan kontrak target, artefak migrasi lokal, implementasi frontend, dan bukti deployment. Istilah “hidup” di bawah berarti **didefinisikan dalam migration chain lokal**; tidak ada introspeksi database production yang menjadi dasar audit ini.

## 1. RECONCILED RPC MUTEX ENDPOINTS (Luruskan Nomenklatur)

| Nama kontrak | Status fisik | Fungsi utama | Keputusan nomenklatur |
|---|---|---|---|
| `fn_book_consultation_slot_mutex` | **Ada dan kanonik.** Migration roll-forward [`20260722000016_p2_b3_service_orders_expand_only.sql`](../supabase/migrations/20260722000016_p2_b3_service_orders_expand_only.sql) mengganti primitive internal lama dengan kontrak checkout `(UUID, TEXT, VARCHAR)`, mencabut akses default, dan memberi `EXECUTE` hanya kepada `authenticated`. | Mengunci row slot dan wallet dengan `SELECT ... FOR UPDATE`, memastikan slot valid, lalu membuat `booking_sessions` dan `escrow_transactions` secara atomik. | **Satu-satunya endpoint checkout frontend.** Caller dan generated types memakai nama/signature yang sama. |
| `fn_release_escrow_to_advocate_mutex` | **Ada dan tracked.** Definisi efektif terakhir berada pada [`20260721000013_add_realtime_room_and_client_release.sql`](../supabase/migrations/20260721000013_add_realtime_room_and_client_release.sql). | Mengunci escrow dan wallet, memverifikasi kepemilikan klien serta deliverable `STAMPED_SIGNED`, memindahkan held balance ke wallet advokat, mencatat ledger, dan menyelesaikan booking. | **Valid.** |
| `fn_refund_escrow_to_client_mutex` | **Ada dan tracked.** Definisi koreksi berada pada migration `...00011`, yang lolos replay database kosong. | Mengunci escrow, mengkredit wallet klien melalui mutex wallet, mencatat payout ledger, lalu mengubah status menjadi `REFUNDED_TO_CLIENT`. | **Valid dan frozen.** |
| `fn_is_verified_advocate` | **Ada dan tracked.** Didefinisikan oleh [`20260721000015_harden_verified_advocate_rls_helper.sql`](../supabase/migrations/20260721000015_harden_verified_advocate_rls_helper.sql). | Helper `SECURITY DEFINER` untuk membatasi policy read advokat hanya pada akun dengan `kyc_status = 'VERIFIED'`. | **Valid dan termuat dalam generated database types.** |

### Nama lama/nonkanonik

`fn_client_checkout_consultation_mutex` hanya tersisa sebagai **migration history** pada `...00012`. Migration roll-forward `...00016` menghapus fungsi dan grant tersebut. Katalog hasil replay tidak memuat nama legacy, dan pencarian di `justifiqa-frontend/src` menghasilkan nol caller.

## 2. REALITY-BOUND CAPABILITY CLASSIFICATION (Klasifikasi Jujur Kapabilitas)

| Kapabilitas | Klasifikasi implementasi lokal saat ini | Batas yang terbukti | Syarat Go-Live produksi |
|---|---|---|---|
| WORM Vault | **Database-Level Tamper-Evident Trigger** (`fn_prevent_worm_mutation`) | Trigger `BEFORE UPDATE OR DELETE`, `ENABLE ALWAYS TRIGGER`, dan hash-chain audit meningkatkan deteksi/perlawanan terhadap mutasi pada jalur aplikasi. Ini **bukan True WORM** karena administrator/owner database tetap berada dalam trust boundary yang sama. | Phase 3: replikasi objek dan bukti hash ke **AWS S3 Object Lock — Compliance Mode** dengan retention policy independen, legal hold, versioning, lifecycle, least-privilege IAM, reconciliation, dan restore/integrity drill. |
| e-Meterai PERURI SHA-256 | **Schema & RLS Contract Ready** (`emeterai_stamping_logs`) | Tabel, unique serial, indeks hash SHA-256, foreign key, RLS, dan mutation trigger tersedia. Tidak ditemukan bukti panggilan provider bercredential, signed response, retry/idempotency, reconciliation, webhook verification, atau acceptance test sandbox/production. | Phase 2/3: integrasi API live sandbox lalu production **PERURI atau Mekari Sign**, secret management, signature/webhook verification, idempotency key, retry/DLQ, reconciliation, audit evidence, dan negative-path tests. |
| Portal Verifikasi Publik (`MOCK-J-PUBLIC-VERIFY`) | **SHA-256 Client + Minimal Public RPC Implemented** | Browser menghitung digest dari byte PDF melalui Web Crypto; frontend memanggil `fn_verify_public_legal_document`; akses tabel publik `USING (true)` dicabut; `anon` hanya memperoleh `EXECUTE` pada proyeksi allow-list. Transaction test membuktikan hasil tidak memuat NIK, KTP, biometrik, kontak, storage path, BO/CDD, atau STR. | **Siap untuk ekspansi Phase 2, belum diklaim production go-live.** Rate limit gateway/WAF, QR deep-link, domain production, provider live, dan observability abuse tetap gate deployment. |

Koreksi eksplisit: page dan alur verifikasi lokal/backend telah dibangun. Yang belum disertifikasi adalah **deployment production `verify.justica.id` dan kontrol operasional go-live**, bukan implementasi baseline.

## 3. FROZEN MVP CONTRACT SUMMARY

| Item baseline | Bukti fisik | Status freeze |
|---|---|---|
| Git baseline terakhir | `41cb5c27ee86754d8d92f14b5ca91d7c315ee3ae`, 21 Juli 2026 14:10:23 +07:00, `feat(int-4): wire real-time consultation room chat channels and worm vault legal opinion delivery` | **Baseline candidate**, bukan final frozen tag. Working tree mengandung perubahan lain yang tidak termasuk commit ini. |
| BATCH INT-1 | Commit `3ff001b`: Supabase client, environment contract, dan generated DB types awal. | **Tracked.** |
| BATCH INT-2 | Commit `7a216bd`: GoTrue auth, role routing, dan session integration. | **Tracked.** |
| BATCH INT-3 | Commit `6c1400e`: consultation checkout ke RPC mutex dan live slots. | **Tracked dan direkonsiliasi:** caller kini memakai `fn_book_consultation_slot_mutex`. |
| BATCH INT-4 | Commit `41cb5c2`: Realtime consultation room dan vault delivery. | **Tracked.** |
| Schema lokal | Migration domain `20260715000001` s.d. `20260722000016`, termasuk `...00010`, `...00011`, dan seam P2-B3 `...00016`. | **Reproducibly frozen:** `npx supabase db reset --local --no-seed` sukses dari database kosong. |
| Generated database types | [`database.types.ts`](../justifiqa-frontend/src/types/database.types.ts) dihasilkan dari database lokal pasca-replay. | **Sinkron:** memuat `service_orders`, `service_fee_lines`, `payment_milestones`, RPC kanonik, verifier publik, `fn_is_verified_advocate`, dan release mutex; nama legacy tidak ada. |
| Frontend static verification | `npx tsc -b --pretty false`, `npx oxlint`, dan `npx vite build`. | **PASS:** TypeScript 0 error, oxlint exit 0, Vite production build sukses. Build hanya melaporkan warning ukuran chunk yang tidak memblokir. |
| Database migration replay/regression | Replay database kosong, `supabase db lint --local --level warning`, verifikasi katalog grant/RLS, serta transaction test proyeksi publik dan rekonsiliasi finansial. | **PASS:** tidak ada schema error; negative tests menolak mismatch total dan mutasi fee accepted. |

Kontrak arsitektur rujukan tetap berada pada [`DATABASE_DDL_AND_RLS_MIGRATIONS_SPECIFICATION.md`](./DATABASE_DDL_AND_RLS_MIGRATIONS_SPECIFICATION.md), [`BCE_SEAM_ARCHITECTURAL_STANDARD.md`](./BCE_SEAM_ARCHITECTURAL_STANDARD.md), [`MOCK-J-FRONTEND-STANDARD.md`](../MOCK-J-FRONTEND-STANDARD.md), dan [`POST_MVP_SDLC_PONYTAIL_BLUEPRINT.md`](./POST_MVP_SDLC_PONYTAIL_BLUEPRINT.md). Manifest ini tidak menggandakan spesifikasi tersebut.

## 4. PHASE 2 ADMISSION PREPARATION

### Exit gate yang wajib ditutup

| ID | Discrepancy | Bukti penutupan minimum | Status |
|---|---|---|---|
| `BASE-01` | Nama RPC checkout target berbeda dari migration, caller frontend, dan generated types. | Roll-forward `...00016`; katalog/caller/types konsisten; nama lama hanya ada pada migration history dan perintah retirement. | **CLOSED (`CERTIFIED READY FOR PHASE 2 EXPANSION`)** |
| `BASE-02` | Migration `...00010` dan `...00011` belum tracked, sehingga commit baseline tidak dapat mereproduksi state yang didokumentasikan. | Kedua migration masuk scope commit Kampanye 1 dan replay database kosong sukses. | **CLOSED (`CERTIFIED READY FOR PHASE 2 EXPANSION`)** |
| `BASE-03` | Generated DB types tidak sama dengan migration terakhir. | Types diregenerasi dari database pasca-replay dan cocok dengan output generator; seluruh RPC wajib termuat. | **CLOSED (`CERTIFIED READY FOR PHASE 2 EXPANSION`)** |
| `BASE-04` | Portal verifier adalah UI mock, bukan verifier berbasis digest/backend nyata. | Web Crypto SHA-256 byte PDF; validasi input; RPC proyeksi minimum; public table read dicabut; state match/not-found/error; transaction security test. | **CLOSED (`CERTIFIED READY FOR PHASE 2 EXPANSION`)** |

**Keputusan admission:** seluruh blocker baseline telah ditutup dengan bukti runnable. Kampanye P2-B0 + P2-B3 **lulus gerbang ekspansi Phase 2**. Sertifikasi ini tidak menggantikan gate deployment production, provider live, WAF/rate limit, atau legal/compliance sign-off.

**SERTIFIKASI RESMI:** “Fondasi dokumentasi MVP telah 100% lurus, terverifikasi fisik, seluruh kontrak BATCH INT-1 s.d. INT-4 dibekukan pada baseline reproducible, dan sistem **CERTIFIED READY FOR PHASE 2 EXPANSION** melalui gerbang `P2.0 Feature Admission Protocol`.”

## 5. MATRIKS VERIFIKASI FORENSIK EAGLE-EYE (360-DEGREE TRACEABILITY PROOF)

| Upstream Source / Specification | Downstream Target / Component | Physical Line / Location Proof | Verification Status | Notes / Discrepancy Found |
|---|---|---|:---:|---|
| `BASE-01` / RPC kanonik | Migration `...00016`, `consultationService.ts`, generated types | `fn_book_consultation_slot_mutex(UUID,TEXT,VARCHAR)` | **COMPLETE** | Katalog berisi satu signature checkout; legacy tidak ada. |
| `BASE-02` / tracking + replay | Migration `...00010`, `...00011` | `supabase/migrations/`; replay `...00001`–`...00016` | **COMPLETE** | Fresh reset selesai tanpa migration error. |
| `BASE-03` / schema-type equality | `database.types.ts` | Tables + `Functions` generated section | **COMPLETE** | Output generator pasca-replay menjadi sumber file. |
| `BASE-04` / actual PDF digest | `usePublicVerifier.ts` | `crypto.subtle.digest('SHA-256', file.arrayBuffer())` | **COMPLETE** | Tidak ada prefix/hash mock di frontend source. |
| Bab 2.4 / minimal public data | `fn_verify_public_legal_document` | Return projection + explicit grant | **COMPLETE** | `anon` tidak punya table SELECT; RPC tidak mengembalikan PII/biometrik/internal UUID ownership/path. |
| Bab 2.2 / `service_orders` | Migration `...00016` | Table, FK, checks, indexes, RLS/FORCE RLS | **COMPLETE** | Tiga service types awal; optional origin booking. |
| Bab 2.2 / `service_fee_lines` | Migration `...00016` | Fee types, quote version, accepted immutability | **COMPLETE** | Accepted rows tidak dapat diubah/dihapus. |
| Bab 2.2 / `payment_milestones` | Migration `...00016` | Milestone types, evidence/refund terms, deferred reconciliation | **COMPLETE** | Total/currency wajib sama dengan accepted fee lines. |
| Zero regression MVP | `booking_sessions`, `escrow_transactions` | Migration `...00016` tidak mengubah struktur/policy tabel | **COMPLETE** | Hanya direferensikan FK/RPC; release mutex tetap ada. |
| Compiler/syntax gate | Supabase replay/lint; tsc; oxlint; Vite | Perintah sertifikasi Kampanye 1 | **COMPLETE** | 0 schema error, 0 TS error, lint exit 0, build sukses. |

```text
S_required = {BASE-01, BASE-02, BASE-03, BASE-04,
              service_orders, service_fee_lines, payment_milestones}
S_physical = {BASE-01, BASE-02, BASE-03, BASE-04,
              service_orders, service_fee_lines, payment_milestones}

S_required - S_physical = ∅
S_physical - S_required = ∅
Zero omissions / zero unresolved campaign gaps.
```
