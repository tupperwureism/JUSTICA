# DBB — Batch 3.C.5: Prove Concurrency and Hook Behavior

## 1. Identitas batch

- **Batch ID**: `BATCH-3C.5-NOTARY-WORKSPACE-TRUE-CONCURRENCY-HOOK-PROOF`
- **Branch**: `batch-3c-notary-workspace`
- **Input fixed point**: `1de5186127cd7aad377078632174244d8d11c1df`
- **Fixed-point parent**: `304c4d6ce7f6e53578e2e285e287fb7061188f30`
- **Status executor**: `READY_FOR_EXTERNAL_REAUDIT`
- **Batas status**: belum lulus audit eksternal dan bukan production-readiness approval.

## 2. Alasan batch

Audit eksternal atas Batch 3.C.4 menolak dua bukti utama sebagai false-green:

1. probe konkurensi memakai `execSync` di dalam `Promise.all`, sehingga pasangan RPC tidak benar-benar overlap; dan
2. test frontend menguji service/helper, bukan perilaku hook produksi melalui boundary yang dapat diinjeksi.

Batch 3.C.5 mengganti kedua bukti tersebut tanpa mengubah objek SQL atau membuka Batch 3.D.

## 3. Scope dan perubahan

| Area | Perubahan |
|---|---|
| Probe konkurensi | `Tools/notary_workspace_concurrency_probe.mjs` memakai dua proses `psql` persisten melalui `spawn` dengan argument array. Session A menahan transaction lock, session B dijalankan sebelum COMMIT A, dan monitor wajib melihat `pg_stat_activity.state = 'active'` serta `wait_event_type = 'Lock'` sebelum COMMIT A. |
| Hook produksi | `useNotaryWorkspaceIntegration` menerima narrow `NotaryWorkspaceService` injection seam dengan default tetap `phase2IntegrationService`; retry CDD diikat pada tuple `caseId + assessmentId + rulesVersion + idempotencyKey`. |
| Fail-closed UI | Pergantian case atau perubahan assessment/rules menginvalidasi attempt dan retry buffer; refresh wajib mengonfirmasi case, assessment, stage `DOCUMENTS_PENDING`, dan decision `APPROVED`. Case terpilih yang hilang tidak fallback ke `list[0]`. |
| Behavioral tests | Test merender hook produksi sebenarnya melalui React test renderer dan service boundary yang diinjeksi. `_input` pada helper test hanya koreksi parameter tak terpakai. |
| Symbol map | Clean candidate menambahkan export `NotaryWorkspaceService`; tidak ada perubahan objek SQL sehingga `SQL_SECURITY_SYMBOLS.md` tetap byte-identik secara Git blob hash. |

## 4. Evidence konkurensi yang diwarisi dan diaudit

Final probe yang diwarisi telah menyelesaikan satu full run dengan exit `0`. Untuk kelima skenario, competitor B terlihat di `pg_stat_activity` dengan `state=active` dan `wait_event_type=Lock` sebelum session A di-COMMIT:

| Skenario | Lock yang teramati | Hasil |
|---|---|---|
| S1 — assignment identik | advisory lock | satu initial success + satu replay; tepat satu WORM event dan satu idempotency record |
| S2 — Notary/key berbeda | transaction-id/row lock | satu winner; loser `ASSIGNMENT_CONFLICT` |
| S3 — key sama, Notary berubah | advisory lock | competitor ditolak `IDEMPOTENCY_CONFLICT`; tanpa write tambahan |
| S4 — CDD identik | advisory lock | satu approval + satu replay |
| S5 — key CDD sama, rules berubah | advisory lock | competitor ditolak `IDEMPOTENCY_CONFLICT`; tanpa write tambahan |

Mutable cleanup pada run itu membuktikan nol idempotency, assessment, dan beneficial-owner fixture tersisa. WORM/FK fixtures hanya hidup sampai disposable volume dihancurkan; seluruh container dan volume disposable 3.C.5 kini telah dihapus.

Recovery executor mengaudit struktur probe secara fisik tetapi tidak mengulang run Docker karena file final tidak berubah material dan prompt melarang pengulangan gate berat yang sudah lulus.

## 5. Verification record

### Bukti selesai sebelum recovery

- `Tools/notary_workspace_runtime.sql`: PASS dan berakhir `ROLLBACK`.
- RLS + FORCE RLS pada tiga tabel relevan: terverifikasi.
- Grant tabel idempotensi: owner-only.
- Handler tests: `12/12` PASS.
- Forensic static audit: `7/7` PASS.
- `npm run test:phase2`: `129/129` PASS.
- `npm run typecheck:phase2-tests`: mula-mula menemukan satu unused parameter; setelah rename ke `_input`, PASS.
- `npx tsc -b`: PASS.
- `npm run lint`: 0 warning, 0 error.
- `npm run build`: PASS.

### Verifikasi recovery executor

- `node --check Tools/notary_workspace_concurrency_probe.mjs`: PASS.
- Narrow `notaryWorkspaceIntegration.test.ts`: `22/22` PASS.
- `git diff --check` pada tiga WIP: PASS.
- Clean candidate `node Tools/generate_symbol_map.mjs`: PASS.
- Clean candidate `node Tools/generate_symbol_map.mjs --check`: PASS.
- Clean candidate `node --test --test-isolation=none Tools/symbol_map_lib.test.mjs`: `7/7` PASS.
- Candidate menghasilkan 376 exported TypeScript symbols; hanya `MarkDown/SYMBOLS_MAP.md` berubah untuk export `NotaryWorkspaceService`.
- Candidate dan HEAD memiliki blob hash `SQL_SECURITY_SYMBOLS.md` yang sama (`f33d3184cd36dadce4510caf63f248332dce009b`).

Kandidat berasal dari fixed-point HEAD dan hanya ditimpa tiga WIP. Dependency TypeScript dihubungkan read-only dari instalasi workspace. Tiga file generator kandidat disalin dari checkout fisik yang bersih terhadap HEAD untuk mempertahankan invariant LF setelah materialisasi ZIP Windows menghasilkan CRLF; tidak ada source dirty-tree lain yang disalin.

## 6. Disposable teardown

Sebelum teardown, allowlist fail-closed membuktikan tepat sembilan container dan tiga volume `justifiqa_3c5_disp`, tanpa substring `justificadll`, `recovery`, `3c4`, atau `main`.

Container yang dihapus secara literal:

- `supabase_storage_justifiqa_3c5_disp`
- `supabase_rest_justifiqa_3c5_disp`
- `supabase_realtime_justifiqa_3c5_disp`
- `supabase_inbucket_justifiqa_3c5_disp`
- `supabase_auth_justifiqa_3c5_disp`
- `supabase_kong_justifiqa_3c5_disp`
- `supabase_vector_justifiqa_3c5_disp`
- `supabase_analytics_justifiqa_3c5_disp`
- `supabase_db_justifiqa_3c5_disp`

Volume yang dihapus secara literal setelah persetujuan eksplisit lanjutan pengguna:

- `supabase_db_justifiqa_3c5_disp`
- `supabase_edge_runtime_justifiqa_3c5_disp`
- `supabase_storage_justifiqa_3c5_disp`

Post-teardown: nol container dan nol volume 3.C.5 tersisa. Dua puluh dua pasangan NAME+ID container main/recovery identik dengan baseline dan enam nama recovery volume identik. Main stack tidak diperbaiki atau dinyalakan.

## 7. Limitasi faktual

- Evidence full probe berasal dari run final yang selesai sebelum recovery; recovery executor mengaudit file dan evidence tetapi tidak melakukan run ulang.
- React test renderer mengeluarkan warning deprecation; ini P2 tooling debt dan tidak mengubah hasil 22/22.
- AHU/OSS/Stamping live provider, deployment, observability produksi, dan production E2E tidak dibuktikan dalam batch ini.
- Main stack tetap exited setelah insiden Docker OOM; tidak ada repair/restart, query, atau mutation terhadap main/recovery database.
- Status ini adalah permintaan audit ulang eksternal, bukan sertifikasi PASS atau production-ready.

## 8. Next exact action

Lakukan external physical re-audit atas commit hasil Batch 3.C.5. Jangan memulai Batch 3.D sebelum sign-off terpisah.
