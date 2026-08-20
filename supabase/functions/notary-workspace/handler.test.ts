import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../_shared/http.ts";
import {
  createNotaryWorkspaceHandler,
  type NotaryWorkspaceDependencies,
} from "./handler.ts";

const adminId = "11111111-1111-4111-8111-111111111111";
const notaryId = "22222222-2222-4222-8222-222222222222";
const caseId = "33333333-3333-4333-8333-333333333333";
const assessmentId = "44444444-4444-4444-8444-444444444444";

function dependencies(
  overrides: Partial<NotaryWorkspaceDependencies> = {},
): NotaryWorkspaceDependencies {
  return {
    verifyUser: async () => adminId,
    getAdminActor: async (userId: string) => {
      if (userId === adminId) {
        return { adminId, roleGroup: "COMPLIANCE_OFFICER", isActive: true };
      }
      return null;
    },
    getNotaryActor: async (userId: string) => {
      if (userId === notaryId) {
        return { notaryId, status: "VERIFIED_ACTIVE", isVerifiedAdvocate: true };
      }
      return null;
    },
    listAssignmentContext: async () => ({
      cases: [
        {
          caseId,
          orderId: "55555555-5555-4555-8555-555555555555",
          entityType: "PT_ORDINARY",
          proposedName: "PT Maju Bersama",
          currentStage: "ESCROW_LOCKED",
          domicileCity: "Jakarta Selatan",
          domicileProvince: "DKI Jakarta",
          escrowStatus: "HELD_IN_ESCROW",
          fundsLockedAt: "2026-08-20T10:00:00.000Z",
          assignedNotaryId: null,
        },
      ],
      notaries: [
        {
          notaryId,
          fullName: "Notaris Budi S.H. M.Kn",
          licenseNumber: "NOT-2026-001",
          jurisdictionCity: "Jakarta Selatan",
          jurisdictionProvince: "DKI Jakarta",
          status: "VERIFIED_ACTIVE",
        },
      ],
    }),
    assignNotary: async () => ({
      caseId,
      assignedNotaryId: notaryId,
      replayed: false,
    }),
    approveCdd: async () => ({
      caseId,
      assessmentId,
      currentStage: "DOCUMENTS_PENDING",
      replayed: false,
    }),
    ...overrides,
  };
}

function makeRequest(
  body: unknown,
  options: {
    origin?: string;
    auth?: string;
    method?: string;
  } = {},
): Request {
  return new Request("http://localhost/functions/v1/notary-workspace", {
    method: options.method ?? "POST",
    headers: {
      origin: options.origin ?? "http://localhost:5173",
      authorization: options.auth ?? "Bearer test-token",
      "content-type": "application/json",
    },
    body: options.method === "OPTIONS" ? undefined : JSON.stringify(body),
  });
}

test("OPTIONS preflight returns allowed localhost CORS headers", async () => {
  const handler = createNotaryWorkspaceHandler(dependencies());
  const response = await handler(
    new Request("http://localhost/functions/v1/notary-workspace", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:5173",
      },
    }),
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(
    response.headers.get("access-control-allow-methods"),
    "POST, OPTIONS",
  );
});

test("OPTIONS preflight rejects unauthorized origins", async () => {
  const handler = createNotaryWorkspaceHandler(dependencies());
  const response = await handler(
    new Request("http://localhost/functions/v1/notary-workspace", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil.com",
      },
    }),
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("missing or invalid authorization header returns 401 UNAUTHENTICATED", async () => {
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      verifyUser: async () => {
        throw new HttpError(401, "UNAUTHENTICATED", "Valid Supabase bearer token required.");
      },
    }),
  );
  const response = await handler(
    makeRequest({ action: "list_assignment_context" }, { auth: "Bearer invalid" }),
  );
  assert.equal(response.status, 401);
  const json = await response.json();
  assert.equal(json.code, "UNAUTHENTICATED");
});

test("list_assignment_context requires compliance or super_admin role", async () => {
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      getAdminActor: async () => null, // Not an admin
    }),
  );
  const response = await handler(makeRequest({ action: "list_assignment_context" }));
  assert.equal(response.status, 403);
  const json = await response.json();
  assert.equal(json.code, "FORBIDDEN");
});

test("list_assignment_context returns eligible cases and verified notaries for authorized admin", async () => {
  const handler = createNotaryWorkspaceHandler(dependencies());
  const response = await handler(makeRequest({ action: "list_assignment_context" }));
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.data.cases.length, 1);
  assert.equal(json.data.cases[0].caseId, caseId);
  assert.equal(json.data.notaries.length, 1);
  assert.equal(json.data.notaries[0].notaryId, notaryId);
});

test("assign_notary validates input and calls assignNotary RPC dependency", async () => {
  let calledParams: unknown = null;
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      assignNotary: async (params) => {
        calledParams = params;
        return { caseId: params.caseId, assignedNotaryId: params.notaryId, replayed: false };
      },
    }),
  );
  const response = await handler(
    makeRequest({
      action: "assign_notary",
      caseId,
      notaryId,
      idempotencyKey: "12345678-1234-1234-1234-1234567890ab",
    }),
  );
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.data.assignedNotaryId, notaryId);
  assert.equal(json.data.replayed, false);
  assert.deepEqual(calledParams, {
    caseId,
    notaryId,
    adminId,
    idempotencyKey: "12345678-1234-1234-1234-1234567890ab",
  });
});

test("assign_notary rejects caller-supplied actorId or fake role", async () => {
  let calledAdminId = "";
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      assignNotary: async (params) => {
        calledAdminId = params.adminId;
        return { caseId: params.caseId, assignedNotaryId: params.notaryId, replayed: false };
      },
    }),
  );
  const response = await handler(
    makeRequest({
      action: "assign_notary",
      caseId,
      notaryId,
      adminId: "99999999-9999-9999-9999-999999999999", // Attempted spoof
      role: "SUPER_ADMIN",
      idempotencyKey: "12345678-1234-1234-1234-1234567890ab",
    }),
  );
  assert.equal(response.status, 200);
  // Must use verified session adminId, not spoofed body adminId
  assert.equal(calledAdminId, adminId);
});

test("assign_notary handles conflict errors safely", async () => {
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      assignNotary: async () => {
        throw new HttpError(409, "ASSIGNMENT_CONFLICT", "Case is already assigned to another notary.");
      },
    }),
  );
  const response = await handler(
    makeRequest({
      action: "assign_notary",
      caseId,
      notaryId,
      idempotencyKey: "12345678-1234-1234-1234-1234567890ab",
    }),
  );
  assert.equal(response.status, 409);
  const json = await response.json();
  assert.equal(json.code, "ASSIGNMENT_CONFLICT");
});

test("approve_cdd requires verified active notary actor", async () => {
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      verifyUser: async () => notaryId,
      getNotaryActor: async () => null, // Not a verified notary
    }),
  );
  const response = await handler(
    makeRequest({
      action: "approve_cdd",
      caseId,
      assessmentId,
      rulesVersion: "2026.1",
      idempotencyKey: "cdd-idempotency-1",
    }),
  );
  assert.equal(response.status, 403);
  const json = await response.json();
  assert.equal(json.code, "FORBIDDEN");
});

test("approve_cdd executes atomic approval and transitions stage", async () => {
  let approvedParams: unknown = null;
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      verifyUser: async () => notaryId,
      approveCdd: async (params) => {
        approvedParams = params;
        return {
          caseId: params.caseId,
          assessmentId: params.assessmentId,
          currentStage: "DOCUMENTS_PENDING",
          replayed: false,
        };
      },
    }),
  );
  const response = await handler(
    makeRequest({
      action: "approve_cdd",
      caseId,
      assessmentId,
      rulesVersion: "2026.1",
      idempotencyKey: "cdd-idempotency-1",
    }),
  );
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.data.currentStage, "DOCUMENTS_PENDING");
  assert.equal(json.data.replayed, false);
  assert.deepEqual(approvedParams, {
    caseId,
    assessmentId,
    notaryId,
    rulesVersion: "2026.1",
    idempotencyKey: "cdd-idempotency-1",
  });
});

test("approve_cdd exact replay returns replayed: true", async () => {
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      verifyUser: async () => notaryId,
      approveCdd: async () => ({
        caseId,
        assessmentId,
        currentStage: "DOCUMENTS_PENDING",
        replayed: true,
      }),
    }),
  );
  const response = await handler(
    makeRequest({
      action: "approve_cdd",
      caseId,
      assessmentId,
      rulesVersion: "2026.1",
      idempotencyKey: "cdd-idempotency-1",
    }),
  );
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.data.replayed, true);
});

test("unknown database error maps to 500 SERVER_ERROR without leaking raw SQL", async () => {
  const handler = createNotaryWorkspaceHandler(
    dependencies({
      assignNotary: async () => {
        throw new Error("fatal: pg_internal connection pool exhausted at query 0xDEADBEEF");
      },
    }),
  );
  const response = await handler(
    makeRequest({
      action: "assign_notary",
      caseId,
      notaryId,
      idempotencyKey: "12345678-1234-1234-1234-1234567890ab",
    }),
  );
  assert.equal(response.status, 500);
  const json = await response.json();
  assert.equal(json.code, "SERVER_ERROR");
  assert.equal(json.message, "Permintaan tidak dapat diproses saat ini.");
  // Must NOT leak internal stack or SQL message
  assert.equal(JSON.stringify(json).includes("DEADBEEF"), false);
});
