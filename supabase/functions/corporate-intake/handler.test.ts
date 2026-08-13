import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../_shared/http.ts";
import {
  createCorporateIntakeHandler,
  type CorporateIntakeDependencies,
} from "./handler.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const orderId = "22222222-2222-4222-8222-222222222222";
const clientId = userId;
const caseId = "33333333-3333-4333-8333-333333333333";
const escrowId = "44444444-4444-4444-8444-444444444444";
const catalogId = "55555555-5555-4555-8555-555555555555";

const validPayload = {
  orderId,
  entityType: "PT_ORDINARY",
  proposedName: "Justica Solusi Indonesia",
  domicileCity: "Jakarta Selatan",
  domicileProvince: "DKI Jakarta",
  kbliSnapshot: ["62010", "62020"],
  authorizedCapitalIdr: "1000000000",
  paidUpCapitalIdr: "250000000",
  corporateParties: [
    {
      partyType: "NATURAL_PERSON",
      role: "FOUNDER",
      displayName: "Andi Wijaya",
      identityReference: "id-001",
      ownershipPercentage: 100,
      votingPercentage: 100,
      effectiveFrom: "2026-08-01",
    },
  ],
  beneficialOwners: [
    {
      declarationVersion: 1,
      naturalPersonName: "Andi Wijaya",
      evidenceReference: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      controlBasis: "OWNERSHIP",
      percentage: 100,
    },
  ],
  idempotencyKey: "intake-key-01",
};

type RpcRow = {
  order_id: string;
  corporate_case_id: string;
  escrow_id: string;
  pricing_catalog_id: string;
  quote_version: number;
  legal_scope_version: string;
  total_amount_idr: string;
  replayed: boolean;
};

function dependencies(
  overrides: Partial<CorporateIntakeDependencies> = {},
): CorporateIntakeDependencies {
  const defaultVerifyUser = async (request: Request): Promise<string> => {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new HttpError(401, "INVALID_JWT", "A valid user session is required.");
    }
    return userId;
  };
  return {
    verifyUser: defaultVerifyUser,
    callRpc: async () =>
      [{
        order_id: orderId,
        corporate_case_id: caseId,
        escrow_id: escrowId,
        pricing_catalog_id: catalogId,
        quote_version: 1,
        legal_scope_version: "2026.07",
        total_amount_idr: "5000000",
        replayed: false,
      }] as RpcRow[],
    ...overrides,
  };
}

function invoke(
  handler: (req: Request) => Promise<Response>,
  body: unknown,
  options: { method?: string; origin?: string; authorization?: string } = {},
): Promise<Response> {
  return handler(
    new Request("http://localhost/functions/v1/corporate-intake", {
      method: options.method ?? "POST",
      headers: {
        origin: options.origin ?? "http://localhost:5173",
        authorization: options.authorization ?? "Bearer fixture-jwt",
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

test("OPTIONS preflight returns 204 for allowed origin", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const response = await handler(
    new Request("http://localhost/functions/v1/corporate-intake", {
      method: "OPTIONS",
      headers: { origin: "http://localhost:5173" },
    }),
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

test("disallowed origin returns 403", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const response = await invoke(handler, validPayload, { origin: "http://evil.example" });
  assert.equal(response.status, 403);
});

test("missing Authorization header returns 401", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const response = await invoke(handler, validPayload, { authorization: "" });
  assert.equal(response.status, 401);
});

test("invalid JWT returns 401", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => {
      throw new HttpError(401, "INVALID_JWT", "Invalid or expired JWT.");
    },
    callRpc: dependencies().callRpc,
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 401);
});

test("payload missing orderId returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const { orderId: _omit, ...rest } = validPayload;
  const response = await invoke(handler, rest);
  assert.equal(response.status, 400);
});

test("payload missing evidenceReference in BO returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const broken = {
    ...validPayload,
    beneficialOwners: [
      {
        declarationVersion: 1,
        naturalPersonName: "Andi Wijaya",
        controlBasis: "OWNERSHIP",
        percentage: 100,
      },
    ],
  };
  const response = await invoke(handler, broken);
  assert.equal(response.status, 400);
});

test("payload with extra evidenceDigest on BO returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const forged = {
    ...validPayload,
    beneficialOwners: [
      {
        ...validPayload.beneficialOwners[0],
        evidenceDigest: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      },
    ],
  };
  const response = await invoke(handler, forged);
  assert.equal(response.status, 400);
  const body = await response.json() as { code: string };
  assert.equal(body.code, "UNKNOWN_FIELD");
});

test("payload with identityReference on BO returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const forged = {
    ...validPayload,
    beneficialOwners: [
      {
        ...validPayload.beneficialOwners[0],
        identityReference: "id-001",
      },
    ],
  };
  const response = await invoke(handler, forged);
  assert.equal(response.status, 400);
});

test("invalid entity type returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const broken = { ...validPayload, entityType: "PT" };
  const response = await invoke(handler, broken);
  assert.equal(response.status, 400);
});

test("paid-up exceeding authorized returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const broken = {
    ...validPayload,
    authorizedCapitalIdr: "100",
    paidUpCapitalIdr: "1000",
  };
  const response = await invoke(handler, broken);
  assert.equal(response.status, 400);
  const body = await response.json() as { code: string };
  assert.equal(body.code, "PAID_UP_EXCEEDS_AUTHORIZED");
});

test("duplicate evidenceReference in BOs returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const broken = {
    ...validPayload,
    beneficialOwners: [
      validPayload.beneficialOwners[0],
      { ...validPayload.beneficialOwners[0], naturalPersonName: "Budi" },
    ],
  };
  const response = await invoke(handler, broken);
  assert.equal(response.status, 400);
  const body = await response.json() as { code: string };
  assert.equal(body.code, "EVIDENCE_REFERENCE_DUPLICATE");
});

test("browser-supplied paymentGatewayRef is rejected as an unknown field", async () => {
  let rpcCalls = 0;
  const handler = createCorporateIntakeHandler(dependencies({
    callRpc: async () => {
      rpcCalls += 1;
      return [];
    },
  }));
  const response = await invoke(handler, {
    ...validPayload,
    paymentGatewayRef: "CLIENT-CONTROLLED-REF",
  });
  assert.equal(response.status, 400);
  const body = await response.json() as { code: string };
  assert.equal(body.code, "UNKNOWN_FIELD");
  assert.equal(rpcCalls, 0);
});

test("idempotencyKey exceeding 48 chars returns 400", async () => {
  const handler = createCorporateIntakeHandler(dependencies());
  const broken = { ...validPayload, idempotencyKey: "k".repeat(49) };
  const response = await invoke(handler, broken);
  assert.equal(response.status, 400);
});

test("valid payload maps to snake_case RPC params and returns 200", async () => {
  let captured: { name: string; params: unknown } | null = null;
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async (name, params) => {
      captured = { name, params };
      return [{
        order_id: orderId,
        corporate_case_id: caseId,
        escrow_id: escrowId,
        pricing_catalog_id: catalogId,
        quote_version: 1,
        legal_scope_version: "2026.07",
        total_amount_idr: "5000000",
        replayed: false,
      }] as RpcRow[];
    },
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 200);
  const body = await response.json() as Record<string, unknown>;
  assert.equal(body.orderId, orderId);
  assert.equal(body.corporateCaseId, caseId);
  assert.equal(body.escrowId, escrowId);
  assert.equal(body.pricingCatalogId, catalogId);
  assert.equal(typeof body.legalScopeVersion, "string");
  assert.equal(typeof body.totalAmountIdr, "string");
  assert.equal(body.replayed, false);
  assert.ok(captured);
  const p = (captured as { params: Record<string, unknown> }).params as Record<string, unknown>;
  assert.equal(p.p_order_id, orderId);
  assert.equal(p.p_client_id, clientId);
  assert.equal(p.p_entity_type, "PT_ORDINARY");
  assert.equal(p.p_idempotency_key, "intake-key-01");
  assert.equal(p.p_payment_gateway_ref, `CORP-${orderId}`);
  assert.equal(String(p.p_payment_gateway_ref).includes("pg-ref-001"), false);
  const bo = (p.p_beneficial_owners as Array<Record<string, unknown>>)[0];
  assert.equal(bo.declaration_version, 1);
  assert.equal(bo.evidence_reference, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(bo.control_basis, "OWNERSHIP");
  assert.equal("identity_reference" in bo, false);
  assert.equal("evidence_digest" in bo, false);
  const party = (p.p_corporate_parties as Array<Record<string, unknown>>)[0];
  assert.equal(party.party_type, "NATURAL_PERSON");
  assert.equal(party.display_name, "Andi Wijaya");
  assert.equal(party.identity_reference, "id-001");
  assert.equal(party.effective_from, "2026-08-01");
});

test("RPC idempotency conflict maps to 409", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () => {
      const err = new Error("Supabase REST request failed with status 409");
      (err as Error & { details?: unknown }).details = {
        code: "P0001",
        message: "CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT",
      };
      throw err;
    },
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 409);
  const body = await response.json() as { code: string };
  assert.equal(body.code, "IDEMPOTENCY_CONFLICT");
});

test("RPC evidence not found maps to 409", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () => {
      const err = new Error("Supabase REST request failed with status 500");
      (err as Error & { details?: unknown }).details = {
        code: "P0001",
        message: "CORPORATE_INTAKE_EVIDENCE_NOT_FOUND",
      };
      throw err;
    },
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 409);
});

test("RPC actor mismatch maps to 403", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () => {
      const err = new Error("Supabase REST request failed");
      (err as Error & { details?: unknown }).details = {
        code: "P0001",
        message: "CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH",
      };
      throw err;
    },
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 403);
});

test("server-derived payment reference is stable across intake replay", async () => {
  const references: unknown[] = [];
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async (_name, params) => {
      references.push((params as Record<string, unknown>).p_payment_gateway_ref);
      return [{
        order_id: orderId,
        corporate_case_id: caseId,
        escrow_id: escrowId,
        pricing_catalog_id: catalogId,
        quote_version: 1,
        legal_scope_version: "2026.07",
        total_amount_idr: "5000000",
        replayed: references.length > 1,
      }] as RpcRow[];
    },
  });
  assert.equal((await invoke(handler, validPayload)).status, 200);
  assert.equal((await invoke(handler, validPayload)).status, 200);
  assert.deepEqual(references, [`CORP-${orderId}`, `CORP-${orderId}`]);
});

test("RPC replayed: true forwards 200 verbatim", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () =>
      [{
        order_id: orderId,
        corporate_case_id: caseId,
        escrow_id: escrowId,
        pricing_catalog_id: catalogId,
        quote_version: 1,
        legal_scope_version: "2026.07",
        total_amount_idr: "5000000",
        replayed: true,
      }] as RpcRow[],
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 200);
  const body = await response.json() as { replayed: boolean };
  assert.equal(body.replayed, true);
});

test("response body does not leak SQL stack trace", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () => {
      const err = new Error("PL/pgSQL execution failed\nSQLSTATE: P0001\nat function line 42");
      (err as Error & { details?: unknown }).details = {
        code: "P0001",
        message: "UNKNOWN_FAILURE",
      };
      throw err;
    },
  });
  const response = await invoke(handler, validPayload);
  const text = await response.text();
  assert.equal(text.includes("SQLSTATE"), false);
  assert.equal(text.includes("PL/pgSQL"), false);
});

test("RPC pricing catalog not found maps to 409 PRICING_CATALOG_UNAVAILABLE", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () => {
      const err = new Error("Supabase REST request failed with status 409");
      (err as Error & { details?: unknown }).details = {
        code: "P0001",
        message: "CORPORATE_PRICING_ACTIVE_CATALOG_NOT_FOUND",
      };
      throw err;
    },
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 409);
  const text = await response.text();
  const body = JSON.parse(text) as { code: string; message: string };
  assert.equal(body.code, "PRICING_CATALOG_UNAVAILABLE");
  assert.equal(body.message, "Pricing catalog is not available.");
  assert.equal(text.includes("CORPORATE_PRICING_ACTIVE_CATALOG_NOT_FOUND"), false);
});

test("RPC unknown error maps to 500 INTAKE_BACKEND_FAILURE", async () => {
  const handler = createCorporateIntakeHandler({
    verifyUser: async () => userId,
    callRpc: async () => {
      const err = new Error("Supabase REST request failed with status 500");
      (err as Error & { details?: unknown }).details = {
        code: "P0001",
        message: "SOME_OTHER_ERROR",
      };
      throw err;
    },
  });
  const response = await invoke(handler, validPayload);
  assert.equal(response.status, 500);
  const body = await response.json() as { code: string };
  assert.equal(body.code, "INTAKE_BACKEND_FAILURE");
});
