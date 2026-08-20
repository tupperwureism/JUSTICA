import assert from "node:assert/strict";
import test from "node:test";
import { RestError } from "../_shared/rest.ts";
import {
  createNotaryWorkspaceHandler,
  type AdminActor,
  type ApproveCddResult,
  type AssignNotaryResult,
  type EligibleCaseProjection,
  type NotaryActor,
  type VerifiedNotaryProjection,
} from "./handler.ts";

const ADMIN_ID = "3c100000-0000-4000-8000-000000000001";
const NOTARY_ID = "3c100000-0000-4000-8000-000000000002";
const CASE_ID = "3c100000-0000-4000-8000-000000000020";
const ASSESSMENT_ID = "3c100000-0000-4000-8000-000000000030";
const IDEMPOTENCY_KEY = "3c100000-0000-4000-8000-000000000100";

function createMockDeps(overrides: Partial<{
  user: string;
  admin: AdminActor | null;
  notary: NotaryActor | null;
  cases: EligibleCaseProjection[];
  notaries: VerifiedNotaryProjection[];
  assignResult: AssignNotaryResult;
  approveResult: ApproveCddResult;
  assignError: unknown;
  approveError: unknown;
}> = {}) {
  return {
    verifyUser: async (auth: string | null) => {
      if (!auth || !auth.startsWith("Bearer ")) {
        throw new Error("UNAUTHENTICATED");
      }
      return overrides.user ?? ADMIN_ID;
    },
    getAdminActor: async (userId: string) => {
      if (overrides.admin !== undefined) return overrides.admin;
      return {
        adminId: userId,
        roleGroup: "COMPLIANCE_OFFICER",
      };
    },
    getNotaryActor: async (userId: string) => {
      if (overrides.notary !== undefined) return overrides.notary;
      return {
        notaryId: userId,
        status: "VERIFIED_ACTIVE",
        isVerifiedAdvocate: true,
      };
    },
    listAssignmentContext: async () => ({
      cases: overrides.cases ?? [
        {
          caseId: CASE_ID,
          orderId: "3c100000-0000-4000-8000-000000000010",
          entityType: "PT_ORDINARY",
          proposedName: "PT Maju 3C1",
          currentStage: "ESCROW_LOCKED",
          domicileCity: "Jakarta Selatan",
          domicileProvince: "DKI Jakarta",
          escrowStatus: "HELD_IN_ESCROW",
          fundsLockedAt: "2026-08-20T00:00:00.000Z",
          assignedNotaryId: null,
        },
      ],
      notaries: overrides.notaries ?? [
        {
          notaryId: NOTARY_ID,
          fullName: "Notaris Hj. Siti Aminah S.H.",
          licenseNumber: "SK-NOT-001",
          jurisdictionCity: "Jakarta Selatan",
          jurisdictionProvince: "DKI Jakarta",
          status: "VERIFIED_ACTIVE",
        },
      ],
    }),
    assignNotary: async (params: {
      caseId: string;
      notaryId: string;
      adminId: string;
      idempotencyKey: string;
    }) => {
      if (overrides.assignError) throw overrides.assignError;
      return overrides.assignResult ?? {
        caseId: params.caseId,
        assignedNotaryId: params.notaryId,
        currentStage: "ESCROW_LOCKED",
        replayed: false,
      };
    },
    approveCdd: async (params: {
      caseId: string;
      assessmentId: string;
      notaryId: string;
      rulesVersion: string;
      idempotencyKey: string;
    }) => {
      if (overrides.approveError) throw overrides.approveError;
      return overrides.approveResult ?? {
        caseId: params.caseId,
        assessmentId: params.assessmentId,
        currentStage: "DOCUMENTS_PENDING",
        replayed: false,
      };
    },
  };
}

function makeRequest(body: unknown, options: {
  origin?: string;
  auth?: string;
  method?: string;
} = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.origin) headers.origin = options.origin;
  if (options.auth !== undefined) {
    if (options.auth) headers.authorization = options.auth;
  } else {
    headers.authorization = "Bearer valid-token";
  }

  return new Request("http://localhost:54321/functions/v1/notary-workspace", {
    method: options.method ?? "POST",
    headers,
    body: options.method === "OPTIONS" ? undefined : JSON.stringify(body),
  });
}

test("OPTIONS preflight returns allowed localhost CORS headers", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps());
  const res = await handler(makeRequest(null, { method: "OPTIONS", origin: "http://localhost:5173" }));
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

test("OPTIONS preflight rejects unauthorized origins", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps());
  const res = await handler(makeRequest(null, { method: "OPTIONS", origin: "http://evil.invalid" }));
  assert.equal(res.status, 403);
});

test("missing or invalid authorization header returns 401 UNAUTHENTICATED", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps());
  const res = await handler(makeRequest({ action: "list_assignment_context" }, { auth: "" }));
  assert.equal(res.status, 401);
  const data = await res.json() as any;
  assert.equal(data.code, "UNAUTHENTICATED");
});

test("list_assignment_context requires compliance or super_admin role", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps({
    admin: { adminId: ADMIN_ID, roleGroup: "OPERATIONS_ADMIN" },
  }));
  const res = await handler(makeRequest({ action: "list_assignment_context" }));
  assert.equal(res.status, 403);
});

test("list_assignment_context returns eligible cases and verified notaries for authorized admin", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps());
  const res = await handler(makeRequest({ action: "list_assignment_context" }));
  assert.equal(res.status, 200);
  const json = await res.json() as any;
  assert.equal(json.ok, true);
  assert.equal(json.data.cases.length, 1);
  assert.equal(json.data.notaries.length, 1);
});

test("assign_notary validates input, rejects spoof fields, and calls assignNotary dependency", async () => {
  let calledWith: any = null;
  const deps = createMockDeps();
  deps.assignNotary = async (params) => {
    calledWith = params;
    return {
      caseId: params.caseId,
      assignedNotaryId: params.notaryId,
      currentStage: "ESCROW_LOCKED",
      replayed: false,
    };
  };
  const handler = createNotaryWorkspaceHandler(deps);
  const res = await handler(makeRequest({
    action: "assign_notary",
    caseId: CASE_ID,
    notaryId: NOTARY_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
  }));
  assert.equal(res.status, 200);
  const json = await res.json() as any;
  assert.equal(json.ok, true);
  assert.equal(json.data.currentStage, "ESCROW_LOCKED");
  assert.equal(calledWith.caseId, CASE_ID);
  assert.equal(calledWith.notaryId, NOTARY_ID);
  assert.equal(calledWith.adminId, ADMIN_ID);
});

test("assign_notary rejects caller-supplied actorId or fake role", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps());
  const res = await handler(makeRequest({
    action: "assign_notary",
    caseId: CASE_ID,
    notaryId: NOTARY_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
    adminId: "99999999-9999-4999-8999-999999999999", // Spoof
    role: "SUPER_ADMIN", // Spoof
  }));
  assert.equal(res.status, 400);
  const json = await res.json() as any;
  assert.equal(json.code, "UNKNOWN_FIELD");
});

test("assign_notary parses RestError ASSIGNMENT_CONFLICT safely", async () => {
  const restError = new RestError(409, "ASSIGNMENT_CONFLICT: Case is already assigned to a different Notary");
  const handler = createNotaryWorkspaceHandler(createMockDeps({ assignError: restError }));
  const res = await handler(makeRequest({
    action: "assign_notary",
    caseId: CASE_ID,
    notaryId: NOTARY_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
  }));
  assert.equal(res.status, 409);
  const json = await res.json() as any;
  assert.equal(json.code, "ASSIGNMENT_CONFLICT");
});

test("approve_cdd requires verified active notary actor and advocate verification", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps({
    user: NOTARY_ID,
    notary: { notaryId: NOTARY_ID, status: "PENDING", isVerifiedAdvocate: false },
  }));
  const res = await handler(makeRequest({
    action: "approve_cdd",
    caseId: CASE_ID,
    assessmentId: ASSESSMENT_ID,
    rulesVersion: "PMPJ-2026.1",
    idempotencyKey: IDEMPOTENCY_KEY,
  }));
  assert.equal(res.status, 403);
});

test("approve_cdd executes atomic approval and transitions stage to DOCUMENTS_PENDING", async () => {
  const handler = createNotaryWorkspaceHandler(createMockDeps({ user: NOTARY_ID }));
  const res = await handler(makeRequest({
    action: "approve_cdd",
    caseId: CASE_ID,
    assessmentId: ASSESSMENT_ID,
    rulesVersion: "PMPJ-2026.1",
    idempotencyKey: IDEMPOTENCY_KEY,
  }));
  assert.equal(res.status, 200);
  const json = await res.json() as any;
  assert.equal(json.ok, true);
  assert.equal(json.data.currentStage, "DOCUMENTS_PENDING");
  assert.equal(json.data.replayed, false);
});

test("approve_cdd parses RestError BO_VERIFICATION_REQUIRED to CDD_NOT_READY", async () => {
  const restError = new RestError(400, "BO_VERIFICATION_REQUIRED: Case has unverified beneficial owners");
  const handler = createNotaryWorkspaceHandler(createMockDeps({ user: NOTARY_ID, approveError: restError }));
  const res = await handler(makeRequest({
    action: "approve_cdd",
    caseId: CASE_ID,
    assessmentId: ASSESSMENT_ID,
    rulesVersion: "PMPJ-2026.1",
    idempotencyKey: IDEMPOTENCY_KEY,
  }));
  assert.equal(res.status, 400);
  const json = await res.json() as any;
  assert.equal(json.code, "CDD_NOT_READY");
});

test("unknown database error maps to 500 SERVER_ERROR without leaking raw SQL", async () => {
  const rawSqlError = new Error("pg_catalog.pg_database error: syntax error at or near 'SELECT'");
  const handler = createNotaryWorkspaceHandler(createMockDeps({ assignError: rawSqlError }));
  const res = await handler(makeRequest({
    action: "assign_notary",
    caseId: CASE_ID,
    notaryId: NOTARY_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
  }));
  assert.equal(res.status, 500);
  const json = await res.json() as any;
  assert.equal(json.code, "SERVER_ERROR");
  assert.equal(json.message.includes("syntax error"), false);
});
