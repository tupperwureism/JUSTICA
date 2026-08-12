# Batch 3.A.1.8 — Final Truthful Documentation Reconciliation

## Status

- Fixed point: `67439533e079cceded8bbddba1f56a4db6388767`
- Parent of fixed point: `12c0b4e657aed485e87801e0ac541f08a6a76c90`
- Branch: `batch-3a-corporate-intake`
- Scope: **Markdown only.** Production code, tests, generated maps, configuration, dan database objects **tidak disentuh**.
- Commit-message contract: `fix(docs): reconcile corporate intake batch records`
- Resulting commit hash: **TIDAK disertakan dalam dokumen ini.** Git tidak mengizinkan sebuah commit berisi hash miliknya sendiri yang final, karena perubahan dokumen akan mengubah hash.
- Status: **READY FOR EXTERNAL RE-AUDIT**, never self-certified PASS.

## Inherited Dirty-Tree Warning

Repositori mewarisi kondisi dirty tree dari pekerjaan pengguna yang tidak terkait dengan batch ini. Contoh-contoh termasuk perubahan stat/line-ending pada file tracked di luar allowlist dan banyak berkas untracked (`.agents/ponytail/`, `.continue/`, mockup draft, dsb.). Batch 3.A.1.8 **tidak menyentuh** berkas-berkas itu, tidak menjalankan generator peta simbol terhadap root yang kotor, dan tidak mengubah atau men-stage `MarkDown/SYMBOLS_MAP.md` maupun `MarkDown/SQL_SECURITY_SYMBOLS.md`. Verifikasi markdown-only sengaja dibatasi pada lima berkas dalam allowlist.

## External Audit Findings (yang ditutup di sini)

1. **BATCH_3_A_1_6_DBS.md** memuat resep staging historis yang tidak aman untuk sebuah batch yang sudah selesai, dan mencantumkan `corporateEvidenceService.ts` yang sebenarnya tidak pernah masuk commit `12c0b4e`.
2. **BATCH_3_A_1_6_DBS.md** memberikan penjelasan tentang akar generator yang salah: diklaim memindai `.agents/`, `.continue/`, diagram, dan artefak build.
3. **BATCH_3_A_1_7.md** masih memuat entri checkpoint placeholder ("Pending", "Required gates recorded below") alih-alih hasil verifikasi aktual.
4. **BATCH_3_A_1_7.md** menyatakan status akhir sebagai `READY FOR EXTERNAL RE-AUDIT` padahal audit eksternal kemudian menemukan kegagalan dokumentasi.
5. **BATCH_3_A_1_7_DBS.md** memuat karakter aksidental `监管` (CJK) yang tidak relevan.
6. **BATCH_3_A_1_7_DBS.md** mengklaim `git status` bersih bisa secara diam-diam memuat untracked tanpa menunjukkan; perilaku normal `git status` adalah menampilkan untracked kecuali diabaikan atau disembunyikan.
7. **BATCH_3_A_1_7_DBS.md** menyebutkan risiko "port conflict" untuk Vite middleware mode, padahal mode ini tidak mendengarkan port aplikasi.
8. **BATCH_3_A_1_7_DBS.md** mengklaim bahwa `try/finally` dibuktikan secara behavioral oleh test; faktanya, urutan `try/finally` adalah bukti struktural (terlihat di kode), bukan behavioral, dan tidak ada test failure-path di 3.A.1.7.

## Finding → Documentation Correction → Verification Matrix

| # | Finding | Documentation Correction | Verification |
|---|---------|--------------------------|--------------|
| 1 | Unsafe historical `git add` recipe (incl. `corporateEvidenceService.ts`) in 3.A.1.6 DBS | Removed the executable `git add` recipe. Replaced with a factual historical explanation derived from `git show --name-only --format= 12c0b4e657aed485e87801e0ac541f08a6a76c90`, plus a note that `corporateEvidenceService.ts` was never in `12c0b4e` and that `viteSsrTestHelper.ts` was physically committed there but outside the original 3.A.1.6 allowlist (later re-authorized by 3.A.1.7). | `git show --name-only --format= 12c0b4e657aed485e87801e0ac541f08a6a76c90` no longer matches the staging list; DBS now references the actual commit file membership. |
| 2 | False generator scan-root claims | Stated the actual three fixed roots from `Tools/symbol_map_lib.mjs`: `justifiqa-frontend/src` (TS/TSX), `database/migrations` (SQL when present), `supabase/migrations` (SQL). Explicitly stated that `.agents/`, `.continue/`, mockups, diagrams, and build artifacts are not scanned. | `Tools/symbol_map_lib.mjs:331–346` confirms the three roots only. |
| 3 | Stale CP entries in 3.A.1.7 DBB | Replaced "Pending", "Required gates recorded below", and the predicted commit hash with actual outcomes: external physical verification 104/104 tests, typecheck pass, lint pass, commit range `git diff --check` pass, plus the actual resulting commit hash recorded by 3.A.1.8 (not embedded in the document itself). | External verification commands re-confirmed; resulting commit hash not present inside the staged text. |
| 4 | Status line of 3.A.1.7 mis-stated as PASS-equivalent | Replaced with `IMPLEMENTATION ACCEPTED; DOCUMENTATION AUDIT FAILED; SUPERSEDED BY 3.A.1.8.` | Status line contains the literal phrase. |
| 5 | Stray `监管` characters in 3.A.1.7 DBS | Removed. | File search for `监管` returns 0 matches. |
| 6 | Incorrect `git status` explanation in 3.A.1.7 DBS | Reworded: ordinary untracked files are reported by `git status` unless ignored or explicitly hidden. The generator reads the filesystem, not the status display. | DBS now states the correct behaviour. |
| 7 | Vite middleware "port conflict" claim | Removed the port-conflict claim. Listed factual risks only: leaked resource handles/watchers, module/cache leakage, interference between tests. | DBS no longer contains the literal "port conflict" string for middleware mode. |
| 8 | try/finally falsely called behaviorally tested | Distinguished **behavioral proof** (counter transitions) from **structural verification** (visible `try/finally` blocks in code). Explicitly stated no failure-path test injects `createServer`/`ssrLoadModule`/`server.close` failures, so the cleanup claim is structural, not behavioral. | DBS explicitly carries the behavioral-vs-structural wording. |

## Exact Five-File Allowlist

Only these files may be modified or staged:

1. `MarkDown/Batches/BATCH_3_A_1_6_DBS.md`
2. `MarkDown/Batches/BATCH_3_A_1_7.md`
3. `MarkDown/Batches/BATCH_3_A_1_7_DBS.md`
4. `MarkDown/Batches/BATCH_3_A_1_8.md` (this file, new)
5. `MarkDown/Batches/BATCH_3_A_1_8_DBS.md` (new)

Forbidden: TypeScript/TSX files; `package.json` and lockfiles; `MarkDown/SYMBOLS_MAP.md`; `MarkDown/SQL_SECURITY_SYMBOLS.md`; anything under `Tools/*`; Supabase functions, config, migrations, RLS, ACL, RPC, seed; payment webhook, Notary, e-KYC, Qualifa, Batch 3.B; unrelated user files.

## Targeted Verification Commands & Results

```bash
# Confirmed fixed point and ancestry (preflight)
git rev-parse HEAD                                 # 67439533e079cceded8bbddba1f56a4db6388767
git rev-parse HEAD^                                # 12c0b4e657aed485e87801e0ac541f08a6a76c90

# Confirmed 12c0b4e file membership (proves DBS correction #1)
git show --name-only --format= 12c0b4e657aed485e87801e0ac541f08a6a76c90
# BATCH_3_A_1_5.md, BATCH_3_A_1_5_DBS.md, BATCH_3_A_1_6.md, BATCH_3_A_1_6_DBS.md,
# SQL_SECURITY_SYMBOLS.md, SYMBOLS_MAP.md,
# beneficialOwnerEvidenceIntegration.test.ts, corporateIntakeModel.test.ts,
# useCorporateEvidenceUploads.test.ts, viteSsrTestHelper.ts,
# tsconfig.phase2-tests.json
# (corporateEvidenceService.ts NOT present)

# Confirmed 67439533 file membership (six files, unchanged)
git show --name-only --format= 67439533e079cceded8bbddba1f56a4db6388767
# BATCH_3_A_1_6.md, BATCH_3_A_1_6_DBS.md, BATCH_3_A_1_7.md, BATCH_3_A_1_7_DBS.md,
# beneficialOwnerEvidenceIntegration.test.ts, viteSsrTestHelper.ts

# Confirmed actual generator scan roots (proves DBS correction #2)
sed -n '329,346p' Tools/symbol_map_lib.mjs
# collectMapData(workspaceRoot):
#   frontendRoot = path.join(workspaceRoot, 'justifiqa-frontend', 'src');
#   sqlRoots = [database/migrations, supabase/migrations]

# Stale-content removal search
grep -c '监管' MarkDown/Batches/BATCH_3_A_1_7_DBS.md            # 0
grep -c 'git add justifiqa-frontend/src/services/corporateEvidenceService.ts' \
     MarkDown/Batches/BATCH_3_A_1_6_DBS.md                       # 0
grep -c 'port conflict' MarkDown/Batches/BATCH_3_A_1_7_DBS.md    # 0
grep -c 'enforced by a test' MarkDown/Batches/BATCH_3_A_1_7_DBS.md # 0
grep -c 'behaviorally tested' MarkDown/Batches/BATCH_3_A_1_7_DBS.md # 0 (cleanup path)

# Whitespace check on the staged diff (Markdown only)
git diff --cached --check                                          # exit 0

# Allowlist audit
git diff --cached --name-only | sort | uniq -c                     # exactly the 5 allowed files
```

## Statement: Production Implementation Not Reopened

Batch 3.A.1.8 adalah batch **Markdown-only**. Commit `67439533e079cceded8bbddba1f56a4db6388767` (3.A.1.7) dianggap **secara teknis dapat diterima** oleh audit eksternal. Tidak ada baris kode produksi, test, helper, peta simbol, migrasi, atau RPC yang diubah oleh batch ini. Klaim-klaim dokumentasi yang sebelumnya keliru direkonsiliasi dengan bukti dari Git dan kode, bukan dengan memperluas cakupan.

## Limitations

1. Beberapa kalimat lama yang **tidak relevan** dengan implementasi (misalnya sisa istilah `// eslint-disable` di 3.A.1.6 DBS) sengaja dibiarkan apa adanya selama tidak bertentangan dengan kebenaran faktual; rewrite seluruh dokumen tidak termasuk dalam scope 3.A.1.8.
2. Karakter/kalimat yang sudah dihapus diverifikasi melalui pencocokan string literal pada waktu batch ini; jika batch berikutnya menambahkan teks serupa, audit berikutnya perlu memverifikasi ulang.
3. Dokumentasi tidak mengaudit apakah test failure-path harus ditambahkan; itu adalah keputusan desain yang berada di luar scope markdown-only.
4. Repositori memiliki banyak file untracked/dirty yang tidak terkait dengan batch ini dan sengaja tidak disentuh.

## Next Exact Action

1. Audit eksternal terhadap commit hasil batch ini.
2. Jika audit lulus, tutup **Batch 3.A** dan lanjut ke **Batch 3.B** sesuai rencana.
3. Sampai audit eksternal mengembalikan hasil, status tetap **READY FOR EXTERNAL RE-AUDIT**, bukan PASS.

## Status

**READY FOR EXTERNAL RE-AUDIT** (never PASS).
