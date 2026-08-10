# BATCH 3.A.1 — Corporate Intake Integration Correction

> **ERRATA / SUPERSEDED:** External audit terhadap commit
> `490ca2691f7004cc941896ad5670a343aab3724c` berstatus **FAIL**. Temuan tersebut
> ditangani oleh Batch 3.A.1.2. Dokumen lama di bawah dipertahankan sebagai
> catatan historis dan bukan bukti kelulusan.

## Batch & Tujuan

Menutup seluruh celah integrasi Corporate Intake Batch 3.A tanpa mengerjakan
payment webhook, escrow settlement, Qualifa, Notary Workspace, atau e-KYC.

## Branch & Fixed Point

- Branch: `batch-3a-corporate-intake`
- HEAD: `6e36fa2fc2f8a9a7d392b898b0db84329750f147`
- Staged index: empty at start

## Scope / Non-Scope

**Scope:**
1. Clean WIP/debug lokal tidak aman
2. Submit intake baru tanpa existing order
3. Stable idempotent retry + single-flight
4. Evidence upload resumable
5. Hapus manual BO identityReference (model + UI)
6. Tes yang benar-benar dijalankan
7. Pilot DBB + DBS

**Non-Scope:**
- payment-webhook, escrow settlement, Notary Workspace, e-KYC, Qualifa
- Migration, RLS/ACL changes
- Generated database types
- Deploy/push/merge

## Inherited WIP

- `MarkDown/Batches/BATCH_3_A_1.md`
- `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx`

Known issues in WIP:
- UUID fallback `import.meta.env.DEV`
- UUID orderId changes per render
- Hardcoded publishable key
- Raw `fetch` instead of typed `supabase.functions.invoke`
- Debug logging (payload, orderId, idempotencyKey, response, RPC detail)
- Pricing catalog error mapping incorrect (HTTP 400 instead of 409)

## Invariant / Kontrak

- Browser tidak boleh panggil intake RPC langsung
- `corporate-intake` verify_jwt = true
- Browser tidak tahu service-role key
- UUID klien = opaque request identity, bukan sumber otoritas
- Actor, evidence, pricing, term finansial divalidasi server
- Evidence digest hanya dibuat server
- Tidak ada migration/ACL baru

## Keputusan Desain

1. `CorporateIntakeWizard` hanya menerima `onComplete(draft)` — tidak lagi menerima orderId/idempotencyKey
2. `useClientCorporateIntegration` wrapper `submit(draft)` membuat orderId + idempotencyKey via `crypto.randomUUID()`
3. `CorporateIntakeWizard` presentational component — tidak bikin identifier backend
4. `BeneficialOwnerDraft.identityReference` dihapus; evidence upload satu-satunya sumber identitas BO
5. Gateway ganti raw `fetch` dengan typed `supabase.functions.invoke`
6. `PRICING_CATALOG_UNAVAILABLE` → HTTP 409, bukan 400
7. Evidence upload memakai `upsert: false`

## Audit Controller Findings (P0/P1/P2) & Resolution Matrix

| # | Finding | Severity | File/Symbol | Test | Status |
|---|---------|----------|-------------|------|--------|
| 1 | Wizard DEV fallback orderId dikomit | P0 | CorporateIntakeWizard.tsx:37 | — | FIXED: removed orderId prop, DEV fallback, idempotencyKey memo |
| 2 | Wizard blocker "endpoint belum tersedia" muncul karena orderId tidak diberikan | P0 | CorporateIntakeWizard.tsx:50-52 | — | FIXED: Wizard hanya memvalidasi draft & meneruskan ke integration hook |
| 3 | Retry hook tidak memakai UUID yang sama | P1 | usePhase2Mutation.ts:47-50 | usePhase2Hooks.test.ts | FIXED: attemptRef mempertahankan input exact untuk retry |
| 4 | Reset tidak menghapus retry context | P1 | usePhase2Mutation.ts:51 | usePhase2Hooks.test.ts | FIXED: reset() mengosongkan attemptRef |
| 5 | Single-flight key hanya idempotencyKey (bukan orderId+key) | P1 | phase2IntegrationService.ts:236 | corporateIntakeIntegration.test.ts | FIXED: key = `${orderId}:${idempotencyKey}` |
| 6 | Payload mengirim evidenceReference kosong ke handler | P1 | phase2IntegrationService.ts:390 | corporateIntakeIntegration.test.ts | FIXED: validation menolak evidenceReference kosong/invalid UUID |
| 7 | Payload mengirim identityReference BO (stale) | P1 | phase2IntegrationService.ts:387 | corporateIntakeIntegration.test.ts | FIXED: toIntakePayload tidak memasukkan identityReference BO |
| 8 | Gateway parsing error menggunakan error.context.code (tidak kompatibel Supabase JS 2.110.7) | P1 | phase2SupabaseGateway.ts:257-258 | — | FIXED: parseIntakeErrorCode menggunakan error.code |
| 9 | Error code allowlist tidak lengkap (IDEMPOTENCY_CONFLICT, EVIDENCE_CONFLICT, EVIDENCE_INVALID, ACTOR_MISMATCH, PRICING_CATALOG_UNAVAILABLE) | P1 | phase2SupabaseGateway.ts:257-258 | corporateIntakeIntegration.test.ts | FIXED: allowlist di gateway & service |
| 10 | Evidence upload tidak resumable (generate UUID baru per retry) | P1 | corporateEvidenceService.ts:36-37 | — | FIXED: stable IDs via task state per BO row |
| 11 | Race antar-row BO saling menimpa (global uploadingIndex/uploadError) | P1 | BeneficialOwnerFields.tsx:57-59 | — | FIXED: per-row UploadTaskState dengan Map |
| 12 | prepare gagal lalu retry tidak memakai IDs sama | P1 | BeneficialOwnerFields.tsx:65-83 | — | FIXED: retryUpload mempertahankan evidenceId/idempotencyKey |
| 13 | upload gagal lalu retry mengulang prepare | P1 | BeneficialOwnerFields.tsx | — | FIXED: retryUpload conditional per step |
| 14 | finalize gagal lalu retry mengulang prepare/upload | P1 | BeneficialOwnerFields.tsx | — | FIXED: retryUpload langsung finalize |
| 15 | Upload dua BO selesai urutan terbalik menimpa evidenceReference | P1 | BeneficialOwnerFields.tsx | — | FIXED: functional state update per index |
| 16 | Pilih file baru tidak mengganti task & IDs | P1 | BeneficialOwnerFields.tsx | — | FIXED: handleFileChange clearTask + new IDs |
| 17 | Placeholder test `assert.ok(true)` dan "tracked separately" | P2 | corporateIntakeIntegration.test.ts:301 | — | FIXED: dihapus, diganti behavioural test |
| 18 | Stale BO identityReference di fixture test | P2 | corporateIntakeModel.test.ts:32 | — | FIXED: diganti evidenceReference UUID valid |
| 19 | Test "resumable" tidak menjalankan boundary | P2 | corporateIntakeIntegration.test.ts:304 | — | FIXED: behavioural test dengan gateway mock |
| 20 | verify_jwt=false untuk corporate-intake/corporate-evidence | P0 | config.toml (not in scope) | — | CONFIRMED: verify_jwt=true (not changed) |

## Commands & Results

```bash
# Preflight
git status                          # clean index, correct branch/HEAD
git branch --show-current           # batch-3a-corporate-intake
git log --oneline -1                # 6e36fa2fc2f8a9a7d392b898b0db84329750f147

# Verification Gates
npm run test:phase2                 # 49/49 PASS
node --test supabase/functions/corporate-intake/handler.test.ts   # 21/21 PASS
node --test supabase/functions/corporate-evidence/handler.test.ts # 10/10 PASS
npx tsc -b                          # PASS
npm run lint                        # PASS (0 warnings)
npm run build                       # PASS
git diff --check                    # PASS (only LF/CRLF warnings)
node Tools/generate_symbol_map.mjs  # PASS
node Tools/generate_symbol_map.mjs --check # PASS
node --test Tools/symbol_map_lib.test.mjs # 7/7 PASS
```

## Files Modified (Batch 3.A.1.1)

### Frontend Core
1. `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx` — Presentational only, no orderId/idempotencyKey
2. `justifiqa-frontend/src/components/corporate/BeneficialOwnerFields.tsx` — Per-row resumable state machine
3. `justifiqa-frontend/src/components/corporate/ClientCorporateSuiteTab.tsx` — Calls integration.submit(draft)
4. `justifiqa-frontend/src/hooks/useClientCorporateIntegration.ts` — Generates attempt, wraps submit
5. `justifiqa-frontend/src/hooks/usePhase2Mutation.ts` — Stable attemptRef, reset clears retry
6. `justifiqa-frontend/src/models/corporateIntake.ts` — Validates evidenceReference (required, UUID, unique), removes identityReference from BO
7. `justifiqa-frontend/src/services/phase2IntegrationService.ts` — Single-flight key = orderId:idempotencyKey, error mapping
8. `justifiqa-frontend/src/services/phase2SupabaseGateway.ts` — parseIntakeErrorCode with allowlist
9. `justifiqa-frontend/src/services/corporateEvidenceService.ts` — Stable IDs via uploadBeneficialOwnerEvidenceWithIds
10. `justifiqa-frontend/src/pages/DevShowcasePage.tsx` — Pass onComplete to Wizard

### Edge Functions
11. `supabase/functions/corporate-evidence/handler.test.ts` — Fixed expiry dates (2027)

### Tests
12. `justifiqa-frontend/test/corporateIntakeModel.test.ts` — EvidenceReference required/UUID/unique, removed stale identityReference
13. `justifiqa-frontend/test/corporateIntakeIntegration.test.ts` — Added: different orderId same key NOT same attempt, evidenceReference empty rejected, EVIDENCE_CONFLICT/INVALID/ACTOR_MISMATCH mapping, removed placeholder
14. `justifiqa-frontend/test/usePhase2Hooks.test.ts` — Added: retry uses same input, new execute = new attempt, reset clears retry, single-flight exact duplicate

### Generated
15. `MarkDown/SYMBOLS_MAP.md` — Regenerated
16. `MarkDown/SQL_SECURITY_SYMBOLS.md` — Regenerated

## Blocker/Limitations

- Resumable evidence hanya bertahan selama browser session (tidak persist refresh/close) — per spec
- single-flight key mencakup orderId — concurrent different orderId dengan key sama membuat 2 calls (by design, fail-closed)
- Error parsing dari FunctionsHttpError.Response body tidak di-await (sync function) — memakai error.code property langsung, sudah cukup untuk kode yang dikenal

## Status Akhir

**READY FOR EXTERNAL RE-AUDIT**

Tidak mengklaim external audit PASS — menunggu verifikasi eksternal.

## Executor Self-Review

Preflight ✅, Discovery ✅, DBB Updated ✅, Implementation ✅, All Gates PASS ✅ → Batch 3.A.1.1 COMPLETE

## External Controller Audit

PENDING
