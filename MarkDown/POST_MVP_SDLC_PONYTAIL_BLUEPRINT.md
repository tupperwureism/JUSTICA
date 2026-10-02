Kesimpulan utama: gunakan dua horizon terpisah.

- Phase 2 menghasilkan fitur yang bernilai dan tetap kompatibel dengan MVP.
- Phase 3 membuktikan bahwa keseluruhan produk aman, dapat dipulihkan, teramati, dan layak dioperasikan.
- Jangan mencampur “fitur selesai secara lokal” dengan “siap produksi”.
- Jangan membuat ulang seluruh dokumen V1. Bekukan V1 sebagai baseline, lalu dokumentasikan hanya delta.

Saya menerima klaim MVP 100% selesai sebagai input; saya tidak melakukan audit implementasi penuh pada sesi read-only ini.

## 1. Taksonomi Phase → Epic → Sprint → Batch/Task

Scrum tidak mendefinisikan hierarki formal tersebut. Scrum hanya menetapkan Product Goal, Product Backlog, Sprint Goal, Sprint Backlog, dan Increment. Product Backlog juga bersifat emergent, sedangkan satu Sprint harus memiliki satu tujuan koheren. Karena itu, struktur Phase/Epic adalah lapisan tata kelola produk—bukan objek Scrum resmi. [Scrum Guide resmi](https://scrumguides.org/scrum-guide.html?from=hub)

| Tingkat | Makna yang benar | Aturan Ponytail |
|---|---|---|
| Phase | Horizon investasi/release dengan exit gate | Sedikit mungkin; Phase 2 dan 3 sudah cukup |
| Product Goal | Outcome bisnis utama pada horizon aktif | Satu tujuan aktif; dua fitur harus mendukung outcome yang sama atau dikerjakan berurutan |
| Epic | Outcome besar yang mungkin melintasi beberapa Sprint | Satu fitur biasanya satu Epic; jangan paksa Epic = Sprint |
| Sprint | Timebox delivery, disarankan 1–2 minggu | Satu Sprint Goal; menghasilkan Increment usable |
| Vertical Slice | Perilaku end-to-end yang dapat diverifikasi | Potong Actor → UI → RPC/RLS → DB → observability |
| Batch/Task | Unit kerja teknis kecil | Maksimal sekitar 0,5–2 hari, satu outcome, satu pemeriksaan runnable |
| Commit | Perubahan atomik yang menjaga build tetap sehat | Bukan milestone produk dan bukan pengganti acceptance criteria |

Backlog existing masih menggunakan pola “Epic J-1 = Sprint 1” di [product_backlog.md](D:/justificadll/MarkDown/product_backlog.md). Itu dapat diterima sebagai sejarah MVP, tetapi jangan diteruskan. Epic dapat membutuhkan tiga Sprint; satu Sprint juga dapat memuat slice dari lebih dari satu Epic selama semuanya mendukung satu Sprint Goal.

### Phase 2 — Feature Expansion

**P2.0 — Feature Admission & Discovery**

Untuk masing-masing fitur:

- Problem dan user outcome.
- Bukti kebutuhan atau asumsi yang akan diuji.
- Non-goals.
- Kill criteria: kondisi yang membuat fitur dibatalkan.
- Risiko terhadap uang, privasi, E2EE, WORM, dan hak akses.

Exit gate: masalah cukup jelas untuk dinilai. Belum boleh mendesain tabel hanya berdasarkan nama fitur.

**P2.1 — Contract Delta Design**

Tentukan hanya perubahan terhadap baseline MVP:

- Domain term dan state transition baru.
- Actor–resource–action authorization matrix.
- Invariant, concurrency, idempotency, dan failure modes.
- Delta tabel/RPC/RLS/Realtime.
- Seam UI yang akan diperluas.
- Strategi migrasi dan backward compatibility.
- Acceptance test positif dan negatif.

Exit gate: tidak ada pertanyaan terbuka yang dapat mengubah model data atau trust boundary secara material.

**P2.2 — Vertical-Slice Delivery**

Contoh urutan Sprint, bukan ketentuan mutlak:

- `EXP-1`: tracer bullet berisiko tertinggi dari Feature A.
- `EXP-2`: selesaikan workflow utama Feature A.
- `EXP-3`: tracer bullet Feature B.
- `EXP-4`: selesaikan Feature B dan cross-feature regression.

Setiap slice harus berjalan end-to-end dan dapat dinonaktifkan. Hindari Sprint horizontal seperti “semua tabel dahulu, semua UI kemudian”; itu menunda integrasi dan menyembunyikan kegagalan kontrak.

**P2.3 — Release Candidate Hardening**

- Tidak menerima scope fitur baru.
- Regression MVP.
- Negative RLS/RPC tests.
- Concurrency/load verification untuk jalur sensitif.
- E2EE/WORM boundary verification.
- Forensic audit hanya atas delta dan jalur MVP yang tersentuh.

Exit gate: release candidate deployable ke staging, bukan sekadar branch selesai.

### Phase 3 — Production Readiness & Go-Live

**P3.0 — Cloud Foundation**

- Dev, staging, production terisolasi.
- Migration-only schema management.
- CI/CD, branch protection, artifact provenance.
- TLS, domain, MFA organisasi, network restrictions.
- Secret ownership dan rotation.

Supabase merekomendasikan perubahan schema melalui migration files, bukan perubahan langsung pada database remote. Preview/persistent branches dapat menyediakan lingkungan terisolasi untuk validasi. [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)

**P3.1 — Migration and Security Rehearsal**

- Rebuild database kosong dari seluruh migration chain.
- Upgrade rehearsal menggunakan data representatif tersanitasi.
- Backfill dan timeout rehearsal.
- RLS/security advisor harus bersih atau memiliki exception tercatat.
- Restore test, bukan sekadar memastikan backup “enabled”.

Backup Supabase tidak mencakup objek Storage, hanya metadata database; recovery Storage memerlukan rencana tersendiri. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups)

**P3.2 — Operational Readiness**

- SLO/SLI minimum.
- Alert yang actionable.
- Dashboard untuk auth failures, RPC errors, lock contention, Realtime lag, payment discrepancies, dan WORM failures.
- Capacity/load test.
- Incident roles, escalation, runbook, dan customer communication.
- RPO/RTO yang telah diuji.

PRR memang dimaksudkan untuk memverifikasi operational readiness, emergency controls, instrumentation, resource usage, dan kesiapan pemilik layanan—bukan sekadar checklist deployment. [Google SRE PRR](https://sre.google/sre-book/evolving-sre-engagement-model/)

**P3.3 — Controlled Launch**

- Staging acceptance.
- Internal pilot atau cohort terbatas.
- Feature flag/dark launch.
- Go/No-Go berdasarkan evidence.
- Canary/percentage rollout jika blast radius layak.

**P3.4 — Commercial Go-Live & Hypercare**

- Enable bertahap.
- Freeze perubahan non-kritis.
- Pemantauan intensif.
- Reconciliation transaksi.
- Post-launch review.
- Hapus flag/schema lama hanya setelah soak period.

## 2. Artefak wajib: minimum tetapi cukup

Zero BDUF bukan berarti zero design. Artinya keputusan dibuat just-in-time dan hanya sedalam risiko yang benar-benar ada.

### Sebelum Phase 2 coding

**1. MVP Baseline Manifest — satu dokumen sangat pendek**

Isi:

- Git commit/tag baseline.
- Migration terakhir.
- Versi generated database types.
- Daftar contract/regression test wajib.
- Link ke baseline arsitektur.

Tidak menyalin isi [DDL/RLS specification](D:/justificadll/MarkDown/DATABASE_DDL_AND_RLS_MIGRATIONS_SPECIFICATION.md), [BCE seam standard](D:/justificadll/MarkDown/BCE_SEAM_ARCHITECTURAL_STANDARD.md), atau [frontend standard](D:/justificadll/MOCK-J-FRONTEND-STANDARD.md). Manifest hanya menunjuk versi kanoniknya.

**2. Satu Feature Contract Pack per fitur**

Cukup satu Markdown, idealnya 3–6 halaman efektif:

1. Problem, outcome, non-goals.
2. Actors dan authorization matrix.
3. State machine dan invariants.
4. Data classification dan retention.
5. Schema/RPC/RLS/Realtime delta.
6. Concurrency, idempotency, dan failure behavior.
7. UI states: loading, empty, denied, conflict, offline, retry.
8. Telemetry, rollout, rollback.
9. Acceptance dan negative tests.

Jangan membuat RFC, ERD delta, security spec, API spec, dan UI spec sebagai lima dokumen terpisah jika satu Feature Contract Pack masih mudah dibaca.

**3. Migration Blueprint**

Wajib jika ada perubahan database:

- `expand`: tambahkan objek kompatibel.
- backfill jika diperlukan.
- validate constraints dan policy.
- deploy aplikasi yang dapat membaca bentuk lama dan baru.
- switch traffic/flag.
- `contract`: drop/rename lama pada release terpisah.

Rollback aplikasi dilakukan dengan mematikan flag. Untuk schema production, utamakan roll-forward remediation; down migration destruktif sering tidak aman.

**4. Verification Matrix Delta**

Hanya mencatat:

- Requirement baru.
- Test ID.
- Actor/role.
- Allowed result.
- Explicitly denied result.
- Evidence location.

Tidak perlu menggandakan traceability seluruh MVP.

### Kondisional, bukan otomatis

**ADR** hanya jika keputusan:

- Sulit dibalik.
- Akan terlihat aneh tanpa konteks.
- Memiliki alternatif dan trade-off nyata.

**Threat model mini** wajib jika fitur menyentuh:

- Escrow atau saldo.
- Privileged admin.
- PII/dokumen hukum.
- E2EE/key lifecycle.
- External webhook/provider.
- Public verification.
- Cross-tenant access.

**BCE sequence diagram** hanya untuk workflow baru dengan concurrency, retry, external provider, atau state transition kompleks. Jangan menggambar ulang lifeline yang tidak berubah.

**Prototype** hanya ketika jawaban sulit dipastikan melalui diskusi: state model terasa ambigu atau UX perlu dilihat langsung.

### Sebelum Phase 3 deployment

Artefak berikut wajib, tetapi tidak perlu diselesaikan sebelum coding fitur:

- Environment and Secrets Matrix.
- PRR checklist dan evidence.
- SLO/alert/runbook.
- Migration and restore rehearsal record.
- Rollout/rollback plan.
- Data retention/deletion matrix.
- External dependency failure matrix.
- Go/No-Go record.

Secrets Matrix tidak boleh berisi nilai secret. Isinya hanya nama, owner, consumer, environment, storage location, rotation interval, dan blast radius. NIST SSDF juga menekankan pelacakan security requirements, risk, dan design decisions, bukan dokumentasi dekoratif. [NIST SSDF](https://csrc.nist.gov/projects/ssdf)

## 3. Protokol bridging fitur baru

### A. Freeze kontrak MVP

Jangan menganggap “kode existing” sebagai kontrak implisit. Bekukan:

- Endpoint/RPC names dan response behavior.
- RLS truth table.
- State transitions.
- Realtime topic/access behavior.
- Database constraints.
- UI route dan critical user flows.

Setiap fitur baru harus menyatakan kontrak mana yang:

- Tidak disentuh.
- Diperluas secara kompatibel.
- Sengaja diubah dengan migration path.

### B. Database-first dalam arti contract-first, bukan table-first

Urutan aman:

1. Tambahkan constraint/database primitive paling native.
2. Tambahkan default-deny RLS.
3. Tambahkan RPC hanya jika operasi memang harus atomik.
4. Tambahkan Realtime exposure hanya jika ada kebutuhan live update.
5. Hubungkan UI melalui interface module kecil.

Aturan transaksi:

- `FOR UPDATE` hanya pada row yang benar-benar berkontensi.
- Gunakan lock order deterministik.
- Jangan memanggil payment gateway/provider eksternal selama row lock masih ditahan.
- Gunakan unique/exclusion constraints sebagai final race-condition guard.
- Gunakan idempotency key untuk command yang dapat di-retry.
- Simpan transaction scope sesingkat mungkin.
- Uji dua request paralel, bukan hanya dua request sequential.

### C. RLS dan function hardening

Ada tiga koreksi kritis terhadap standar internal:

1. `service_role` selalu melewati RLS. Ia bukan role yang “dilindungi RLS”. [Supabase service role behavior](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)

2. `SECURITY DEFINER` bukan default. Gunakan `SECURITY INVOKER` kecuali memang membutuhkan privilege elevation.

3. `SET search_path = public` saja tidak otomatis aman. PostgreSQL meminta `search_path` mengecualikan schema yang writable oleh pihak tidak terpercaya dan menganjurkan object qualification yang eksplisit. [PostgreSQL SECURITY DEFINER guidance](https://www.postgresql.org/docs/17/sql-createfunction.html)

Selain itu:

- Revoke default `EXECUTE`.
- Grant hanya ke caller yang benar-benar membutuhkan.
- Jika RPC memang dipanggil user, jangan grant hanya kepada `service_role`; pilih invoker atau definer sempit dengan pemeriksaan authorization eksplisit.
- Test setiap policy dengan owner sendiri, owner lain, anon, authenticated, dan privileged server path.
- Gunakan grants dan RLS bersama-sama; RLS bukan pengganti object privileges. [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api)

### D. “WORM trigger” bukan WORM sejati

Trigger `BEFORE UPDATE/DELETE` hanyalah immutability guard. Owner/superuser dapat menonaktifkan trigger, sedangkan superuser dan role `BYPASSRLS` juga melewati RLS. [PostgreSQL trigger controls](https://www.postgresql.org/docs/17/sql-altertable.html), [PostgreSQL RLS behavior](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

Klasifikasi yang jujur:

- Trigger + hash chain: application-level tamper-evident log.
- Restricted role/schema: stronger database immutability control.
- External append-only/object-lock storage dengan independent retention authority: actual WORM-grade vault.

Jangan mengklaim “immutable against database administrator” jika bukti hanya berada dalam database yang sama dan dikuasai role yang sama.

### E. Realtime dan E2EE

- Private channel wajib.
- Authorization melalui RLS pada channel/topic.
- Topic tidak mengandung data sensitif.
- Unsubscribe/cleanup lifecycle.
- Server hanya menyimpan ciphertext dan metadata minimum.
- Key rotation/recovery/revocation harus menjadi bagian dari kontrak fitur apabila fitur baru memasuki ruang E2EE.

Supabase secara eksplisit merekomendasikan private channels untuk production dan RLS-based authorization. [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization?language=dart&queryGroups=language), [Realtime best practices](https://supabase.com/docs/guides/realtime/getting_started)

### F. UI modular

Gunakan pola existing `pages → feature module/controller → hook/service → Supabase interface`. Tambahkan seam baru hanya jika benar-benar memiliki dua adapter, misalnya production Supabase dan test adapter.

Batas `<100 baris/file` adalah konstitusi lokal, bukan standar industri. Pertahankan, tetapi jangan membuat puluhan wrapper pass-through hanya untuk mengejar angka. Modul harus dalam:

- Interface kecil.
- State dan rules terkonsentrasi.
- Presentational UI terpisah dari orchestration.
- Existing design tokens direuse.
- Authorization tetap ditegakkan di database; route guard hanya UX control.

Feature flag dapat menggunakan `platform_governance_configs` existing jika semantiknya sesuai dan nilainya tidak sensitif. Jangan membeli atau membangun flag platform baru sebelum rollout membutuhkan capability yang tidak tersedia.

## 4. Skill protocol ultra-hemat token

Gunakan skill berdasarkan trigger, bukan dipanggil semuanya.

| Kondisi | Skill/flow |
|---|---|
| Belum tahu flow yang tepat | `ask-matt` sekali |
| Fitur baru masih kabur | `grill-with-docs` |
| Istilah, ownership, atau state ambigu | `domain-modeling` |
| Lokasi seam/interface belum jelas | `codebase-design` |
| Ada beberapa bentuk interface yang sama-sama masuk akal | `design-an-interface` |
| Jawaban butuh eksperimen runnable/visual | `prototype` |
| Fitur multi-session sudah jelas | `to-spec` → `to-tickets` |
| Implementasi | `implement`, dengan `tdd` pada behavior sensitif |
| Menyentuh frontend Justifiqa | `frontend-ui-engineering` |
| Bug/regression sulit | `diagnosing-bugs` |
| Ticket selesai | `code-review` terhadap Spec + Standards |
| Menjelang RC/phase transition | `forensic-audit` |
| Context mulai penuh | `handoff`, lalu fresh context per ticket |
| Fakta provider/regulasi/API belum pasti | `research` terhadap sumber primer |

Aturan token:

1. Satu Feature Contract Pack menjadi sumber konteks.
2. Prompt ticket hanya membawa spec section ID, file seam, acceptance criteria, dan command verifikasi.
3. Jangan menempel ulang seluruh ERD/UML/backlog.
4. Mulai context baru per tracer-bullet ticket.
5. Audit diff dan affected contracts, bukan seluruh repo setiap commit.
6. Full forensic audit hanya pada release candidate atau phase transition.
7. Skill yang tidak memiliki trigger tidak dipanggil.

Format terbaik saat Anda mempresentasikan dua fitur nanti:

```text
Nama fitur:
User/outcome:
Masalah saat ini:
Actors:
Happy path:
State baru/perubahan state:
Data sensitif:
Uang/concurrency:
External provider:
Realtime/E2EE:
Non-goals:
Kill/success metric:
```

Dari input itu, output minimum yang tepat adalah dua Feature Contract Packs, satu dependency map, dan backlog tracer-bullet—bukan satu paket BDUF baru.
