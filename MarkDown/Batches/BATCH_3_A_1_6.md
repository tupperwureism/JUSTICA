# Batch 3.A.1.6 — Final Behavioral Verification Correction

## Status

- Fixed point (parent): `232b2edf56db52209ced70b3393cc3015d90cd9d`
- Branch: `batch-3a-corporate-intake`
- Scope: forward correction lokal; tanpa deploy, push, merge, migration, atau Batch 3.B
- Parent commit: `cc05bcf37912a035a3418c40d7ab232adba488a0`
- External Controller Audit: **READY FOR EXTERNAL RE-AUDIT** (never self-certified PASS)

## Batch 3.A.1.5 Audit Failures Closed

| # | 3.A.1.5 Finding | 3.A.1.6 Resolution |
|---|-----------------|---------------------|
| 1 | Fake/source-text ref-isolation test | Replaced with real production component render via Vite SSR |
| 2 | No exact finalize-payload regression test | Added `production gateway factory: exact prepare/finalize invoke payload shape — no double body wrapper` |
| 3 | Lint 8 warnings | Fixed all unused vars/params; lint now 0 warnings, 0 errors |
| 4 | git diff --check failed | All whitespace cleaned; diff --check passes |
| 5 | Clean-candidate symbol-map failed | Regenerated from verified clean candidate |
| 6 | DBB stale after commit | New factual DBB/DBS created for 3.A.1.6 |

## Perubahan Kode

### 1. Exact Finalize Payload Regression Test (`useCorporateEvidenceUploads.test.ts`)

Added behavioral test that captures actual `invokeFunction` calls and proves:
- Prepare receives exact plain payload: `{ evidenceId, declaredMime, declaredByteSize, idempotencyKey }`
- Finalize receives exactly: `{ evidenceId, idempotencyKey }` — **no nested `body` property**
- Test fails if double-wrapper `{ body: { ... } }` is restored

```typescript
test('production gateway factory: exact prepare/finalize invoke payload shape — no double body wrapper', async () => {
  const invokeCalls: Array<{ path: string; payload: Record<string, unknown> }> = [];
  // ... injects invokeFunction that captures calls
  // ... runs full upload flow through gateway
  // Assert prepare payload has exactly 4 keys, no 'body'
  // Assert finalize payload has exactly 2 keys, no 'body'
  // Assert test would FAIL if double-wrapper restored
});
```

### 2. Real Production Component Ref-Isolation Test (`beneficialOwnerEvidenceIntegration.test.ts`)

**Deleted from test file:**
- `TestPanelA`, `TestPanelB` fake components
- `readFileSync` source inspection
- `source.includes` assertions
- Unused `ROW_A`/`ROW_B`/`fileA`/`fileB`/`createFile` artifacts
- Imports used only by false-green tests

**Added real behavioral tests:**
1. **Loads real `BeneficialOwnerEvidencePanel.tsx` via Vite SSR** (`viteSsrTestHelper.ts`)
2. **Renders two actual production component instances** with `react-test-renderer`
3. **Uses `createNodeMock`** to provide separate mock file-input nodes per panel
4. **Verifies click isolation**: Each panel's "Pilih file" button triggers only its own file input
5. **Cleans up Vite server** in `finally` block
6. **Fails if production reverts to shared/global DOM lookup**

### 3. TypeScript & Lint Fixes

**Removed weakening overrides from `tsconfig.phase2-tests.json`:**
- `noUnusedLocals: false` → removed
- `noUnusedParameters: false` → removed
- `erasableSyntaxOnly: false` → removed
- `noFallthroughCasesInSwitch: false` → removed

**Fixed all resulting diagnostics:**
- Removed unused `BeneficialOwnerDraft` import in `corporateIntakeModel.test.ts`
- Prefixed unused parameters with `_` in `useCorporateEvidenceUploads.test.ts`
- Removed unused `useRef` import and dead code in `beneficialOwnerEvidenceIntegration.test.ts`

**Final results:**
- `npm run lint`: **0 warnings, 0 errors**
- `npm run typecheck:phase2-tests`: **0 errors**

### 4. Vite SSR Test Helper (`viteSsrTestHelper.ts`)

New utility to load real TSX components in Node test runner:
- Creates Vite server in middleware mode (no persistent dev server)
- Uses `ssrLoadModule` to compile and load TSX
- Disables noisy logging
- Provides `closeViteServer()` for cleanup

## Checkpoint Matrix

| CP | Action | Verified State | Files Changed | Blocker/Limitation | Next Exact Action |
|----|--------|----------------|---------------|-------------------|-------------------|
| CP-00 | Hard preflight | ✅ Branch=batch-3a-corporate-intake, HEAD=232b2edf, parent=cc05bcf, index clean | — | — | CP-01 |
| CP-01 | Discovery & baseline | ✅ Read all authoritative contracts | — | — | CP-02 |
| CP-02 | RED tests | ✅ New payload test + real component test written | `useCorporateEvidenceUploads.test.ts`, `beneficialOwnerEvidenceIntegration.test.ts`, `viteSsrTestHelper.ts` | — | CP-03 |
| CP-03 | GREEN implementation | ✅ All 105 tests pass | — | — | CP-04 |
| CP-04 | TypeScript & zero-warning lint | ✅ 0 TS errors, 0 lint warnings | `tsconfig.phase2-tests.json`, test files | — | CP-05 |
| CP-05 | DBB/DBS correction | ✅ 3.A.1.5 marked superseded, 3.A.1.6 created | `BATCH_3_A_1_5.md`, `BATCH_3_A_1_5_DBS.md`, `BATCH_3_A_1_6.md`, `BATCH_3_A_1_6_DBS.md` | — | CP-06 |
| CP-06 | Clean-candidate map generation | ✅ Both maps regenerated from clean tree | `SYMBOLS_MAP.md`, `SQL_SECURITY_SYMBOLS.md` | — | CP-07 |
| CP-07 | Full verification & two-axis review | ✅ All gates pass | — | — | CP-08 |
| CP-08 | Exact staging & commit | ⏳ Pending | — | — | Commit |

## Finding → Fix → Behavioral Test Matrix

| Finding (3.A.1.5 Audit) | Fix (3.A.1.6) | Behavioral Test |
|------------------------|---------------|-----------------|
| 1. Ref-isolation fake test | Real production component via Vite SSR | `BeneficialOwnerEvidencePanel ref isolation: production component renders with isolated file inputs per instance` |
| 2. No exact finalize payload test | Capture invokeFunction calls | `production gateway factory: exact prepare/finalize invoke payload shape — no double body wrapper` |
| 3. Lint warnings | Fix all unused vars/params | `npm run lint` → 0 warnings |
| 4. Whitespace failures | Clean all trailing whitespace | `git diff --check` passes |
| 5. Dirty symbol maps | Clean candidate generation | `generate_symbol_map.mjs --check` passes |
| 6. Stale DBB/DBS | Factual 3.A.1.6 docs | New docs with actual results |

## Commands & Actual Results

```bash
# Phase 2 tests (105 pass, 0 fail)
npm run test:phase2                           # 105 pass
npm run typecheck:phase2-tests                # 0 errors

# Handler tests
node --test --test-isolation=none supabase/functions/corporate-intake/handler.test.ts    # 21 pass
node --test --test-isolation=none supabase/functions/corporate-evidence/handler.test.ts  # 10 pass

# Build & lint
npx tsc -b                                    # passes
npm run build                                 # passes (chunk size warning only)
npm run lint                                  # 0 warnings, 0 errors

# Symbol maps (clean candidate)
node Tools/generate_symbol_map.mjs            # generates maps from clean candidate
node Tools/generate_symbol_map.mjs --check    # check passes (exit 0)
node --test --test-isolation=none Tools/symbol_map_lib.test.mjs  # 7 pass

# Git
git diff --check                              # passes (no trailing whitespace)
git diff --cached --check                     # passes
```

## Exact Intended Committed File List

**Modified:**
- `justifiqa-frontend/src/services/corporateEvidenceService.ts` (unchanged from 3.A.1.5 — finalize contract correct)
- `justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts` (fake tests removed, real behavioral tests added)
- `justifiqa-frontend/test/useCorporateEvidenceUploads.test.ts` (exact payload regression test added, unused params fixed)
- `justifiqa-frontend/test/corporateIntakeModel.test.ts` (unused import removed)
- `justifiqa-frontend/test/viteSsrTestHelper.ts` (new — Vite SSR loader for real TSX components)
- `justifiqa-frontend/tsconfig.phase2-tests.json` (weakening overrides removed)

**Generated (clean candidate):**
- `MarkDown/SYMBOLS_MAP.md`
- `MarkDown/SQL_SECURITY_SYMBOLS.md`

**Documentation:**
- `MarkDown/Batches/BATCH_3_A_1_5.md` (corrected: marked SUPERSEDED BY 3.A.1.6)
- `MarkDown/Batches/BATCH_3_A_1_5_DBS.md` (corrected: marked SUPERSEDED BY 3.A.1.6)
- `MarkDown/Batches/BATCH_3_A_1_6.md` (this file)
- `MarkDown/Batches/BATCH_3_A_1_6_DBS.md` (Indonesian explanation)

## Limitations Nyata

1. State retry evidence hanya hidup selama sesi halaman; persistensi lintas reload bukan scope batch ini.
2. Test React menampilkan deprecation notice dari `react-test-renderer`; bukan warning lint dan tidak mengubah assertion.
3. Vite SSR server startup adds ~1s to test run; acceptable for behavioral verification.
4. Tidak ada perubahan migration/RPC/RLS/ACL, payment webhook, Notary, e-KYC, Qualifa, atau Edge Function Batch 3.B.
5. Clean snapshot verification di Windows sandbox mungkin gagal spawn EPERM; perlu dijalankan di luar sandbox jika gagal.

## Next Exact Action

External controller audit of the resulting commit.

## Status

**READY FOR EXTERNAL RE-AUDIT** (bukan PASS)