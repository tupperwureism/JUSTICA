# Batch 3.A.1.3 — Evidence Replay and Frontend Validation Hardening

## Status

- Fixed point: `7fb5dd0b4209abee60712af014caa396c00a54b4`
- Branch: `batch-3a-corporate-intake`
- Scope: forward correction lokal; tanpa deploy, push, merge, migration, atau Batch 3.B
- External Controller Audit: **PENDING**

## Empat Temuan External Audit

1. **Retry upload macet ketika Storage sebenarnya berhasil tetapi respons hilang** — Upload menggunakan `upsert:false`; jika object tersimpan tetapi respons upload hilang, client masih menyimpan checkpoint `PREPARED`; retry mengunggah path yang sama; Storage mengembalikan duplicate `409`; implementasi sekarang mengubah duplicate tersebut menjadi error biasa, sehingga finalize tidak pernah dicapai.

2. **Service Corporate Intake menerima attempt identifier invalid** — `orderId` dan `idempotencyKey` tidak divalidasi di boundary publik `submitCorporateIntake`; invalid identifier bisa mencapai actor/gateway call.

3. **Initial clientRowId digunakan ulang antar-Wizard dan file input memakai global DOM lookup** — `EMPTY_INTAKE_DRAFT` adalah module-level singleton dengan `clientRowId` yang sama; `BeneficialOwnerEvidencePanel` menggunakan `document.getElementById(...)` untuk memicu file input.

4. **Test Phase 2 baru belum lulus narrow TypeScript typecheck** — Tidak ada `tsconfig.phase2-tests.json` dan script `typecheck:phase2-tests`; test files menggunakan `globalThis.IS_REACT_ACT_ENVIRONMENT = true` tanpa deklarasi tipe.

## Checkpoint dan Next Exact Action

| Checkpoint | Action | Status |
|------------|--------|--------|
| C1 | Fix ambiguous Storage success handling (recognize StorageApiError, duplicate allowlist) | ✅ Completed |
| C2 | Add attempt identifier validation at submitCorporateIntake boundary | ✅ Completed |
| C3 | Replace global EMPTY_INTAKE_DRAFT with factory createEmptyCorporateIntakeDraft | ✅ Completed |
| C4 | Fix BeneficialOwnerEvidencePanel to use React ref instead of document.getElementById | ✅ Completed |
| C5 | Add tsconfig.phase2-tests.json and typecheck:phase2-tests script | ✅ Completed |
| C6 | Fix globalThis.IS_REACT_ACT_ENVIRONMENT typing with test-globals.d.ts | ✅ Completed |
| C7 | Run all verification gates (test:phase2, typecheck:phase2-tests, handler tests, symbol map) | ✅ Completed |
| C8 | Create DBB and DBS documentation | 🔄 In Progress |
| C9 | Run clean snapshot verification | ⏳ Pending |
| C10 | Review and commit | ⏳ Pending |

**Next Exact Action:** Create clean snapshot archive and run verification from clean snapshot.

## Resolution Matrix

| Finding | File/Symbol | Behavioural Test | Status |
|---------|-------------|------------------|--------|
| 1. Ambiguous Storage success | `corporateEvidenceService.ts`: `parseStorageDuplicateCode`, `uploadEvidence` | `useCorporateEvidenceUploads.test.ts`: 7 new tests for ambiguous success | ✅ |
| 2. Attempt identifier validation | `phase2IntegrationService.ts`: `submitCorporateIntake` UUID validation | `intakeIdempotencyConflict.test.ts`: 3 new tests for invalid identifiers | ✅ |
| 3. Fresh draft identity & file input | `corporateIntake.ts`: `createEmptyCorporateIntakeDraft`; `BeneficialOwnerEvidencePanel.tsx`: `useRef` | `corporateIntakeModel.test.ts`: factory uniqueness; `useCorporateEvidenceUploads.test.ts`: ref isolation | ✅ |
| 4. Typecheck Phase 2 tests | `tsconfig.phase2-tests.json`, `package.json` script; `test/test-globals.d.ts` | `npm run typecheck:phase2-tests` passes | ✅ |

## Commands Actually Run

```bash
# Test runs
npm run test:phase2                           # 91 tests pass
npm run typecheck:phase2-tests                # TypeScript strict check passes
node --test --test-isolation=none supabase/functions/corporate-intake/handler.test.ts    # 21 pass
node --test --test-isolation=none supabase/functions/corporate-evidence/handler.test.ts  # 10 pass

# TypeScript build
npx tsc -b                                    # passes
npm run build                                 # passes (warnings: chunk size, dynamic import)

# Lint
npm run lint                                  # 0 warnings, 0 errors

# Symbol map
node Tools/generate_symbol_map.mjs            # generates maps
node Tools/generate_symbol_map.mjs --check    # check passes
node --test --test-isolation=none Tools/symbol_map_lib.test.mjs  # 7 pass
```

## Batch File List

**Modified:**
- `justifiqa-frontend/src/services/corporateEvidenceService.ts`
- `justifiqa-frontend/src/hooks/useCorporateEvidenceUploads.ts` (no changes needed)
- `justifiqa-frontend/src/services/phase2IntegrationService.ts`
- `justifiqa-frontend/src/models/corporateIntake.ts`
- `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx`
- `justifiqa-frontend/src/components/corporate/BeneficialOwnerEvidencePanel.tsx`
- `justifiqa-frontend/src/components/corporate/BeneficialOwnerFields.tsx`
- `justifiqa-frontend/src/components/corporate/corporateUiModel.ts`
- `justifiqa-frontend/package.json`
- `justifiqa-frontend/tsconfig.phase2-tests.json` (new)
- `justifiqa-frontend/test/test-globals.d.ts` (new)
- `justifiqa-frontend/test/useCorporateEvidenceUploads.test.ts`
- `justifiqa-frontend/test/intakeIdempotencyConflict.test.ts`
- `justifiqa-frontend/test/phase2IntegrationService.test.ts`
- `justifiqa-frontend/test/corporateIntakeIntegration.test.ts`
- `justifiqa-frontend/test/usePhase2Hooks.test.ts`
- `justifiqa-frontend/test/evidenceUploadFeedback.test.ts`
- `justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts`

**Staged for Commit:**
All modified files above plus new files.

**Explicitly NOT Staged (unrelated user changes):**
- `supabase/functions/payment-webhook/index.ts`
- `justifiqa-frontend/src/pages/DevShowcasePage.tsx`
- `justifiqa-frontend/src/components/client/AccountSettingsTab.tsx`
- `justifiqa-frontend/src/components/client/AdvocateProfileDetailModal.tsx`
- `justifiqa-frontend/src/components/client/CheckoutEscrowModal.tsx`
- `justifiqa-frontend/src/components/client/ClientTabNav.tsx`
- `justifiqa-frontend/src/components/common/PreChatMoUModal.tsx`
- `justifiqa-frontend/src/components/gateway/AdvocateQuickProfile.tsx`
- `justifiqa-frontend/src/data/clientAdvocates.ts`
- `justifiqa-frontend/src/index.css`
- `justifiqa-frontend/src/pages/AdvocateDashboardPage.tsx`
- `justifiqa-frontend/src/pages/ClientDashboardPage.tsx`
- `justifiqa-frontend/src/router/AppRouter.tsx`
- `justifiqa-frontend/src/types/client.ts`
- `.agents/AGENTS.md`
- `MarkDown/DOMAIN_COMPLIANCE_MATRIX.md`
- Deleted Diagram/*, database/*, etc. (user cleanup)

## Limitations Nyata

1. State retry evidence hanya hidup selama sesi halaman; persistensi lintas reload bukan scope batch ini.
2. Test React menampilkan deprecation notice dari `react-test-renderer`; bukan warning lint dan tidak mengubah assertion.
3. Tidak ada perubahan migration/RPC/RLS/ACL, payment webhook, Notary, e-KYC, Qualifa, atau Edge Function Batch 3.B.
4. Clean snapshot verification di Windows sandbox mungkin gagal spawn EPERM; perlu dijalankan di luar sandbox jika gagal.

## Status Akhir

**READY FOR EXTERNAL RE-AUDIT**