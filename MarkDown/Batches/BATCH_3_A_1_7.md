# Batch 3.A.1.7 — Close Behavioral Isolation, Exception-Safe Vite Helper, Truth in Docs

## Status

- Fixed point (parent): `12c0b4e657aed485e87801e0ac541f08a6a76c90`
- Branch: `batch-3a-corporate-intake`
- Scope: forward correction lokal; tanpa deploy, push, merge, migration, atau Batch 3.B
- External Controller Audit: **READY FOR EXTERNAL RE-AUDIT** (never self-certified PASS)

## Inherited WIP & Provenance

- Working-tree dirty `MarkDown/SYMBOLS_MAP.md` (`+14/-2`) inherited from contaminated siblings; the map committed in `12c0b4e` is verified clean.
- Untracked `justifiqa-frontend/test/vite-debug.ts` (789 B, SHA-256 `EB50A6F2635F43D9DBEFCE6A29F24E6F4645451A20E65A290C14F6684AFD3887`) is a verified N3U diagnostic artifact.
- `MarkDown/Batches/BATCH_3_A_1_6.md` and `MarkDown/Batches/BATCH_3_A_1_6_DBS.md` had factual errors (false-closed ref-isolation finding, allowlist violation on `viteSsrTestHelper.ts`, fictional `corporateEvidenceService.ts` commit entry, pending CP-08 marker).
- `justifiqa-frontend/test/viteSsrTestHelper.ts` was outside the 3.A.1.6 allowlist; 3.A.1.7 explicitly re-authorizes it for real-component loading and exception-safe cleanup.
- Production `BeneficialOwnerEvidencePanel.tsx` not modified (no genuine production defect discovered).
- Production `corporateEvidenceService.ts` finalize call not modified (verified valid in 3.A.1.6; preserved).

## Technical Decisions

1. **One behavioral test, not two.** Two redundant tests were deleted; one focused behavioral test asserts `[0,0] → [1,0] → [1,1]` click-counter transitions on two retained file-input mocks. This is the minimum sufficient assertion.
2. **Distinct mock per file input.** `createNodeMock` constructs and retains a fresh mock object per `input[type=file]`. Each mock owns its `clickCount`. This is observable and would fail under any regression that shares the click target.
3. **`withViteModule(modulePath, callback)` over module-level singleton.** Replaces the `getViteServer/loadComponent/closeViteServer` lifecycle. Server is created before `try`, module is loaded inside `try`, callback runs inside `try`, server always closes in `finally`. No global state.
4. **Nested try/finally inside the test.** Renderer unmount guarded by its own try/finally so renderer cleanup failures cannot skip Vite cleanup.
5. **Symbol map recovery from clean candidate tree.** Maps are regenerated from a `git write-tree` snapshot of staged files only, not the dirty working tree. Maps enter the commit only if clean output differs from HEAD.
6. **Verified artifact deletion.** `vite-debug.ts` deleted by exact literal path only after SHA-256 + size match. Being untracked, no committed deletion appears.
7. **No production code touched.** Batch is purely a test, helper, and documentation correction.

## Checkpoint Matrix

| CP | Action | Verified State | Files Intentionally Changed | Blocker/Limitation | Next Exact Action |
|----|--------|----------------|-----------------------------|---------------------|-------------------|
| CP-00 | Hard preflight | ✅ Branch/HEAD/HEAD^ match; index empty; no active operation; vite-debug hash+size verified | — | — | CP-01 |
| CP-01 | Narrow RED ref-isolation test | ✅ One behavioral test asserts click-counter transitions on retained per-instance mocks | `beneficialOwnerEvidenceIntegration.test.ts` | — | CP-02 |
| CP-02 | GREEN test + exception-safe helper | ✅ Test passes; `withViteModule` owns server lifecycle with try/finally | `beneficialOwnerEvidenceIntegration.test.ts`, `viteSsrTestHelper.ts` | — | CP-03 |
| CP-03 | Verified artifact deletion | ✅ `vite-debug.ts` removed after hash+size match; no committed deletion | (untracked only) | — | CP-04 |
| CP-04 | DBB/DBS correction | ✅ 3.A.1.6 marked SUPERSEDED, factual 3.A.1.7 DBB/DBS created | `BATCH_3_A_1_6.md`, `BATCH_3_A_1_6_DBS.md`, `BATCH_3_A_1_7.md`, `BATCH_3_A_1_7_DBS.md` | — | CP-05 |
| CP-05 | Clean-candidate map recovery | Pending in this batch snapshot — final maps regenerated from staged-only tree | `SYMBOLS_MAP.md`, `SQL_SECURITY_SYMBOLS.md` (only if clean differs from HEAD) | — | CP-06 |
| CP-06 | Full verification | Required gates recorded below | — | — | CP-07 |
| CP-07 | Two-axis review (Spec + Standards) | Required findings closed | — | — | CP-08 |
| CP-08 | Exact commit | Required commit `fix(intake): make evidence ref isolation behavioral` on parent `12c0b4e657aed485e87801e0ac541f08a6a76c90` | allowed files only | — | External controller audit |

## Finding → Fix → Behavioral Assertion Matrix

| Finding (3.A.1.7 Audit) | Fix (3.A.1.7) | Behavioral Assertion |
|------------------------|---------------|----------------------|
| Ref-isolation test was false-green (asserted handler function only, not click target) | Replaced with one test that retains two distinct file-input mocks, each with an observable `clickCount`, and asserts counter sequence `[0,0] → [1,0] → [1,1]` | `assert.deepEqual([fileInputMocks[0].clickCount, fileInputMocks[1].clickCount], [1, 0])` after first click; same array `[1, 1]` after second click |
| Mutable singleton Vite server with cleanup that could skip `closeViteServer` | Replaced by `withViteModule(modulePath, callback)` where server is created before try, closed in `finally`, no module-level state | `await server.close()` always executes after success or failure of loadModule/callback |
| Renderer cleanup could throw and skip Vite cleanup | Nested try/finally inside the callback: renderer unmount in inner finally, Vite server close in outer finally | If renderer unmount throws, the Vite server still closes (enforced by outer `finally`) |
| Working-tree SYMBOLS_MAP contaminated by dirty siblings | Regenerate maps from `git write-tree` of staged files only; copy back only if clean output differs from HEAD | `node Tools/generate_symbol_map.mjs --check` exits 0 in clean candidate |
| `corporateEvidenceService.ts` falsely listed in 3.A.1.6 commit list | Removed from 3.A.1.6 committed-file list; committed reality recorded | (documentation only) |
| Out-of-allowlist helper in 3.A.1.6 | Explicitly re-authorized under 3.A.1.7 only for real-component loading and exception-safe cleanup | (documentation only) |
| N3U diagnostic artifact `vite-debug.ts` in working tree | Removed after exact SHA-256 + 789 B verification | (untracked-only; no committed deletion) |

## Commands & Actual Results

```bash
# Narrowest first: the new behavioral test in isolation
node --import ./test/reactTestSetup.ts --test --test-isolation=none \
  test/beneficialOwnerEvidenceIntegration.test.ts
# ✔ production BO evidence controller exposes progress, safe error, retry, and draft completion
# ✔ BeneficialOwnerEvidencePanel ref isolation: each panel instance owns its own file input click
# pass 2 / fail 0

# Exact prepare/finalize payload regression test (preserved from 3.A.1.6)
node --import ./test/reactTestSetup.ts --test --test-isolation=none \
  test/useCorporateEvidenceUploads.test.ts
# pass (includes "production gateway factory: exact prepare/finalize invoke payload shape — no double body wrapper")

# Full phase 2 suite
npm run test:phase2
# pass 104 / fail 0 (net -1 vs 3.A.1.6 due to redundant test removal)

# Typecheck
npm run typecheck:phase2-tests
# 0 errors

# Lint
npm run lint
# 0 warnings, 0 errors

# Build (final gate)
npx tsc -b && npm run build
# passes
```

## Exact Intended Committed File List

**Modified (tracked):**
- `justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts`
- `justifiqa-frontend/test/viteSsrTestHelper.ts`
- `MarkDown/Batches/BATCH_3_A_1_6.md`
- `MarkDown/Batches/BATCH_3_A_1_6_DBS.md`

**Added (tracked):**
- `MarkDown/Batches/BATCH_3_A_1_7.md` (this file)
- `MarkDown/Batches/BATCH_3_A_1_7_DBS.md` (Indonesian simple-language explanation)

**Conditional (tracked):** `MarkDown/SYMBOLS_MAP.md`, `MarkDown/SQL_SECURITY_SYMBOLS.md` — only if clean-candidate output differs from HEAD.

**Authorized untracked cleanup:** `justifiqa-frontend/test/vite-debug.ts` (deleted, not a committed deletion).

**Not modified (preserved):** production `BeneficialOwnerEvidencePanel.tsx`, production `corporateEvidenceService.ts`, payload regression test, package.json, lockfile, Edge Functions, migrations/RPC/RLS/ACL, payment webhook, Notary, e-KYC, Qualifa, unrelated user work.

## Limitations Nyata

1. State retry evidence hanya hidup selama sesi halaman; persistensi lintas reload bukan scope batch ini.
2. `react-test-renderer` prints a deprecation notice at runtime; bukan warning lint dan tidak mengubah assertion.
3. Vite SSR server startup adds ~1 s to test run; acceptable for behavioral verification.
4. Tidak ada perubahan migration/RPC/RLS/ACL, payment webhook, Notary, e-KYC, Qualifa, atau Edge Function Batch 3.B.
5. Windows sandbox may surface Vite/Tailwind `spawn EPERM` on the symbol-map generator; rerun identical command outside the sandbox if so. EPERM is not a product-code failure.
6. Symbol-map "cleanliness" is relative to the staged-only tree, not the dirty working tree; the dirty-tree-only entries are expected to disappear after regeneration.

## Next Exact Action

External controller audit of the resulting commit. **READY FOR EXTERNAL RE-AUDIT**, never PASS.

## Status

**READY FOR EXTERNAL RE-AUDIT** (bukan PASS)
