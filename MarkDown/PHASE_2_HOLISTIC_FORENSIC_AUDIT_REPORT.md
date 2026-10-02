# PHASE 2 HOLISTIC FORENSIC AUDIT REPORT

**Tanggal audit:** 22 Juli 2026 (WIB)
**Baseline kampanye:** `1f47c0b`, `a99bc6e`, `60b6827`, `f25711f`, `5ac964a`
**Peran audit:** Lead Forensic Auditor & Chief Security Architect
**Metode:** pembacaan fisik migration/TypeScript/JSX, rekonsiliasi himpunan, static executable audit, compiler/linter/build gates, dan percobaan replay database lokal
**Putusan:** **BELUM DAPAT DISERTIFIKASI PRODUCTION GO-LIVE READY**

Putusan ini bukan kegagalan empat gerbang frontend. TypeScript, oxlint, symbol-map check, dan Vite production build lulus. Sertifikasi ditahan karena migration replay, katalog RLS/proacl/proconfig, serta uji concurrency/RLS negatif belum berhasil dijalankan pada stack Docker lokal; beberapa alur Phase 2 juga masih secara eksplisit berupa sandbox/simulasi dan belum memiliki boundary server/provider produksi.

## 1. Batas audit dan perlindungan worktree

Worktree sudah sangat kotor sebelum audit, termasuk banyak penghapusan artefak, refactor frontend, file baru, dan perubahan generated `SYMBOLS_MAP.md`. Audit tidak membersihkan atau membatalkan pekerjaan tersebut. Refactor modular `DocumentDraftingModal` diadopsi karena langsung menutup pelanggaran `<100` baris; pada `CheckoutEscrowModal`, hanya hunk kelas audit yang dimasukkan dan perubahan aksesibilitas pengguna di sekelilingnya tetap unstaged. Generated map dipisahkan melalui snapshot `HEAD + patch audit`.

Skill audit meminta `.agents/skills/forensic-audit/references/universal-audit-vectors.md`, tetapi path itu tidak ada. Sumber kanonik yang tersedia dan dibaca penuh adalah `.agents/skills/forensic-audit/UNIVERSAL-AUDIT-VECTORS.md`; template matriks dibaca dari `.agents/skills/forensic-audit/TRACEABILITY-MATRIX-TEMPLATE.md`.

## 2. Koreksi berantai yang diterapkan

### 2.1 Hardening PostgreSQL

Migration roll-forward [`20260722000021_phase2_holistic_security_hardening.sql`](../supabase/migrations/20260722000021_phase2_holistic_security_hardening.sql) menambahkan:

- ikatan FK `document_integrity_anchors.signing_envelope_id` dan token verifikasi publik acak;
- validasi digest anchor harus sama dengan digest envelope, serta deferred completion gate yang mewajibkan anchor PSrE sebelum envelope `COMPLETED`;
- `ENABLE ALWAYS` pada trigger WORM/identity/signing kritis;
- penutupan direct browser writes untuk job pemerintah dan anchor dokumen; service-role/server menjadi satu-satunya jalur tulis;
- verifier publik yang membaca legacy e-Meterai dan generic integrity anchor melalui proyeksi allow-list yang sama;
- `search_path = public` katalog-verifiable untuk fungsi security-sensitive dalam scope audit.

Generated [`database.types.ts`](../justifiqa-frontend/src/types/database.types.ts) diselaraskan secara statis dengan kolom dan FK baru. Regenerasi dari live local schema belum dapat dibuktikan karena bootstrap database lokal gagal; ini tetap blocker.

### 2.2 Hardening frontend

Komponen dalam scope dikoreksi dengan mempertahankan refactor modular pengguna: warna hardcoded/arbitrary shadow diganti token atau kelas design-system terdefinisi, raw button verifier diganti primitive `Button`, dan klaim menyesatkan “sah ber-e-Meterai PERURI SHA-256” diganti menjadi “digest cocok & e-Meterai tercatat”. Seluruh 25 file komponen kampanye beserta hasil ekstraksi modular tetap di bawah 100 baris dan lolos pemeriksaan inline style, arbitrary utility, hardcoded palette, serta keberadaan kelas custom di `index.css`.

### 2.3 Koreksi generator symbol map

Audit menemukan comparator `sqlPriority` memakai `path.padStart(240)`. Nama migration yang lebih panjang dapat mengalahkan migration yang lebih baru, sehingga policy deny terbaru salah ditampilkan sebagai deklarasi lama. Comparator diperbaiki menjadi prioritas source/path/line leksikal tanpa length-padding dan ditutup dengan regression test filename berbeda panjang.

## 3. Matriks verifikasi forensik Eagle-Eye

| Upstream requirement | Downstream target | Bukti fisik | Status | Catatan |
|---|---|---|:---:|---|
| RLS `service_orders` | table + participant policy | `...00016`: table L246; `ENABLE/FORCE` L518–519; policy L525 | **COMPLETE (static)** | Client, verified assigned advocate, atau admin terotorisasi. |
| RLS `corporate_service_cases` | table + participant policy | `...00017`: table L7; `ENABLE/FORCE` L387–388; policy L398 | **COMPLETE (static)** | Ownership mengikuti `service_orders`; notary/admin eksplisit. |
| RLS `beneficial_owners` | table + participant policy | `...00017`: table L92; `ENABLE/FORCE` L391–392; policy L438 | **COMPLETE (static)** | Relasi ke case/order mencegah tenant bleed secara predikat. |
| RLS `ekyc_verification_logs` | table + subject policy | `...00018`: table L17; `ENABLE/FORCE` L314–315; policy L321 | **COMPLETE (static)** | Subject sendiri atau compliance/super admin. |
| RLS `signing_envelopes` | envelope + helper authorization | `...00018`: table L42; `ENABLE/FORCE` L316–317; policy L332; helper L263 | **COMPLETE (static)** | Participant/case professional/admin; dynamic negative test belum jalan. |
| RLS `provider_webhook_events` | table + client-order read | `...00019`: table L9; `ENABLE/FORCE` L115–116; policy L122 | **COMPLETE (static)** | Client hanya order sendiri; write service-role. |
| RLS `payout_idempotency_keys` | strict default deny | `...00019`: table L26; `ENABLE/FORCE` L117–118; revoke/grant L126–128 | **COMPLETE (static)** | Tidak ada policy/grant anon/authenticated; service-role only. |
| RLS `government_submission_jobs` | case/notary/client policies | `...00017`: table L189, RLS L395–396; `...00020` read policies; `...00021` write deny L92–116 | **COMPLETE (static)** | Browser insert/update ditutup sampai boundary server tervalidasi tersedia. |
| Mutex konsultasi | `fn_book_consultation_slot_mutex` | `...00016`: slot `FOR UPDATE` L90; wallet `FOR UPDATE` L105; mutasi sesudah lock | **COMPLETE (static)** | Atomic transaction; concurrent DB test belum terbukti pada audit ini. |
| Mutex release escrow | `fn_release_escrow_to_advocate_mutex` | `...00013`: escrow lock L55; client wallet L72; advocate wallet L85 | **COMPLETE (static)** | Status/ownership/deliverable divalidasi sebelum ledger/status mutation. |
| Mutex webhook | `fn_webhook_settle_escrow_mutex` | `...00019`: event lock L82; escrow lock L93; mutation L104–111 | **COMPLETE (static)** | Signature/type/order/amount/state checks ada; concurrency test belum jalan. |
| Zero raw biometric | seluruh migration chain | executable audit memindai DDL tanpa komentar; tidak ada `BYTEA` atau kolom raw KTP/selfie/liveness/template | **COMPLETE (static)** | `nik_ktp VARCHAR(16)` adalah identitas teks legacy, bukan media raw. |
| Digest envelope | `signing_envelopes.document_sha256_hash` | `...00018` L49/L59; immutable after send L161–202 | **COMPLETE (static)** | Digest lowercase 64 hex dan tidak dapat diganti setelah send. |
| Anchor notarial/WORM | `document_integrity_anchors` | `...00019` L39–57; `...00021` binding L5–78 dan `ENABLE ALWAYS` L79–91 | **COMPLETE (static)** | Insert browser ditutup; server harus hash byte final. Replay SQL belum terbukti. |
| Verifier minimal | RPC + React hook/result | `...00021` L118–201; `usePublicVerifier.ts` L46/L77 | **COMPLETE (static)** | Web Crypto membaca byte file; response tidak memuat PII/path/internal owner IDs. Rate limit/WAF belum ada. |
| Batas `<100` baris | 25 komponen kampanye/modular | executable audit: min 11, max 74 baris | **COMPLETE** | Semua file lolos. |
| Zero ad-hoc styling | 25 komponen kampanye/modular | executable audit: 25/25 tanpa inline style, arbitrary utility, atau hardcoded palette | **COMPLETE** | Kelas custom audit dibuktikan terdefinisi di `index.css`. |
| Legacy consultation checkout | caller/type/RPC | `consultationService.ts` L5/L52–59; RPC canonical `...00016` | **COMPLETE (compile/static)** | `tsc` membuktikan caller/type match; E2E DB belum dijalankan. |
| Legacy realtime room | resolver + private channel | `roomSessionService.ts`; `useRealtimeChat.ts`; realtime RLS `...00013` | **COMPLETE (compile/static)** | Runtime Realtime integration belum diuji pada audit ini. |
| DB types sync | migration ↔ `database.types.ts` | anchor fields/FK ada pada types | **PARTIAL** | Static equality untuk delta audit; live generated diff tidak tersedia. |
| Symbol maps sync | generator + maps | generator check PASS; latest policy menunjuk `...00021` | **COMPLETE** | Comparator filename-length telah diperbaiki dan dites. |

## 4. Rekonsiliasi himpunan

```text
S_required_tables = {
  service_orders, corporate_service_cases, beneficial_owners,
  ekyc_verification_logs, signing_envelopes, provider_webhook_events,
  payout_idempotency_keys, government_submission_jobs
}

S_physical_tables = S_required_tables
S_required_tables - S_physical_tables = ∅
S_physical_tables - S_required_tables = ∅
```

Set equality di atas hanya membuktikan keberadaan kontrak tabel dan hardening statis. Set gate produksi belum sama:

```text
S_go_live_required - S_proven = {
  clean migration replay,
  catalog RLS/proacl/proconfig assertions,
  cross-client and cross-notary negative tests,
  real concurrent mutex/double-payout tests,
  production e-KYC/PSrE/payment/government adapters,
  verifier rate-limit/WAF and abuse telemetry,
  notary registry + legal/provider/operational sign-offs
}
```

Karena selisih kedua tidak kosong, zero-omission certification dilarang.

## 5. Hasil gerbang teknis

| Gate | Hasil | Bukti ringkas |
|---|:---:|---|
| `npx tsc -b --pretty false` | **PASS** | Exit 0, 0 error. |
| `npx oxlint` | **PASS** | Exit 0, tidak ada warning/error. |
| `node Tools/generate_symbol_map.mjs --check` | **PASS** | Generated maps mutakhir. |
| `npx vite build` | **PASS** | Snapshot staged: 2.050 modules; production bundle selesai 1,96s. Warning non-blocking: JS chunk 729,16 kB sebelum gzip. |
| `node --test --test-isolation=none Tools/symbol_map_lib.test.mjs` | **PASS** | 7/7, termasuk regression filename-length. |
| `node --test --test-isolation=none Tools/phase2_holistic_audit.test.mjs` | **PASS** | 10 pass, 0 fail, 0 TODO. |
| `supabase db reset --local --no-seed` | **BLOCKED** | Dua percobaan timeout; container ditinggalkan `Created`. Bootstrap bersih juga timeout. |
| Dynamic RLS/concurrency/catalog tests | **NOT RUN** | Stack lokal tidak mencapai bootstrap schema Auth/Storage/Realtime yang lengkap. |

Vite awalnya gagal di sandbox karena native Tailwind oxide tidak dapat dimuat dan `spawn EPERM`; perintah identik di luar sandbox berhasil. Itu diklasifikasikan sebagai batas sandbox, bukan source defect.

## 6. Blocker production di luar koreksi source batch ini

1. UI menyebut `PASSED · SIMULASI`, “sandbox UI”, “tidak ada API eksternal”, dan “state UI lokal”. Tidak ada boundary server/provider adapter produksi yang dapat diuji untuk e-KYC, PSrE, payment, AHU/OSS, malware scan, atau server-side hashing.
2. Belum ada bukti DPIA/DPA, subprocessor/data-location/deletion agreement, PSrE registry check, PAD report, provider contract/sandbox acceptance, partner-notary/counsel sign-off, PJP/bank agreement, atau controlled-GA economics gate.
3. Registry notaris khusus belum ada; `users_advocate` hanya compatibility seam dan tidak membuktikan lisensi/status notaris.
4. Rate limiting/WAF/QR-token routing/abuse telemetry verifier belum terimplementasi sebagai production boundary.
5. True WORM object-lock archive tetap Phase 3. Trigger database hanya tamper-evident pada trust boundary database.
6. Migration `...00021` dan generated DB types wajib direplay/regenerate pada stack Supabase sehat sebelum merge/deploy.

## 7. Putusan resmi

**PRODUCTION GO-LIVE CERTIFICATION: DENIED / BLOCKED.**

Repository telah melewati compiler, linter, symbol-map, production bundle, dan static forensic assertions setelah koreksi. Namun bukti dynamic database/security serta dependency eksternal yang diwajibkan spesifikasi belum lengkap. Putusan dapat dinaikkan hanya setelah seluruh item pada `S_go_live_required - S_proven` menjadi himpunan kosong.

**Deklarasi akhir:** `NOT CERTIFIED — REMEDIATION AND EXTERNAL GO-LIVE EVIDENCE REMAIN`.
