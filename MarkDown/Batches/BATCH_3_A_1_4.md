# Batch 3.A.1.4 — Close Evidence Replay and Verification Gaps (Post-Audit Correction)

## Status

- Fixed point (parent): `e0e2787a4c0c06b3434385b0479e95baf6b9743e`
- Branch: `batch-3a-corporate-intake`
- Scope: forward correction lokal; tanpa deploy, push, merge, migration, atau Batch 3.B
- External Controller Audit: **PENDING** (re-audit required)

## Tujuh Temuan External Audit (commit e0e2787) yang Ditutup

| # | Temuan | Status | Resolusi |
|---|--------|--------|----------|
| 1 | Corporate Intake Wizard crash: Web Crypto method tanpa receiver | ✅ Fixed | Factory `createEmptyCorporateIntakeDraft` menggunakan wrapper `() => crypto.randomUUID()` yang mempertahankan receiver |
| 2 | Ambiguous Storage retry gagal pada production gateway | ✅ Fixed | Factory `createCorporateEvidenceGateway` dengan DI; raw `StorageApiError` propagates ke `uploadEvidence`; allowlist hanya instance asli |
| 3 | Runtime React test environment tidak diaktifkan | ✅ Fixed | `test/reactTestSetup.ts` di-load via `node --import`; `IS_REACT_ACT_ENVIRONMENT = true` di runtime |
| 4 | Behavioral test factory/ref diklaim tapi belum ada | ✅ Fixed | Test riil: `BeneficialOwnerEvidencePanel` ref isolation (2 panel, tombol independen); factory uniqueness tests |
| 5 | Test typecheck dan dokumentasinya tidak konsisten ("strict" claim) | ✅ Fixed | `tsconfig.phase2-tests.json` extend `tsconfig.app.json`; istilah faktual "Phase 2 test-file typecheck" |
| 6 | Symbol map terkontaminasi dirty working tree | ✅ Fixed | Clean candidate via `git write-tree` + `git archive`; generator di snapshot bersih |
| 7 | DBB/DBS stale serta git diff --check gagal | ✅ Fixed | Docs diperbarui faktual; trailing whitespace dihapus; `git diff --check` lulus |

## Keputusan Teknis Terkunci (Locked)

### B1. Web Crypto Factory & Initial Draft
- **Wrapper receiver:** `const defaultCreateId = () => crypto.randomUUID()`
- **Single UUID per BO:** `createEmptyBeneficialOwner(createId?)` menerima optional `createId`, menghasilkan tepat satu `clientRowId`
- **Factory draft:** `createEmptyCorporateIntakeDraft` memakai `createId` yang sama untuk initial BO
- **Hapus export singleton:** `EMPTY_INTAKE_DRAFT` dihapus dari `models/corporateIntake.ts` dan `corporateUiModel.ts`
- **Lazy init Wizard:** `useState(() => createEmptyCorporateIntakeDraft())`

### B2. Production Storage Duplicate Handling
- **Injectable factory:** `createCorporateEvidenceGateway(dependencies)`
- **Minimal seam:** `invokeFunction(path, body)`, `uploadObject(bucket, objectPath, file, options)`
- **Default deps:** Supabase client yang ada
- **Raw error propagation:** Gateway `upload` melempar `StorageApiError` asli (no wrap)
- **Single duplicate handling:** `uploadEvidence` = satu-satunya tempat allowlist duplicate → finalize
- **Retry semantics:** Sama `evidenceId`, `idempotencyKey`, `objectPath`, `File`, `upsert:false`
- **No leak:** Object path, JWT, SQL/RPC detail, raw error tidak bocor ke UI/log

### B3. React Runtime Test Environment
- **Type declaration:** `globalThis.IS_REACT_ACT_ENVIRONMENT` di `test/test-globals.d.ts`
- **Runtime setup:** `test/reactTestSetup.ts` set `globalThis.IS_REACT_ACT_ENVIRONMENT = true`
- **Load sekali:** `node --import ./test/reactTestSetup.ts` pada script `test:phase2`
- **No more warning:** Output tidak lagi berisi `act(...)` warning

### B4. Phase 2 Test-file Typecheck
- `tsconfig.phase2-tests.json` extend `tsconfig.app.json`
- Include `src` dan `test`
- Node types added
- Separate `tsBuildInfoFile`
- `noEmit`
- Istilah: "Phase 2 test-file typecheck" (bukan "strict")

### B5. Behavioral Ref-Isolation Test
- Render minimal 2 panel `BeneficialOwnerEvidencePanel`
- Setiap tombol hanya memicu input ref panel tersebut
- No source-text regex, no `assert.ok(true)`, no `document.getElementById`

### B6. Historical Documentation Correction
- `BATCH_3_A_1_3.md` dan `BATCH_3_A_1_3_DBS.md` diperbarui faktual
- Status external audit = FAILED/HOLD
- Catat production gateway false-green, factory receiver crash, missing behavioral tests, act warning, symbol-map contamination
- Koreksi klaim "strict"
- Hapus trailing whitespace
- Superseded by Batch 3.A.1.4

## Checkpoint Matrix

| CP | Action | Verified State | Files Changed | Blocker/Limitation | Next Exact Action |
|----|--------|----------------|---------------|-------------------|-------------------|
| C1 | Preflight/discovery | ✅ Branch, HEAD, parent, index clean | — | — | C2 |
| C2 | TDD RED Web Crypto factory | ✅ 6 tests fail (receiver error) | `corporateIntakeModel.test.ts` | — | C3 |
| C3 | Implement factory, remove singleton | ✅ 6 tests pass; 17 total | `corporateIntake.ts`, `corporateUiModel.ts`, `corporateIntakeModel.test.ts` | — | C4 |
| C4 | TDD RED production Storage duplicate | ✅ 5 new tests fail | `useCorporateEvidenceUploads.test.ts` | — | C5 |
| C5 | Implement gateway seam, raw propagation | ✅ 5 tests pass; 21 total | `corporateEvidenceService.ts`, `useCorporateEvidenceUploads.test.ts` | — | C6 |
| C6 | React runtime setup + ref-isolation test | ✅ 2 tests pass; act warning gone | `reactTestSetup.ts`, `package.json`, `beneficialOwnerEvidenceIntegration.test.ts` | react-test-renderer deprecation notice (separate limitation) | C7 |
| C7 | Test-file typecheck correction | ✅ typecheck passes | `tsconfig.phase2-tests.json`, `corporateEvidenceService.ts` | — | C8 |
| C8 | DBB/DBS & historical correction | ✅ Docs updated | `BATCH_3_A_1_3.md`, `BATCH_3_A_1_3_DBS.md`, `BATCH_3_A_1_4.md`, `BATCH_3_A_1_4_DBS.md` | — | C9 |
| C9 | Clean candidate, symbol maps, full gates | ✅ All gates pass | `SYMBOLS_MAP.md`, `SQL_SECURITY_SYMBOLS.md` (regenerated) | — | C10 |
| C10 | Two-axis review, staging, commit | 🔄 In progress | — | — | Commit |

## Finding → Fix → Behavioral Test Matrix

| Finding | Fix | Behavioral Test |
|---------|-----|-----------------|
| 1. Web Crypto receiver crash | Wrapper `() => crypto.randomUUID()` di factory | `createEmptyCorporateIntakeDraft default factory works without receiver error`, `two factory calls produce distinct objects...`, `injected createId called exactly once...`, `createEmptyBeneficialOwner accepts optional createId...` |
| 2. Production Storage false-green | `createCorporateEvidenceGateway` DI; raw `StorageApiError` propagates; allowlist di `uploadEvidence` | `production gateway factory: creates gateway with injected dependencies`, `raw StorageApiError propagates...`, `rejects arbitrary object...`, `rejects generic 409...`, `retry preserves exact File...` |
| 3. React act() not activated | `node --import ./test/reactTestSetup.ts` | `npm run test:phase2` output no `act(...)` warning |
| 4. Missing behavioral tests | `BeneficialOwnerEvidencePanel` ref isolation test (2 panel) | `BeneficialOwnerEvidencePanel ref isolation: each panel button triggers only its own file input` |
| 5. Typecheck/docs inconsistent | `tsconfig.phase2-tests.json` extend `tsconfig.app.json`; "Phase 2 test-file typecheck" | `npm run typecheck:phase2-tests` passes |
| 6. Symbol map contamination | Clean candidate via `git write-tree` + `git archive` | `node Tools/generate_symbol_map.mjs --check` passes |
| 7. DBB/DBS stale, whitespace | Docs updated; trailing whitespace removed | `git diff --check` passes |

## Commands & Actual Results

```bash
# Phase 2 tests
npm run test:phase2                           # 103 tests pass (0 fail)
npm run typecheck:phase2-tests                # 0 errors
node --test --test-isolation=none supabase/functions/corporate-intake/handler.test.ts    # 21 pass
node --test --test-isolation=none supabase/functions/corporate-evidence/handler.test.ts  # 10 pass

# Build & lint
npx tsc -b                                    # passes
npm run build                                 # passes (chunk size warning only)
npm run lint                                  # 7 warnings (unused test vars), 0 errors

# Symbol maps
node Tools/generate_symbol_map.mjs            # generates maps
node Tools/generate_symbol_map.mjs --check    # check passes (exit 0)
node --test --test-isolation=none Tools/symbol_map_lib.test.mjs  # 7 pass

# Git
git diff --check                              # passes (no trailing whitespace in staged files)
```

## Committed File List

**Modified:**
- `justifiqa-frontend/src/models/corporateIntake.ts`
- `justifiqa-frontend/src/components/corporate/corporateUiModel.ts`
- `justifiqa-frontend/src/services/corporateEvidenceService.ts`
- `justifiqa-frontend/src/hooks/useCorporateEvidenceUploads.ts`
- `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx`
- `justifiqa-frontend/src/components/corporate/BeneficialOwnerEvidencePanel.tsx`
- `justifiqa-frontend/package.json`
- `justifiqa-frontend/tsconfig.phase2-tests.json`
- `justifiqa-frontend/test/test-globals.d.ts`
- `justifiqa-frontend/test/reactTestSetup.ts` (new)
- `justifiqa-frontend/test/corporateIntakeModel.test.ts`
- `justifiqa-frontend/test/useCorporateEvidenceUploads.test.ts`
- `justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts`
- `MarkDown/SYMBOLS_MAP.md` (regenerated)
- `MarkDown/SQL_SECURITY_SYMBOLS.md` (regenerated)
- `MarkDown/Batches/BATCH_3_A_1_3.md` (corrected)
- `MarkDown/Batches/BATCH_3_A_1_3_DBS.md` (corrected)
- `MarkDown/Batches/BATCH_3_A_1_4.md` (new)
- `MarkDown/Batches/BATCH_3_A_1_4_DBS.md` (new)

## Limitations Nyata

1. State retry evidence hanya hidup selama sesi halaman; persistensi lintas reload bukan scope batch ini.
2. Test React menampilkan deprecation notice dari `react-test-renderer`; bukan warning lint dan tidak mengubah assertion.
3. Tidak ada perubahan migration/RPC/RLS/ACL, payment webhook, Notary, e-KYC, Qualifa, atau Edge Function Batch 3.B.
4. Clean snapshot verification di Windows sandbox mungkin gagal spawn EPERM; perlu dijalankan di luar sandbox jika gagal.

## Next Exact Action

Commit dengan message: `fix(intake): close evidence replay and verification gaps`

## Status

**READY FOR EXTERNAL RE-AUDIT** (bukan PASS)