import { HttpError } from "../_shared/http.ts";
import { callRpc, RestError } from "../_shared/rest.ts";
import {
  createCorporateEvidenceHandler,
  type StorageEvidenceRecord,
} from "./handler.ts";

function environment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Evidence service is unavailable.");
  }
  return value;
}

async function firstRpcRow<T>(name: string, parameters: unknown): Promise<T> {
  try {
    const rows = await callRpc<T[]>(name, parameters);
    if (rows.length !== 1) {
      throw new HttpError(500, "BACKEND_CONTRACT_INVALID", "Evidence service is unavailable.");
    }
    return rows[0];
  } catch (error) {
    if (!(error instanceof RestError)) throw error;
    const details = JSON.stringify(error.details);
    if (details.includes("IDEMPOTENCY_CONFLICT") || details.includes("REPLAY_CONFLICT")) {
      throw new HttpError(409, "EVIDENCE_CONFLICT", "Evidence replay conflicts with existing state.");
    }
    if (details.includes("NOT_FOUND")) {
      throw new HttpError(404, "EVIDENCE_NOT_FOUND", "Evidence was not found.");
    }
    if (details.includes("OWNER_MISMATCH") || details.includes("ACTOR_MISMATCH")) {
      throw new HttpError(403, "EVIDENCE_FORBIDDEN", "Evidence access is forbidden.");
    }
    if (details.includes("STATE_INVALID") || details.includes("TERMINAL")) {
      throw new HttpError(422, "EVIDENCE_STATE_INVALID", "Evidence state does not allow this operation.");
    }
    throw new HttpError(500, "EVIDENCE_BACKEND_FAILURE", "Evidence service is unavailable.");
  }
}

const handler = createCorporateEvidenceHandler({
  verifyUser: async (request) => {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new Error("missing authorization");
    }
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!publishableKey) throw new Error("missing publishable key");
    const response = await fetch(`${environment("SUPABASE_URL")}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        authorization,
      },
    });
    if (!response.ok) throw new Error("invalid jwt");
    const value = await response.json() as { id?: unknown };
    if (typeof value.id !== "string") throw new Error("invalid auth response");
    return value.id;
  },
  hasClientProfile: (userId) =>
    callRpc<boolean>("fn_is_corporate_intake_client", { p_client_id: userId }),
  prepare: (parameters) =>
    firstRpcRow("fn_prepare_corporate_intake_evidence_atomic", parameters),
  resolveStorageObject: async (evidenceId, clientId) => {
    const rows = await callRpc<StorageEvidenceRecord[]>(
      "fn_get_corporate_intake_evidence_storage_object",
      { p_evidence_id: evidenceId, p_client_id: clientId },
    );
    return rows[0] ?? null;
  },
  downloadObject: async (bucketId, objectPath) => {
    const serviceKey = environment("SUPABASE_SERVICE_ROLE_KEY");
    const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(
      `${environment("SUPABASE_URL")}/storage/v1/object/authenticated/${bucketId}/${encodedPath}`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      },
    );
    if (response.status === 404) {
      throw new HttpError(404, "EVIDENCE_OBJECT_NOT_FOUND", "Evidence object was not found.");
    }
    if (!response.ok) {
      throw new HttpError(503, "STORAGE_UNAVAILABLE", "Evidence storage is temporarily unavailable.");
    }
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 10_485_760) {
      throw new HttpError(413, "EVIDENCE_TOO_LARGE", "Stored evidence exceeds the size limit.");
    }
    return new Uint8Array(await response.arrayBuffer());
  },
  finalize: (parameters) =>
    firstRpcRow("fn_finalize_corporate_intake_evidence_atomic", parameters),
  reject: async (evidenceId, clientId, rejectionCode) => {
    await firstRpcRow(
      "fn_reject_corporate_intake_evidence_atomic",
      {
        p_evidence_id: evidenceId,
        p_client_id: clientId,
        p_rejection_code: rejectionCode,
        p_actor_user_id: clientId,
      },
    );
  },
});

Deno.serve(handler);
