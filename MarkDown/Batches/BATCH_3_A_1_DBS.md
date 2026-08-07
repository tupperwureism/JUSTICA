# BATCH 3.A.1 DBS — Domain Brief Summary

Materi pembelajaran dari Batch 3.A.1 Corporate Intake Correction. Bahasa Indonesia sederhana, contoh kecil, mini-checklist/quiz, sitasi file & symbol.

---

## 1. Presentational Component vs Integration Hook

**Masalah:** `CorporateIntakeWizard` sebelumnya mencampur UI + pembuatan identifier backend (orderId, idempotencyKey). Ini melanggu *separation of concerns* dan membuat tes sulit.

**Solusi:**
- **Wizard (presentational):** Hanya menerima `onComplete(draft)`, memvalidasi step, mencegah double-submit via `submitting`, tidak tahu orderId/idempotencyKey.
- **Integration hook (`useClientCorporateIntegration`):** Wrapper `submit(draft)` yang generate `orderId` + `idempotencyKey` via `crypto.randomUUID()`, lalu memanggil service.

```
CorporateIntakeWizard (UI)
    └─ onComplete(draft)
           ↓
useClientCorporateIntegration.submit(draft)
    └─ attempt = { draft, orderId, idempotencyKey }
           ↓
phase2IntegrationService.submitCorporateIntake(attempt)
```

**Mini-checklist:**
- [ ] Component tidak import `crypto.randomUUID()`
- [ ] Component tidak terima `orderId`/`idempotencyKey` prop
- [ ] Hanya validate + forward draft
- [ ] Tes: `valid final step → onComplete(draft)` tanpa orderId prop

**File:** `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx:14-24`, `justifiqa-frontend/src/hooks/useClientCorporateIntegration.ts:15-29`

---

## 2. Idempotency vs Single-Flight

**Idempotency** = server menjamin request yang sama (key sama) diproses sekali saja. Client generate `idempotencyKey` via `crypto.randomUUID()`.

**Single-flight** = client-side dedup: selama request belum selesai, `execute` kedua dengan **input yang sama persis** return promise yang sama, tidak double-call.

**Perbedaan:**
| | Idempotency (Server) | Single-Flight (Client) |
|---|---|---|
| Cakupan | Cross-tab, retry, network retry | Hanya tab aktif, selama loading |
| Kunci | `idempotencyKey` saja | `orderId:idempotencyKey` (exact attempt) |
| TTL | Server-side (days) | Hanya selama promise pending |

**Implementasi:** `phase2IntegrationService.ts:236-263`
```typescript
const existing = inFlightIntake.get(`${input.orderId}:${input.idempotencyKey}`);
if (existing) return existing;
```

**Quiz:**
- Q: Dua `execute({draft, orderId: 'A', idempotencyKey: 'K'})` bersamaan → berapa call ke gateway?
- A: 1 (single-flight)
- Q: `execute({draft, orderId: 'A', idempotencyKey: 'K'})` lalu `execute({draft, orderId: 'B', idempotencyKey: 'K'})` → berapa call?
- A: 2 (orderId berbeda = attempt berbeda, fail-closed)

**Test:** `corporateIntakeIntegration.test.ts:151-171, 374-393`

---

## 3. Stable Attempt Identity Saat Retry

**Rule:** `retry()` harus mengulang **attempt yang sama persis** — draft, orderId, idempotencyKey identik.

**Implementasi:** `usePhase2Mutation.ts:47-50`
```typescript
const attemptRef = useRef<{ input: TInput; hasAttempt: boolean }>({ input: null, hasAttempt: false });

const execute = useCallback((input) => {
  attemptRef.current = { input, hasAttempt: true };
  return runnerRef.current!(input);
}, []);

const retry = useCallback(() => {
  if (!attemptRef.current.hasAttempt) return Promise.reject(...);
  return runnerRef.current!(attemptRef.current.input);
}, []);
```

**Reset behavior:** `reset()` mengosongkan `attemptRef` → `retry()` setelah reset reject aman.

**Test:** `usePhase2Hooks.test.ts:152-207` (stable attempt, new execute = new attempt, reset clears retry)

---

## 4. Supabase FunctionsHttpError & Parsing Response

**Versi:** `@supabase/supabase-js` 2.110.7

**Kontrak error:**
- `FunctionsHttpError.context` = `Response` object
- Kode aplikasi ada di JSON body: `{ "code": "IDEMPOTENCY_CONFLICT", "message": "..." }`
- `FunctionsRelayError` / `FunctionsFetchError` bisa punya `.code` langsung

**Parsing aman (sync):**
```typescript
function parseIntakeErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return null;
}
```

**Allowlist kode yang diteruskan ke UI:**
- `IDEMPOTENCY_CONFLICT`
- `EVIDENCE_CONFLICT`
- `EVIDENCE_INVALID`
- `ACTOR_MISMATCH`
- `PRICING_CATALOG_UNAVAILABLE`

**Sisanya → `INTAKE_SERVER_UNAVAILABLE`** (tidak bocorkan detail SQL/RPC/JWT/orderId).

**File:** `justifiqa-frontend/src/services/phase2SupabaseGateway.ts:45-88`

**Test:** `corporateIntakeIntegration.test.ts:395-418` (maps EVIDENCE_CONFLICT/INVALID, ACTOR_MISMATCH)

---

## 5. Three-Step Resumable Upload State Machine

**State machine per BO row:**
```
NEW → PREPARED → UPLOADED → FINALIZED
```

**Aturan retry:**
| Gagal di step | Retry action |
|---|---|
| PREPARED | Ulangi PREPARE (IDs sama) |
| UPLOADED | Ulangi UPLOAD saja (pakai objectPath yg sudah ada) |
| FINALIZED | Ulangi FINALIZE saja (IDs sama) |

**Implementasi:** `BeneficialOwnerFields.tsx:37-45, 127-205`
- `UploadTaskState` per row (Map by index)
- Stable `evidenceId`, `idempotencyKey`, `objectPath`
- `retryUpload()` conditional pada `task.step`
- File baru → `clearTask()` + generate IDs baru

**Race prevention:** Functional state update per index, bukan global `uploadingIndex`.

**Test:** `corporateIntakeIntegration.test.ts:304-329` (resumable retry preserves evidenceReference)

---

## 6. Opaque Evidence Reference vs Digest & PII Protection

**Kontrak kanonik:**
1. Browser **tidak pernah** kirim NIK/KTP mentah untuk BO
2. BO **tidak punya** `identityReference` manual
3. `corporateParties.identityReference` tetap ada (untuk pihak korporasi)
4. `corporate-evidence/finalize`:
   - Hitung digest dari bytes di server (SHA-256)
   - Return opaque `evidenceReference` (UUID, lowercase evidence_id)
   - **Tidak** return digest
5. Corporate Intake hanya terima opaque `evidenceReference` UUID
6. Intake **tidak** generate digest dari string kosong

**Validasi client:** `corporateIntake.ts:183-202`
```typescript
const evidenceRef = (owner.evidenceReference ?? '').trim();
if (!evidenceRef) issues.push('BENEFICIAL_OWNER_EVIDENCE_REFERENCE_REQUIRED');
else if (!isValidUuid(evidenceRef)) issues.push('BENEFICIAL_OWNER_EVIDENCE_REFERENCE_INVALID');
// case-insensitive duplicate check
```

**Payload final:** `phase2IntegrationService.ts:387-393` — BO kirim `evidenceReference` saja, tanpa `identityReference`/`evidenceDigest`.

**File:** `supabase/functions/corporate-evidence/handler.ts:405` (digest dihitung server), `supabase/functions/corporate-intake/handler.ts:168-181` (parseBeneficialOwner require UUID evidenceReference)

---

## 7. Mengapa Test Double Bisa "Hijau Palsu"

**Pola anti-pattern:**
```typescript
// ❌ Placeholder — selalu hijau
test('resumable upload', () => assert.ok(true));

// ❌ Source regex — tidak menjalankan boundary
test('gateway uses supabase.functions.invoke', () => assert.ok(true, 'tracked separately'));

// ✅ Behavioural — amati public behaviour/output
test('retry uses same attempt', async () => {
  const inputs = [];
  const hook = useMutation(async (v) => { inputs.push(v); throw err; });
  await hook.execute('x').catch();
  await hook.retry();
  assert.deepEqual(inputs, ['x', 'x']); // same input
});
```

**Perbaikan batch ini:**
- Dihapus semua `assert.ok(true)` placeholder
- Dihapus komentar "tracked separately"
- Test baru mengamati: call history, promise identity, error code mapping, state transitions

**Test:** `usePhase2Hooks.test.ts:152-235`, `corporateIntakeIntegration.test.ts:374-418`

---

## Mini-Quiz (Self-Check)

1. **Wizard** props final apa saja? → `onComplete(draft)`, `submitting?`, `error?`, `onRetry?`
2. **Retry** pakai UUID baru? → Tidak, pakai `attemptRef.current.input` (exact same)
3. **Single-flight** key =? → `${orderId}:${idempotencyKey}`
4. **EvidenceReference** kosong boleh sampai handler? → Tidak, divalidasi client (required, UUID, unique)
5. **FunctionsHttpError** parsing pakai `error.context.code`? → Tidak, pakai `error.code` (allowlist)
6. **Upload gagal di finalize** → retry ulang prepare/upload? → Tidak, langsung finalize
7. **Race antar BO** → global `uploadingIndex`? → Tidak, per-row `Map<index, UploadTaskState>`
8. **Placeholder test** boleh? → Tidak, dihapus semua

---

## Situs File/Symbol Kunci

| Area | File | Symbol |
|---|---|---|
| Wizard | `components/corporate/CorporateIntakeWizard.tsx` | `CorporateIntakeWizard` |
| Integration Hook | `hooks/useClientCorporateIntegration.ts` | `useClientCorporateIntegration` |
| Mutation Hook | `hooks/usePhase2Mutation.ts` | `usePhase2Mutation` |
| Model & Validation | `models/corporateIntake.ts` | `validateCorporateIntake`, `BeneficialOwnerDraft` |
| Service | `services/phase2IntegrationService.ts` | `submitCorporateIntake`, `toIntakePayload` |
| Gateway | `services/phase2SupabaseGateway.ts` | `phase2SupabaseGateway.invokeCorporateIntake`, `parseIntakeErrorCode` |
| Evidence Upload | `services/corporateEvidenceService.ts` | `uploadBeneficialOwnerEvidenceWithIds` |
| BO Fields UI | `components/corporate/BeneficialOwnerFields.tsx` | `BeneficialOwnerFields`, `UploadTaskState` |
| Edge Intake | `supabase/functions/corporate-intake/handler.ts` | `createCorporateIntakeHandler`, `parseBeneficialOwner` |
| Edge Evidence | `supabase/functions/corporate-evidence/handler.ts` | `createCorporateEvidenceHandler`, `finalize` |