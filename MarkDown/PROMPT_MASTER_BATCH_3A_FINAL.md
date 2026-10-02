# [SYSTEM DIRECTIVE: PROMPT MASTER BATCH 3.A — DECISION-COMPLETE & WATERTIGHT v3]
**Role:** Sol xHigh (Architect) → **Target Executor:** Sol High
**Fixed Point (Starting HEAD):** `0283319b792fc5fe8264f8f416a5ffe7e490e2ab`
**Branch Name:** `batch-3a-corporate-intake` (create from fixed point: `git switch -c batch-3a-corporate-intake 0283319b792fc5fe8264f8f416a5ffe7e490e2ab`, commit only here, no merge to main)
**Stop Signal:** After `git commit -m "feat(intake): wire frontend to Edge Functions and remove client hashing"` + all gates green → **Report summary & STOP. Do not proceed to Batch 3.B.**

---

## 0. PRECONDITION VERIFICATION (MANDATORY — VERIFY BEFORE ANY CODE TOUCH)
Executor MUST verify ALL true at fixed point. If ANY false → **STOP, report gap, do not implement.**

- [ ] `supabase/functions/corporate-evidence/handler.ts` EXISTS with endpoints `prepare` & `finalize`.
    - `prepare` accepts `{ evidenceId: string (UUID v4), declaredMime: string, declaredByteSize: number, idempotencyKey: string }` → returns `{ evidenceId, bucketId, objectPath, status, expiresAt, replayed }`.
    - `finalize` accepts `{ evidenceId: string, idempotencyKey: string }` → returns `{ evidenceReference: string, status, expiresAt, replayed }`. `evidenceReference` is UUID lowercase string (identical to `evidenceId`).
- [ ] Migration `20260729115454_protected_beneficial_owner_evidence_boundary.sql` applied locally (`supabase db push`):
    - RPC `fn_create_corporate_intake_from_evidence_atomic` signature final, `SECURITY DEFINER`, `EXECUTE` granted to `service_role` + `postgres`.
    - Param `p_beneficial_owners JSONB` expects array of objects with **snake_case** fields ONLY: `declaration_version`, `natural_person_name`, `evidence_reference` (UUID string), `control_basis`, `percentage`. **Any other field → `CORPORATE_INTAKE_BENEFICIAL_OWNER_FIELD_NOT_ALLOWED`.**
- [ ] Migration `20260729063938_bind_atomic_intake_to_canonical_pricing_catalog.sql` applied — contains `entityType` enum (`PT_ORDINARY | PT_INDIVIDUAL_UMK | CV`), `kbliSnapshot` (array of strings max 16), `corporateParties` shape, `paymentGatewayRef` required ≤64.
- [ ] RPC `fn_create_corporate_intake_from_evidence_atomic` owner is `postgres` (not `service_role`/`anon`) — required for internal call to `fn_create_corporate_intake_from_catalog_atomic` (owner-only via `REVOKE … FROM service_role`). Verify: `SELECT proname, proowner::regrole FROM pg_proc WHERE proname = 'fn_create_corporate_intake_from_evidence_atomic';`
- [ ] Bucket `corporate-intake-evidence` exists in local Supabase (Storage > Buckets), RLS policy `private` (only `service_role` & authenticated via `corporate-evidence` EF).
- [ ] `zod` is **NOT installed** in `justifiqa-frontend/package.json` and **NOT imported** in any Edge Function. Do NOT add zod. Use manual validators (`_shared/validation.ts`) in EF and hand-written TS guards in frontend.

---

## 1. PREFLIGHT & DISCOVERY
- Read `AGENTS.md`, `MarkDown/SYMBOLS_MAP.md`, `MarkDown/SQL_SECURITY_SYMBOLS.md`.
- Verify `HEAD == 0283319b792fc5fe8264f8f416a5ffe7e490e2ab` && staged area clean.
- Read targeted (no blind generation):
    - `supabase/functions/corporate-evidence/handler.ts` (prepare/finalize contract, CORS pattern, DI shape)
    - `supabase/functions/corporate-evidence/index.ts` (verifyUser via `/auth/v1/user`, `callRpc` injection)
    - `supabase/functions/corporate-evidence/handler.test.ts` (test pattern: `Partial<…Dependencies>` overrides, `new Request(...)`)
    - `supabase/functions/_shared/validation.ts` (manual validators available: `requireRecord`, `rejectUnknownKeys`, `requireString`, `requireUuid`, `requireEnum`, `requireInteger`)
    - `supabase/functions/_shared/http.ts` (`HttpError`, `jsonResponse`, `readJsonBody`, `errorResponse`)
    - `supabase/functions/_shared/rest.ts` (`callRpc`, `RestError`, `selectRows`, `insertRow`)
    - Migration `20260729115454_protected_beneficial_owner_evidence_boundary.sql` (RPC `from_evidence` BO whitelist)
    - Migration `20260729063938_bind_atomic_intake_to_canonical_pricing_catalog.sql` (RPC `from_catalog` full validation: entity_type, kbli, parties, capital, payment, idempotency)
    - `justifiqa-frontend/src/services/phase2IntegrationService.ts` (stub: `submitCorporateIntake` throws `BROWSER_BOUNDARY_UNAVAILABLE`)
    - `justifiqa-frontend/src/services/phase2SupabaseGateway.ts` (`supabase.auth.getSession` for actor)
    - `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx`
    - `justifiqa-frontend/src/components/corporate/CorporateIntakeStepFields.tsx`
    - `justifiqa-frontend/src/components/corporate/BeneficialOwnerFields.tsx`
    - `justifiqa-frontend/src/components/corporate/corporateUiModel.ts` (barrel re-export only — DO NOT edit model here)
    - `justifiqa-frontend/src/models/corporateIntake.ts` (canonical Draft model definitions, enums, validators)
    - `justifiqa-frontend/test/phase2IntegrationService.test.ts` (test pattern: `node:test`, readFile + regex for source verification)
- **DO NOT TOUCH** uncommitted user changes (Diagram/, Mockups/, .agents/, MarkDown/, AGENTS.md, etc.). **DO NOT CHANGE UI STYLING** unless forced by data flow.

---

## 2. AUTHENTICATED EDGE FUNCTION: `corporate-intake` (TRI-FILE PATTERN — MANDATORY)

### 2.1 File Structure (3 files, mirror existing EFs)
```
supabase/functions/corporate-intake/
├── handler.ts        # Pure business logic, DI, unit-testable (no Deno.serve)
├── index.ts          # Entrypoint: Deno.serve → inject RPC client from _shared/rest.ts
└── handler.test.ts   # Deno test file (unit tests for handler.ts)
```

### 2.2 Config (`supabase/config.toml`)
Append after `[functions.corporate-evidence]` block:
```toml
[functions.corporate-intake]
verify_jwt = true
```

### 2.3 CORS (Explicit — Match Existing Pattern EXACTLY from `corporate-evidence/handler.ts:17-20,101-121`)
```ts
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
```
- `corsHeaders(origin)` returns `{}` if origin missing/not allowed (DO NOT set `*`).
- For disallowed origin in `createCorporateIntakeHandler`: throw `HttpError(403, "ORIGIN_NOT_ALLOWED", ...)`.
- Handle `OPTIONS` → `withCors(new Response(null, { status: 204 }), origin)`.
- Use `withCors(response, origin)` wrapper on every response (success & error).

### 2.4 JWT Verification (Explicit Mechanism — COPY `corporate-evidence/index.ts:43-61` PATTERN EXACTLY)
```ts
async function verifyUser(request: Request): Promise<string> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "INVALID_JWT", "A valid user session is required.");
  }
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!publishableKey) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Auth service is unavailable.");
  }
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: publishableKey, authorization },
  });
  if (!response.ok) throw new HttpError(401, "INVALID_JWT", "Invalid or expired JWT.");
  const value = await response.json() as { id?: unknown };
  if (typeof value.id !== "string") throw new HttpError(401, "INVALID_JWT", "Invalid auth response.");
  return value.id; // clientId = JWT 'sub'
}
```
**DO NOT use `supabaseClient.auth.getUser()`** — Edge Functions in this repo use raw `fetch` to `/auth/v1/user`.

### 2.5 Payload Schema (Manual Validation — NO ZOD)
**Rules:**
1. Use `readJsonBody(request, 2 * 1024 * 1024)` for 2MB cap (default is 64KB — must pass explicit size).
2. Validate using `_shared/validation.ts` helpers (`requireRecord`, `rejectUnknownKeys`, `requireUuid`, `requireEnum`, `requireInteger`, `requireString`).
3. **Top-level allowed keys (camelCase, strict):**
   `orderId, entityType, proposedName, domicileCity, domicileProvince, kbliSnapshot, authorizedCapitalIdr, paidUpCapitalIdr, corporateParties, beneficialOwners, paymentGatewayRef, idempotencyKey`
   Any extra key → `HttpError(400, "UNKNOWN_FIELD", ...)` (matches RPC `CORPORATE_INTAKE_FIELD_NOT_ALLOWED` spirit).
4. Use `callRpc` from `_shared/rest.ts` (service role) — NOT `supabase.functions.invoke` from EF.

**Field constraints (verified against migrations 1129 & 0639):**

| Field | Type | Constraint | Source |
|---|---|---|---|
| `orderId` | UUID v4 | required | RPC `p_order_id UUID` |
| `entityType` | enum | `"PT_ORDINARY" \| "PT_INDIVIDUAL_UMK" \| "CV"` | 0639 line 295 |
| `proposedName` | string | `1 ≤ length ≤ 256` (trim, must equal raw — no leading/trailing whitespace) | 0639 line 298-301 |
| `domicileCity` | string | `1 ≤ length ≤ 128` | 0639 line 303-305 |
| `domicileProvince` | string | `1 ≤ length ≤ 128` | 0639 line 306-308 |
| `kbliSnapshot` | string[] | non-empty, each ≤16 char, no duplicates | 0639 line 335-360 |
| `authorizedCapitalIdr` | string | regex `^\d+$` (stringified numeric) → convert to `BigInt` for RPC NUMERIC | 0639 line 311-323 |
| `paidUpCapitalIdr` | string | regex `^\d+$`, `BigInt(paidUp) ≤ BigInt(authorized)` | 0639 line 321 |
| `corporateParties` | object[] | non-empty, max 10 (EF clamp; RPC enforces ≥1) | see `CorporatePartyInput` below |
| `beneficialOwners` | object[] | non-empty, max 50 (EF clamp), unique `evidenceReference`, 5 fields only | see `BeneficialOwnerInput` below |
| `paymentGatewayRef` | string | required, `1 ≤ length ≤ 64` | 0639 line 324-326 |
| `idempotencyKey` | string | required, `1 ≤ length ≤ 48` (NOT UUID) | 0639 line 329-331 |

**`BeneficialOwnerInput` (camelCase at EF boundary — map to snake_case before RPC):**
```ts
type BeneficialOwnerInput = {
  declarationVersion?: number; // default 1, must be positive int
  naturalPersonName: string;   // 1-256 char (trim, raw === trimmed)
  evidenceReference: string;   // UUID v4 (lowercase)
  controlBasis: "OWNERSHIP" | "VOTING_RIGHTS" | "APPOINTMENT_REMOVAL" | "EFFECTIVE_CONTROL" | "BENEFICIAL_ENTITLEMENT";
  percentage?: number;         // optional 0-100
};
// FORBIDDEN at EF: evidenceDigest, identityReference, digestServer, finalizedAt
// rejectUnknownKeys on each BO object — only the 5 above allowed.
```

**`CorporatePartyInput` (camelCase — map to snake_case before RPC):**
```ts
type CorporatePartyInput = {
  partyType?: "NATURAL_PERSON" | "LEGAL_ENTITY"; // default NATURAL_PERSON
  role: "FOUNDER" | "SHAREHOLDER" | "DIRECTOR" | "COMMISSIONER" | "ACTIVE_PARTNER" | "PASSIVE_PARTNER";
  displayName: string;          // 1-256
  identityReference: string;   // 1-128
  ownershipPercentage?: number; // 0-100
  votingPercentage?: number;    // 0-100
  effectiveFrom?: string;       // ISO date YYYY-MM-DD
};
// rejectUnknownKeys on each party — only the 7 above allowed.
```

**Cross-field invariants (EF-level, before RPC call):**
- `BigInt(paidUpCapitalIdr) <= BigInt(authorizedCapitalIdr)` → else `HttpError(400, "PAID_UP_EXCEEDS_AUTHORIZED", ...)`.
- Unique `beneficialOwners[i].evidenceReference` (lowercased) → else `HttpError(400, "EVIDENCE_REFERENCE_DUPLICATE", ...)`.

### 2.6 RPC Call (Service Role — `callRpc` from `_shared/rest.ts`)
```ts
const rpcResult = await callRpc<Corpor各地区IntakeRpcRow[]>(
  "fn_create_corporate_intake_from_evidence_atomic",
  {
    p_order_id: orderId,
    p_client_id: clientId,
    p_entity_type: entityType,
    p_proposed_name: proposedName,
    p_domicile_city: domicileCity,
    p_domicile_province: domicileProvince,
    p_kbli_snapshot: kbliSnapshot,            // JSONB array of strings
    p_authorized_capital_idr: BigInt(authorizedCapitalIdr).toString(), // NUMERIC accepts string
    p_paid_up_capital_idr: BigInt(paidUpCapitalIdr).toString(),
    p_corporate_parties: corporateParties.map(toSnakeCaseParty),      // JSONB
    p_beneficial_owners: beneficialOwners.map(toSnakeCaseBO),         // JSONB (5 fields only, no identityReference)
    p_payment_gateway_ref: paymentGatewayRef,
    p_idempotency_key: idempotencyKey,
    p_actor_user_id: clientId,
  }
);
// RPC RETURNS TABLE — expect exactly 1 row.
```

**Snake-case mappers (BUILD MANUALLY — do NOT spread original object, to avoid leaking `identityReference`/`evidenceDigest`):**

```ts
function toSnakeCaseBO(bo: BeneficialOwnerInput) {
  return {
    declaration_version: bo.declarationVersion ?? 1,
    natural_person_name: bo.naturalPersonName,
    evidence_reference: bo.evidenceReference,
    control_basis: bo.controlBasis,
    percentage: bo.percentage ?? null,
  };
}
function toSnakeCaseParty(p: CorporatePartyInput) {
  return {
    party_type: p.partyType ?? "NATURAL_PERSON",
    role: p.role,
    display_name: p.displayName,
    identity_reference: p.identityReference,
    ownership_percentage: p.ownershipPercentage ?? null,
    voting_percentage: p.votingPercentage ?? null,
    effective_from: p.effectiveFrom ?? null,
  };
}
```

**No SELECT FOR UPDATE in EF** — RPC (`SECURITY DEFINER` + `MATERIALIZED … FOR UPDATE` at line 948-955) handles locking & `CONSUMED` race atomically.

### 2.7 Response Contract (Success 200)
RPC `RETURNS TABLE`:
```sql
order_id UUID, corporate_case_id UUID, escrow_id UUID, pricing_catalog_id UUID,
quote_version SMALLINT, legal_scope_version VARCHAR, total_amount_idr NUMERIC, replayed BOOLEAN
```
EF response (camelCase + `totalAmountIdr` as stringified numeric):
```ts
type IntakeSuccessResponse = {
  orderId: string;
  corporateCaseId: string;
  escrowId: string;
  pricingCatalogId: string;
  quoteVersion: number;
  legalScopeVersion: string;          // VARCHAR — STRING, not number
  totalAmountIdr: string;             // NUMERIC → string to preserve precision
  replayed: boolean;
};
```

### 2.8 Error Handling (No SQL Leak — Redact Stack Trace)
Catch `RestError` (from `_shared/rest.ts`); inspect `JSON.stringify(error.details)` and map exception strings:
```ts
function mapIntakeRpcError(error: RestError): HttpError {
  const detail = JSON.stringify(error.details);
  if (detail.includes("CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH")) return new HttpError(403, "ACTOR_MISMATCH", "...");
  if (detail.includes("CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT")) return new HttpError(409, "IDEMPOTENCY_CONFLICT", "...");
  if (detail.includes("CORPORATE_INTAKE_EVIDENCE_STATE_INVALID")
   || detail.includes("CORPORATE_INTAKE_EVIDENCE_NOT_FOUND")) return new HttpError(409, "EVIDENCE_CONFLICT", "...");
  if (detail.startsWith("CORPORATE_INTAKE_EVIDENCE_")) return new HttpError(422, "EVIDENCE_INVALID", "...");
  if (detail.startsWith("CORPORATE_INTAKE_BENEFICIAL_OWNER_")
   || detail.startsWith("CORPORATE_INTAKE_PARTY_")
   || detail.startsWith("CORPORATE_INTAKE_KBLI_")
   || detail.includes("CORPORATE_INTAKE_CAPITAL_INVALID")
   || detail.includes("CORPORATE_INTAKE_PAYMENT_REFERENCE_INVALID")
   || detail.includes("CORPORATE_INTAKE_DOMICILE_INVALID")
   || detail.includes("CORPORATE_INTAKE_PROPOSED_NAME_INVALID")
   || detail.includes("CORPORATE_INTAKE_ENTITY_TYPE_INVALID")
   || detail.includes("CORPORATE_INTAKE_ORDER_REQUIRED")
   || detail.includes("CORPORATE_INTAKE_IDEMPOTENCY_KEY_INVALID")) return new HttpError(400, "INVALID_PAYLOAD", "...");
  return new HttpError(500, "INTAKE_BACKEND_FAILURE", "Intake service is unavailable.");
}
```
- Generic `console.error` in `errorResponse` (from `_shared/http.ts:47-56`) already redacts stack trace — returns `{ ok: false, code, message }` only.
- **DO NOT log** `evidenceReference`, `paymentGatewayRef`, `proposedName`, or `naturalPersonName` to stderr.

| HTTP | Condition |
|------|-----------|
| 400 | Manual validation fail (missing/invalid fields, extra keys, capital mismatch, duplicate evidence) |
| 401 | JWT missing/invalid/expired |
| 403 | `CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH` (actor ≠ client) |
| 409 | `CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT`, `CORPORATE_INTAKE_EVIDENCE_*` (not found, consumed) |
| 422 | `CORPORATE_INTAKE_EVIDENCE_STATE_INVALID` (terminal/expired) |
| 500 | Unexpected — redacted |

### 2.9 Idempotency Semantics (Explicit — DO NOT Replay Manually)
- **Key-only** (no payload hash comparison).
- **Window:** 24 hours (RPC enforced via `compliance_workflow_events_worm` keyed by `'corporate-intake:' || p_idempotency_key`).
- **Replay:** Same key → RPC returns row with `replayed: true` → EF forwards verbatim as **200 identical response**.
- **Conflict:** Key exists but incompatible state (e.g. evidence CONSUMED by different order) → RPC raises `CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT` → EF returns 409.
- **NO manual replay logic in EF** — forward whatever RPC returns.

---

## 3. UI INTEGRATION: UPLOAD EVIDENCE (THREE-STEP FLOW)

### 3.1 Files to Create/Modify (Whitelist)
- **NEW** `justifiqa-frontend/src/services/corporateEvidenceService.ts` — dedicated uploads service (does NOT touch `Phase2IntegrationGateway` interface).
- `justifiqa-frontend/src/components/corporate/BeneficialOwnerFields.tsx` — add BO identity upload section (new, no existing SHA-256 logic to "remove").
- `justifiqa-frontend/src/models/corporateIntake.ts` — extend `BeneficialOwnerDraft` with `evidenceReference?: string` (optional during upload progress, required at submit). **Do NOT remove `identityReference`** — it is still used for UI display; only filter it out at submit-time mapping.

### 3.2 Three-Step Flow (No Client Hashing — BUILD NEW)
```ts
// corporateEvidenceService.ts
import { supabase } from "@/lib/supabase";

export async function uploadBeneficialOwnerEvidence(
  file: File,
  onProgress?: (step: "prepare" | "upload" | "finalize") => void,
): Promise<{ evidenceReference: string }> {
  onProgress?.("prepare");
  const evidenceId = crypto.randomUUID();
  const idempotencyKey = crypto.randomUUID();                       // 36-char UUID ≤ 48-char cap
  const declaredMime = file.type;                                   // validated server-side via magic bytes
  const declaredByteSize = file.size;
  const { data: prep, error: prepErr } = await supabase.functions.invoke(
    "corporate-evidence/prepare",
    { body: { evidenceId, declaredMime, declaredByteSize, idempotencyKey } },
  );
  if (prepErr || !prep?.objectPath) throw mapEvidenceError(prepErr, "prepare");
  const objectPath: string = prep.objectPath;

  onProgress?.("upload");
  const { error: upErr } = await supabase.storage
    .from("corporate-intake-evidence")
    .upload(objectPath, file, { contentType: declaredMime, upsert: false });
  if (upErr) throw mapEvidenceError(upErr, "upload");

  onProgress?.("finalize");
  const { data: fin, error: finErr } = await supabase.functions.invoke(
    "corporate-evidence/finalize",
    { body: { evidenceId, idempotencyKey } },
  );
  if (finErr || !fin?.evidenceReference) throw mapEvidenceError(finErr, "finalize");
  return { evidenceReference: fin.evidenceReference as string };
}
```
- **Raw bytes upload**, NO FormData.
- Store `evidenceReference` in BO React state (parent component `BeneficialOwnerFields`). DO NOT persist directly to DB.

### 3.3 Error UX
- MIME reject (415) → "Format file tidak didukung (PDF, JPG, PNG max 10MB)".
- Size reject (413) → "File terlalu besar (max 10MB)".
- Network/timeout → toast + retry button per step (reset from "prepare").
- Progress: 3-step indicator (Prepare → Upload → Finalize).
- Forbid re-submit during upload; disable submit button until all BOs have `evidenceReference`.

---

## 4. UI INTEGRATION: SUBMIT INTAKE FORM

### 4.1 Files to Modify (Whitelist)
- `justifiqa-frontend/src/services/phase2IntegrationService.ts` — replace stub `submitCorporateIntake` with EF invoke; REMOVE `BROWSER_BOUNDARY_UNAVAILABLE` throw for this method.
- `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx` — `onSubmit` handler.
- `justifiqa-frontend/src/components/corporate/CorporateIntakeStepFields.tsx` — add `paymentGatewayRef` input (required) + `acceptedScope` checkbox in step 5 (UI gate only).

### 4.2 Submit Logic — Mapping `CorporateIntakeDraft` → `IntakePayload` (camelCase for EF)
```ts
function toIntakePayload(draft: CorporateIntakeDraft, paymentGatewayRef: string, idempotencyKey: string, orderId: string): IntakePayload {
  return {
    orderId,                                          // from existing order context
    entityType: draft.entityType,                     // already enum-aligned
    proposedName: draft.businessName.trim(),
    domicileCity: draft.domicileCity.trim(),
    domicileProvince: draft.domicileProvince.trim(),
    kbliSnapshot: draft.kbliCodes.map(c => c.trim()).filter(Boolean),  // string[]
    authorizedCapitalIdr: draft.authorizedCapitalIdr,
    paidUpCapitalIdr: draft.paidUpCapitalIdr,
    corporateParties: draft.corporateParties.map(p => ({
      partyType: p.partyType,
      role: p.role,
      displayName: p.displayName.trim(),
      identityReference: p.identityReference.trim(),
      ownershipPercentage: p.ownershipPercentage ? Number(p.ownershipPercentage) : undefined,
      votingPercentage: p.votingPercentage ? Number(p.votingPercentage) : undefined,
      effectiveFrom: p.effectiveDate || undefined,    // map effectiveDate → effectiveFrom
    })),
    beneficialOwners: draft.beneficialOwners.map(o => ({
      declarationVersion: 1,
      naturalPersonName: o.naturalPersonName.trim(),
      evidenceReference: o.evidenceReference!,         // REQUIRED — enforced by UI gate
      controlBasis: o.controlBasis,
      percentage: o.percentage ? Number(o.percentage) : undefined,
      // identityReference NOT included — RPC reject
    })),
    paymentGatewayRef: paymentGatewayRef.trim(),
    idempotencyKey,
  };
}
```
- **FORBIDDEN:** `supabase.rpc('fn_create_corporate_intake_from_evidence_atomic', ...)` or any `supabase.rpc` for intake.
- **REQUIRED:** `supabase.functions.invoke('corporate-intake', { body: payload })`.
- On 200 + `replayed===true` → same success path (navigate to `/intake/success?caseId={corporateCaseId}`).
- On 409 → show "Pengajuan sudah diproses / bukti sudah terpakai" + link to case (if `corporateCaseId` returned).
- On 400 → inline form errors keyed by Zod-free `code` field from EF response.
- On 401 → redirect to login.
- On 403 → toast "Akun tidak berwenang."
- `acceptedScope` (UI gate) — do NOT include in payload sent to EF.

### 4.3 Remove Stub
- Delete `throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');` from `submitCorporateIntake`.
- Delete `'BROWSER_BOUNDARY_UNAVAILABLE'` from `Phase2IntegrationErrorCode` union and `ERROR_MESSAGES` map ONLY if no other method still uses it. If `submitNotaryStamping` and `createSigningEnvelope` still use it, **leave the code constant** — just remove the throw from `submitCorporateIntake`.

---

## 5. TDD & TESTS (RED FIRST)

### 5.1 Edge Function (`handler.test.ts` — Deno `node:test`, DI pattern)
**Pattern:** `Partial<CorporateIntakeDependencies>` factory with overrides; invoke with `new Request(...)` directly; **NO mocking `fetch` or supabase-js** — pure DI.

Required cases:
- [ ] No `Authorization` header → 401
- [ ] Invalid JWT (`/auth/v1/user` returns non-2xx) → 401
- [ ] Payload missing `orderId` → 400
- [ ] Payload missing `evidenceReference` in a BO → 400
- [ ] Payload includes extra field `evidenceDigest` on a BO → 400 (`rejectUnknownKeys` strips it)
- [ ] Payload includes extra field `identityReference` on a BO → 400
- [ ] Entity type `"PT"` (invalid) → 400
- [ ] `paidUpCapitalIdr > authorizedCapitalIdr` → 400 `PAID_UP_EXCEEDS_AUTHORIZED`
- [ ] Duplicate `evidenceReference` in BOs → 400 `EVIDENCE_REFERENCE_DUPLICATE`
- [ ] `paymentGatewayRef` empty → 400
- [ ] `idempotencyKey` length 49 → 400
- [ ] Valid payload → DI `callRpc` invoked with snake_case mapping → 200 with `IntakeSuccessResponse` shape (including `legalScopeVersion` as string, `totalAmountIdr` as string)
- [ ] RPC throws `RestError` with `details` containing `CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT` → 409
- [ ] RPC throws `RestError` with details containing `CORPORATE_INTAKE_EVIDENCE_NOT_FOUND` → 409
- [ ] RPC throws `RestError` with details containing `CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH` → 403
- [ ] RPC returns row with `replayed: true` → 200 (forwarded verbatim)
- [ ] Response body does NOT include SQL stack trace (grep response text for `SQLSTATE`, `PL/pgSQL` → zero hits)

### 5.2 UI / Services (`node:test` + `node:assert/strict` — NO Vitest, NO RTL)
**Pattern:** New file `justifiqa-frontend/test/corporateIntakeIntegration.test.ts` with direct imports. For source-level verification, use `readFile` + regex (see existing `phase2IntegrationService.test.ts:24-28` which reads `phase2SupabaseGateway.ts` to verify no forbidden patterns).

Required cases:
- [ ] `corporateEvidenceService.uploadEvidence`: simulate Storage failure (return `{ error: { message: "storage down" } }` from stub) → throws typed error, no unhandled rejection.
- [ ] `corporateEvidenceService.uploadEvidence`: simulate `finalize` returning `{ evidenceReference: undefined }` → throws.
- [ ] `submitCorporateIntake` invokes `supabase.functions.invoke('corporate-intake', ...)` with body matching `IntakePayload` shape (verify camelCase keys, BO has no `identityReference`, party has `effectiveFrom` not `effectiveDate`).
- [ ] Source-file regression (read `phase2SupabaseGateway.ts` + `phase2IntegrationService.ts`): regex `supabase\.rpc\([^)]*intake` → zero matches.
- [ ] Source-file regression: regex `BROWSER_BOUNDARY_UNAVAILABLE` on `submitCorporateIntake` context → zero matches (or absent entirely if fully removed).
- [ ] Source-file regression: regex `functions\.invoke\(['"]corporate-intake['"]` → ≥1 match across `*Service.ts` files.

### 5.3 Regression Gates (ALL MUST PASS)
```bash
# 1. Edge Function (Deno) — run from repo root:
deno test --allow-all supabase/functions/corporate-intake/handler.test.ts

# 2. Frontend (node --test):
npm --prefix justifiqa-frontend run test:phase2

# 3. Build (implicit typecheck via tsc -b):
npm --prefix justifiqa-frontend run build

# 4. Lint (oxlint, NOT eslint):
npm --prefix justifiqa-frontend run lint

# 5. Symbol map (root repo — NO `npm run check:symbol-map`, no script):
node Tools/generate_symbol_map.mjs
node Tools/generate_symbol_map.mjs --check
```
**DO NOT** emit `npm run test` (no such script), `npm run typecheck` (no such script), `npm run lint` as eslint (it's `oxlint`), or `npm run check:symbol-map` (no such script).

---

## 6. SYMBOL MAP & TYPE REGENERATION (MANDATORY POST-EDIT)
After **any** TS export change (new EF handler, new service function, new model field):
```bash
node Tools/generate_symbol_map.mjs
node Tools/generate_symbol_map.mjs --check
```
Regenerate DB types (mechanically, no manual edit):
```bash
npx supabase gen types typescript --local > justifiqa-frontend/src/types/database.types.ts
```
**Note:** Output path is `src/types/database.types.ts` — NOT `src/lib/`. Folder `src/lib/` exists (contains `supabase.ts`) but does NOT hold `database.types.ts`. All imports use `@/types/database.types`.

---

## 7. FILE WHITELIST (ONLY THESE FILES MAY BE MODIFIED/CREATED)

### New Files
- `supabase/functions/corporate-intake/handler.ts`
- `supabase/functions/corporate-intake/index.ts`
- `supabase/functions/corporate-intake/handler.test.ts`
- `justifiqa-frontend/src/services/corporateEvidenceService.ts`
- `justifiqa-frontend/test/corporateIntakeIntegration.test.ts`

### Modified Files
- `supabase/config.toml` (single `[functions.corporate-intake]` block — verify_jwt=true)
- `justifiqa-frontend/src/services/phase2IntegrationService.ts` (replace stub with EF invoke; careful partial removal of `BROWSER_BOUNDARY_UNAVAILABLE`)
- `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx` (onSubmit handler)
- `justifiqa-frontend/src/components/corporate/CorporateIntakeStepFields.tsx` (add `paymentGatewayRef` + `acceptedScope` UI gate in step 5)
- `justifiqa-frontend/src/components/corporate/BeneficialOwnerFields.tsx` (BO upload section, 3-step indicator)
- `justifiqa-frontend/src/models/corporateIntake.ts` (add `evidenceReference?: string` on `BeneficialOwnerDraft`; do NOT remove `identityReference`)
- `justifiqa-frontend/src/types/database.types.ts` (auto-generated via command above)

**ANY OTHER FILE TOUCHED = SCOPE CREEP = FAIL.**
Specifically FORBIDDEN:
- `justifiqa-frontend/src/services/phase2SupabaseGateway.ts` — must NOT have `uploadEvidence` added (violates `Phase2IntegrationGateway` interface).
- `justifiqa-frontend/src/components/corporate/corporateUiModel.ts` — barrel re-export only, do NOT inline models here.
- `supabase/functions/corporate-evidence/*` — already implemented in Batch 2.B, do NOT touch.
- `supabase/migrations/*.sql` — no new migration.
- `supabase/functions/_shared/*` — do NOT extend validators; use what exists.

---

## 8. ANTIMATTER SCOPE (EXPLICITLY FORBIDDEN)
- ❌ New RPC / migration / RLS changes
- ❌ Notary assignment logic (Batch 3.C)
- ❌ e-KYC provider integration (Batch 3.D)
- ❌ Production deployment / `supabase functions deploy`
- ❌ Push to remote / merge to main
- ❌ UI styling changes unrelated to data flow
- ❌ Mocking Supabase Storage in E2E tests (use local Supabase Docker)
- ❌ Adding `uploadEvidence` to `phase2SupabaseGateway.ts` (violates interface contract)
- ❌ Modifying `corporateUiModel.ts` for BO model (target is `models/corporateIntake.ts`)
- ❌ Installing or importing `zod` (not in repo deps; existing manual validators suffice)
- ❌ Using `vitest` / `@testing-library/react` (not in repo deps; use `node:test` + `readFile` regex pattern)
- ❌ Using `supabaseClient.auth.getUser()` in EF (use `fetch /auth/v1/user` pattern)
- ❌ Booleans/objects sent as `evidenceReference` (must be UUID string)
- ❌ Hashing file in browser (`crypto.subtle.digest`) for BO evidence — server-only digest
- ❌ Including `identityReference` or `evidenceDigest` in `p_beneficial_owners` JSONB

---

## 9. DEFINITION OF DONE (CHECKLIST — ALL REQUIRED)
- [ ] `grep -rn "supabase\.rpc.*intake" justifiqa-frontend/src` → zero hits
- [ ] `grep -rn "BROWSER_BOUNDARY_UNAVAILABLE" justifiqa-frontend/src/services/phase2IntegrationService.ts` → zero hits in `submitCorporateIntake` context (may remain for notary/signing methods)
- [ ] `grep -rn "functions\.invoke.*corporate-intake" justifiqa-frontend/src` → ≥1 hit
- [ ] `grep -rn "crypto\.subtle" justifiqa-frontend/src/components/corporate` → zero hits
- [ ] BO files upload via `corporate-evidence` prepare/upload/finalize (private bucket)
- [ ] UI shows 3-step progress + friendly errors during evidence upload
- [ ] `corporate-intake` EF validates payload (manual validators), JWT (`/auth/v1/user`), CORS (hardcoded allowlist), idempotency (≤48 char), payload size (2MB cap) — watertight
- [ ] EF response NEVER contains SQL stack trace (test asserts absence)
- [ ] Zero uncommitted user files staged (`git status` clean for non-whitelist files)
- [ ] `deno test --allow-all supabase/functions/corporate-intake/handler.test.ts` green
- [ ] `npm --prefix justifiqa-frontend run test:phase2` green
- [ ] `npm --prefix justifiqa-frontend run build` green (implicit typecheck)
- [ ] `npm --prefix justifiqa-frontend run lint` green (oxlint)
- [ ] `node Tools/generate_symbol_map.mjs --check` green
- [ ] `database.types.ts` regenerated mechanically to `src/types/database.types.ts`
- [ ] Single commit on `batch-3a-corporate-intake` with message:
    `feat(intake): wire frontend to Edge Functions and remove client hashing`

---

## 10. FINAL REPORT FORMAT (OUTPUT WHEN DONE)
```markdown
## Batch 3.A Execution Summary
- **Branch:** batch-3a-corporate-intake
- **Commit:** <sha>
- **Edge Function:** corporate-intake (handler.ts, index.ts, handler.test.ts) — tests pass locally via `deno test`
- **UI Wiring:** Upload evidence (3-step via corporateEvidenceService) + Submit intake → `supabase.functions.invoke('corporate-intake')` verified
- **Security:** JWT via `/auth/v1/user`, CORS hardcoded allowlist, payload 2MB cap, manual validators (no zod), no SQL leak, idempotency ≤48 char key-only 24h
- **Gates:** deno test ✅ | test:phase2 ✅ | build ✅ | lint ✅ | symbol-map ✅
- **Antimatter:** zero new migrations, zero RLS changes, zero forbidden files touched
- **Stop:** Reporting complete. Awaiting next batch instruction.
```

---

**END OF PROMPT MASTER v3.**
**Executor (Sol High): Execute literally. Zero blind generation. Report only when all gates green.**
