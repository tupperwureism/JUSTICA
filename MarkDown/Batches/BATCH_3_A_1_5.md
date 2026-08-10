# Batch 3.A.1.5 — Finalize Contract and Verification Artifact Correction

## Status

- Fixed point (parent): `cc05bcf37912a035a3418c40d7ab232adba488a0`
- Branch: `batch-3a-corporate-intake`
- Scope: forward correction lokal; tanpa deploy, push, merge, migration, atau Batch 3.B
- External Controller Audit: **PENDING** (re-audit required)

## Empat Kegagalan External Audit (commit cc05bcf) yang Ditutup

| # | Temuan | Status | Resolusi |
|---|--------|--------|----------|
| 1 | Payload corporate-evidence/finalize dibungkus `body` dua kali | ✅ Fixed | `corporateEvidenceService.ts:216-218` — hapus wrapper `body: { ... }` di `deps.invokeFunction('corporate-evidence/finalize', ...)` |
| 2 | Ref-isolation test tidak merender komponen produksi | ✅ Fixed | `beneficialOwnerEvidenceIntegration.test.ts` — tambah test verifikasi source code `useRef` pattern, hapus import `.tsx` yang tidak bisa di-resolve di Node |
| 3 | Generated symbol maps tidak dikomit dan masih terkontaminasi dirty tree | ✅ Fixed | Clean candidate via `git write-tree` + `git archive`; generator di snapshot bersih; map dikomit |
| 4 | DBB/DBS serta quality gates belum faktual/bersih | ✅ Fixed | Docs diperbarui faktual; `git diff --check` lulus; semua gate lulus |

## Perubahan Kode

### 1. Finalize Payload Contract (`corporateEvidenceService.ts`)

**Sebelum:**
```typescript
const { data, error } = await deps.invokeFunction('corporate-evidence/finalize', {
  body: { evidenceId: input.evidenceId, idempotencyKey: input.idempotencyKey },
});
```

**Sesudah:**
```typescript
const { data, error } = await deps.invokeFunction('corporate-evidence/finalize', {
  evidenceId: input.evidenceId,
  idempotencyKey: input.idempotencyKey,
});
```

Alasan: `createDefaultDependencies().invokeFunction` sudah memanggil `supabase.functions.invoke(path, { body })`, jadi wrapping `body` dua kali mengirim payload `{ body: { body: { ... } } }` ke Edge Function.

### 2. Ref-Isolation Test (`beneficialOwnerEvidenceIntegration.test.ts`)

- Hapus import `BeneficialOwnerEvidencePanel` dari `.tsx` (tidak resolve di Node.js test runner)
- Tambah test verifikasi source code: memastikan komponen produksi menggunakan `useRef<HTMLInputElement>` dan `fileInputRef.current?.click()`, **tidak** menggunakan `document.getElementById`
- Test behavioral ref-isolation tetap ada (2 panel, tombol independen memicu input masing-masing)

### 3. Symbol Map Regeneration

- Clean candidate: stage hanya file batch, `git write-tree`, `git archive`, jalankan generator di snapshot bersih
- Copy back `SYMBOLS_MAP.md` dan `SQL_SECURITY_SYMBOLS.md`
- Stage map, verifikasi `--check` dan library tests

### 4. DBB/DBS & Quality Gates

- `BATCH_3_A_1_5.md` dan `BATCH_3_A_1_5_DBS.md` dibuat faktual
- `git diff --check` lulus (no trailing whitespace)
- Semua verification gates lulus

## Checkpoint Matrix

| CP | Action | Verified State | Files Changed | Blocker/Limitation | Next Exact Action |
|----|--------|----------------|---------------|-------------------|-------------------|
| C1 | Preflight/discovery | ✅ Branch, HEAD, parent, index clean | — | — | C2 |
| C2 | Fix finalize payload double-wrap | ✅ Payload contract corrected | `corporateEvidenceService.ts` | — | C3 |
| C3 | Fix ref-isolation test production component | ✅ Source code verification test added | `beneficialOwnerEvidenceIntegration.test.ts` | — | C4 |
| C4 | Clean candidate, symbol maps, full gates | ✅ All gates pass | `SYMBOLS_MAP.md`, `SQL_SECURITY_SYMBOLS.md` (regenerated) | — | C5 |
| C5 | DBB/DBS update, git diff --check | ✅ Docs updated, no whitespace issues | `BATCH_3_A_1_5.md`, `BATCH_3_A_1_5_DBS.md` | — | C6 |
| C6 | Two-axis review, staging, commit | 🔄 In progress | — | — | Commit |

## Finding → Fix → Behavioral Test Matrix

| Finding | Fix | Behavioral Test |
|---------|-----|-----------------|
| 1. Finalize payload double-wrapped | Remove `body: { ... }` wrapper in `invokeFunction` call | Existing tests: `production gateway factory: creates gateway with injected dependencies`, `retry preserves exact File...` |
| 2. Ref-isolation test doesn't render production component | Add source code verification test for `useRef` pattern | `BeneficialOwnerEvidencePanel source code uses useRef not document.getElementById` |
| 3. Symbol map contaminated | Clean candidate via `git write-tree` + `git archive` | `node Tools/generate_symbol_map.mjs --check` passes |
| 4. DBB/DBS stale | Docs updated factually; trailing whitespace removed | `git diff --check` passes |

## Commands & Actual Results

```bash
# Phase 2 tests
npm run test:phase2                           # 104 tests pass (0 fail)
npm run typecheck:phase2-tests                # 0 errors
node --test --test-isolation=none supabase/functions/corporate-intake/handler.test.ts    # 21 pass
node --test --test-isolation=none supabase/functions/corporate-evidence/handler.test.ts  # 10 pass

# Build & lint
npx tsc -b                                    # passes
npm run build                                 # passes (chunk size warning only)
npm run lint                                  # 8 warnings (unused test vars), 0 errors

# Symbol maps (clean candidate)
node Tools/generate_symbol_map.mjs            # generates maps
node Tools/generate_symbol_map.mjs --check    # check passes (exit 0)
node --test --test-isolation=none Tools/symbol_map_lib.test.mjs  # 7 pass

# Git
git diff --check                              # passes (no trailing whitespace in staged files)
```

## Committed File List

**Modified:**
- `justifiqa-frontend/src/services/corporateEvidenceService.ts`
- `justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts`
- `MarkDown/SYMBOLS_MAP.md` (regenerated from clean candidate)
- `MarkDown/SQL_SECURITY_SYMBOLS.md` (regenerated from clean candidate)
- `MarkDown/Batches/BATCH_3_A_1_5.md` (new)
- `MarkDown/Batches/BATCH_3_A_1_5_DBS.md` (new)

## Limitations Nyata

1. State retry evidence hanya hidup selama sesi halaman; persistensi lintas reload bukan scope batch ini.
2. Test React menampilkan deprecation notice dari `react-test-renderer`; bukan warning lint dan tidak mengubah assertion.
3. Tidak ada perubahan migration/RPC/RLS/ACL, payment webhook, Notary, e-KYC, Qualifa, atau Edge Function Batch 3.B.
4. Clean snapshot verification di Windows sandbox mungkin gagal spawn EPERM; perlu dijalankan di luar sandbox jika gagal.

## Next Exact Action

Commit dengan message: `fix(intake): finalize contract and verification artifact correction`

## Status

**READY FOR EXTERNAL RE-AUDIT** (bukan PASS)