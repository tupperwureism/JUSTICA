import {
  errorResponse,
  HttpError,
  jsonResponse,
  readJsonBody,
  requirePost,
} from "../_shared/http.ts";
import {
  rejectUnknownKeys,
  requireRecord,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export type EligibleCaseProjection = {
  caseId: string;
  orderId: string;
  entityType: string;
  proposedName: string;
  currentStage: string;
  domicileCity: string;
  domicileProvince: string;
  escrowStatus: string;
  fundsLockedAt: string | null;
  assignedNotaryId: string | null;
};

export type VerifiedNotaryProjection = {
  notaryId: string;
  fullName: string;
  licenseNumber: string;
  jurisdictionCity: string;
  jurisdictionProvince: string;
  status: string;
};

export type AdminActor = {
  adminId: string;
  roleGroup: string;
  isActive: boolean;
};

export type NotaryActor = {
  notaryId: string;
  status: string;
  isVerifiedAdvocate: boolean;
};

export type AssignNotaryResult = {
  caseId: string;
  assignedNotaryId: string;
  replayed: boolean;
};

export type ApproveCddResult = {
  caseId: string;
  assessmentId: string;
  currentStage: string;
  replayed: boolean;
};

export type NotaryWorkspaceDependencies = {
  verifyUser: (authorizationHeader: string | null) => Promise<string>;
  getAdminActor: (userId: string) => Promise<AdminActor | null>;
  getNotaryActor: (userId: string) => Promise<NotaryActor | null>;
  listAssignmentContext: () => Promise<{
    cases: EligibleCaseProjection[];
    notaries: VerifiedNotaryProjection[];
  }>;
  assignNotary: (params: {
    caseId: string;
    notaryId: string;
    adminId: string;
    idempotencyKey: string;
  }) => Promise<AssignNotaryResult>;
  approveCdd: (params: {
    caseId: string;
    assessmentId: string;
    notaryId: string;
    rulesVersion: string;
    idempotencyKey: string;
  }) => Promise<ApproveCddResult>;
};

function corsHeaders(origin: string | null): HeadersInit {
  if (origin && allowedOrigins.has(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-max-age": "86400",
      vary: "Origin",
    };
  }
  return { vary: "Origin" };
}

function sanitizeDatabaseError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("FORBIDDEN_ADMIN_ROLE_REQUIRED") || msg.includes("FORBIDDEN_NOT_ASSIGNED_NOTARY")) {
    return new HttpError(403, "FORBIDDEN", "Akun tidak berwenang menjalankan operasi ini.");
  }
  if (msg.includes("NOTARY_NOT_VERIFIED")) {
    return new HttpError(400, "NOTARY_NOT_VERIFIED", "Notaris yang dipilih belum terverifikasi aktif.");
  }
  if (msg.includes("ESCROW_NOT_HELD")) {
    return new HttpError(400, "ESCROW_NOT_HELD", "Dana escrow perkara belum terkunci.");
  }
  if (msg.includes("RESOURCE_NOT_FOUND")) {
    return new HttpError(404, "RESOURCE_NOT_FOUND", "Perkara atau penilaian CDD tidak ditemukan.");
  }
  if (msg.includes("ASSIGNMENT_CONFLICT")) {
    return new HttpError(409, "ASSIGNMENT_CONFLICT", "Perkara sudah ditugaskan ke Notaris lain.");
  }
  if (msg.includes("STAGE_CONFLICT")) {
    return new HttpError(409, "STAGE_CONFLICT", "Status perkara tidak memungkinkan operasi ini.");
  }
  if (msg.includes("IDEMPOTENCY_CONFLICT")) {
    return new HttpError(409, "IDEMPOTENCY_CONFLICT", "Kunci idempotensi sudah digunakan dengan muatan data berbeda.");
  }
  if (msg.includes("CDD_SCREENING_UNRESOLVED") || msg.includes("BO_VERIFICATION_REQUIRED")) {
    return new HttpError(400, "CDD_NOT_READY", "Prasyarat CDD atau Beneficial Owner belum terpenuhi.");
  }
  if (msg.includes("RULES_VERSION_MISMATCH") || msg.includes("INVALID_ARGUMENTS")) {
    return new HttpError(400, "INVALID_PAYLOAD", "Parameter permintaan tidak valid.");
  }

  // Generic sanitized server error (no leaking internal SQL/PII)
  return new HttpError(500, "SERVER_ERROR", "Permintaan tidak dapat diproses saat ini.");
}

export function createNotaryWorkspaceHandler(
  deps: NotaryWorkspaceDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      if (origin && !allowedOrigins.has(origin)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    try {
      requirePost(request);

      if (origin && !allowedOrigins.has(origin)) {
        throw new HttpError(403, "FORBIDDEN_ORIGIN", "Origin not allowed.");
      }

      const authHeader = request.headers.get("authorization");
      const userId = await deps.verifyUser(authHeader);

      const { value: rawBody } = await readJsonBody(request);
      const record = requireRecord(rawBody);
      const action = requireString(record, "action", 64);

      let responseData: unknown;

      if (action === "list_assignment_context") {
        rejectUnknownKeys(record, ["action"], "list_assignment_context");
        const admin = await deps.getAdminActor(userId);
        if (!admin || !admin.isActive || !["COMPLIANCE_OFFICER", "SUPER_ADMIN"].includes(admin.roleGroup)) {
          throw new HttpError(403, "FORBIDDEN", "Akses daftar penugasan hanya untuk Admin Kepatuhan.");
        }
        responseData = await deps.listAssignmentContext();
      } else if (action === "assign_notary") {
        rejectUnknownKeys(record, ["action", "caseId", "notaryId", "idempotencyKey", "adminId", "role"], "assign_notary");
        const admin = await deps.getAdminActor(userId);
        if (!admin || !admin.isActive || !["COMPLIANCE_OFFICER", "SUPER_ADMIN"].includes(admin.roleGroup)) {
          throw new HttpError(403, "FORBIDDEN", "Penugasan notaris hanya dapat dilakukan oleh Admin Kepatuhan.");
        }

        const caseId = requireUuid(record, "caseId");
        const notaryId = requireUuid(record, "notaryId");
        const idempotencyKey = requireString(record, "idempotencyKey", 128);

        try {
          responseData = await deps.assignNotary({
            caseId,
            notaryId,
            adminId: admin.adminId,
            idempotencyKey,
          });
        } catch (err) {
          throw sanitizeDatabaseError(err);
        }
      } else if (action === "approve_cdd") {
        rejectUnknownKeys(record, ["action", "caseId", "assessmentId", "rulesVersion", "idempotencyKey"], "approve_cdd");
        const notary = await deps.getNotaryActor(userId);
        if (!notary || notary.status !== "VERIFIED_ACTIVE") {
          throw new HttpError(403, "FORBIDDEN", "Hanya Notaris terverifikasi aktif yang dapat menyetujui CDD.");
        }

        const caseId = requireUuid(record, "caseId");
        const assessmentId = requireUuid(record, "assessmentId");
        const rulesVersion = requireString(record, "rulesVersion", 32);
        const idempotencyKey = requireString(record, "idempotencyKey", 128);

        try {
          responseData = await deps.approveCdd({
            caseId,
            assessmentId,
            notaryId: notary.notaryId,
            rulesVersion,
            idempotencyKey,
          });
        } catch (err) {
          throw sanitizeDatabaseError(err);
        }
      } else {
        throw new HttpError(400, "INVALID_PAYLOAD", `Aksi '${action}' tidak dikenali.`);
      }

      const response = jsonResponse({ ok: true, data: responseData }, 200);
      const headers = corsHeaders(origin);
      for (const [k, v] of Object.entries(headers)) {
        response.headers.set(k, v);
      }
      return response;
    } catch (error) {
      const sanitized = sanitizeDatabaseError(error);
      const response = errorResponse(sanitized);
      const headers = corsHeaders(origin);
      for (const [k, v] of Object.entries(headers)) {
        response.headers.set(k, v);
      }
      return response;
    }
  };
}
