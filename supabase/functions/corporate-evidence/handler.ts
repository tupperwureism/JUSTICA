import { sha256HexBytes } from "../_shared/crypto.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  readJsonBody,
} from "../_shared/http.ts";
import {
  rejectUnknownKeys,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const allowedMimes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

type PrepareResult = {
  evidence_id: string;
  bucket_id: string;
  object_path: string;
  status: string;
  expires_at: string;
  replayed: boolean;
};

type FinalizeResult = {
  evidence_id: string;
  evidence_reference: string;
  status: string;
  expires_at: string;
  replayed: boolean;
};

export type StorageEvidenceRecord = {
  evidence_id: string;
  client_id: string;
  bucket_id: string;
  object_path: string;
  status: string;
  declared_mime: string;
  declared_byte_size: number;
  expires_at: string;
  artifact_storage_object_id?: string | null;
  artifact_detected_mime?: string | null;
  artifact_actual_byte_size?: number | null;
  artifact_sha256_digest?: string | null;
  artifact_finalize_idempotency_key?: string | null;
  storage_object_id: string | null;
  storage_owner_id: string | null;
  stored_mime: string | null;
  stored_byte_size: number | null;
};

type PrepareParameters = {
  p_evidence_id: string;
  p_client_id: string;
  p_declared_mime: string;
  p_declared_byte_size: number;
  p_idempotency_key: string;
  p_actor_user_id: string;
};

type FinalizeParameters = {
  p_evidence_id: string;
  p_client_id: string;
  p_storage_object_id: string;
  p_detected_mime: string;
  p_actual_byte_size: number;
  p_sha256_digest: string;
  p_idempotency_key: string;
  p_actor_user_id: string;
};

export type CorporateEvidenceDependencies = {
  verifyUser(request: Request): Promise<string>;
  hasClientProfile(userId: string, request: Request): Promise<boolean>;
  prepare(parameters: PrepareParameters): Promise<PrepareResult>;
  resolveStorageObject(
    evidenceId: string,
    clientId: string,
  ): Promise<StorageEvidenceRecord | null>;
  downloadObject(bucketId: string, objectPath: string): Promise<Uint8Array>;
  finalize(parameters: FinalizeParameters): Promise<FinalizeResult>;
  reject(
    evidenceId: string,
    clientId: string,
    rejectionCode: string,
  ): Promise<void>;
};

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
  };
}

function withCors(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function detectAllowedMime(bytes: Uint8Array): typeof allowedMimes[number] | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) return "application/pdf";
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) return "image/jpeg";
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length >= png.length && png.every((value, index) => bytes[index] === value)) {
    return "image/png";
  }
  return null;
}

async function verifiedClient(
  request: Request,
  dependencies: CorporateEvidenceDependencies,
): Promise<string> {
  let userId: string;
  try {
    userId = await dependencies.verifyUser(request);
  } catch {
    throw new HttpError(401, "INVALID_JWT", "A valid user session is required.");
  }
  if (!(await dependencies.hasClientProfile(userId, request))) {
    throw new HttpError(403, "CLIENT_PROFILE_REQUIRED", "A client profile is required.");
  }
  return userId;
}

async function prepare(
  request: Request,
  userId: string,
  dependencies: CorporateEvidenceDependencies,
): Promise<Response> {
  const body = requireRecord((await readJsonBody(request, 8 * 1024)).value);
  rejectUnknownKeys(body, [
    "evidenceId",
    "declaredMime",
    "declaredByteSize",
    "idempotencyKey",
  ]);
  const result = await dependencies.prepare({
    p_evidence_id: requireUuid(body, "evidenceId").toLowerCase(),
    p_client_id: userId,
    p_declared_mime: requireEnum(body, "declaredMime", allowedMimes),
    p_declared_byte_size: requireInteger(body, "declaredByteSize", 1, 10_485_760),
    p_idempotency_key: requireString(body, "idempotencyKey", 48),
    p_actor_user_id: userId,
  });
  return jsonResponse({
    evidenceId: result.evidence_id,
    bucketId: result.bucket_id,
    objectPath: result.object_path,
    status: result.status,
    expiresAt: result.expires_at,
    replayed: result.replayed,
  });
}

async function rejectPermanent(
  dependencies: CorporateEvidenceDependencies,
  evidenceId: string,
  userId: string,
  rejectionCode: string,
  status: number,
  code: string,
  message: string,
): Promise<never> {
  await dependencies.reject(evidenceId, userId, rejectionCode);
  throw new HttpError(status, code, message);
}

async function finalize(
  request: Request,
  userId: string,
  dependencies: CorporateEvidenceDependencies,
): Promise<Response> {
  const body = requireRecord((await readJsonBody(request, 8 * 1024)).value);
  rejectUnknownKeys(body, ["evidenceId", "idempotencyKey"]);
  const evidenceId = requireUuid(body, "evidenceId").toLowerCase();
  const idempotencyKey = requireString(body, "idempotencyKey", 48);
  const artifact = await dependencies.resolveStorageObject(evidenceId, userId);
  if (!artifact) {
    throw new HttpError(404, "EVIDENCE_NOT_FOUND", "Evidence was not found.");
  }
  if (artifact.client_id !== userId) {
    throw new HttpError(403, "EVIDENCE_OWNER_MISMATCH", "Evidence ownership is invalid.");
  }
  if (artifact.status === "CONSUMED") {
    if (
      artifact.artifact_finalize_idempotency_key !== idempotencyKey
    ) {
      throw new HttpError(
        409,
        "EVIDENCE_CONFLICT",
        "Evidence replay conflicts with existing state.",
      );
    }
    if (
      !artifact.artifact_storage_object_id ||
      !artifact.artifact_detected_mime ||
      !artifact.artifact_actual_byte_size ||
      !artifact.artifact_sha256_digest
    ) {
      throw new HttpError(
        503,
        "EVIDENCE_METADATA_INVALID",
        "Evidence metadata is temporarily unavailable.",
      );
    }
    const replay = await dependencies.finalize({
      p_evidence_id: evidenceId,
      p_client_id: userId,
      p_storage_object_id: artifact.artifact_storage_object_id,
      p_detected_mime: artifact.artifact_detected_mime,
      p_actual_byte_size: artifact.artifact_actual_byte_size,
      p_sha256_digest: artifact.artifact_sha256_digest,
      p_idempotency_key: idempotencyKey,
      p_actor_user_id: userId,
    });
    return jsonResponse({
      evidenceReference: replay.evidence_reference,
      status: replay.status,
      expiresAt: replay.expires_at,
      replayed: replay.replayed,
    });
  }
  if (!["PENDING_UPLOAD", "HASHED"].includes(artifact.status)) {
    throw new HttpError(
      422,
      "EVIDENCE_STATE_INVALID",
      "Evidence state does not allow finalization.",
    );
  }
  const expiresAt = Date.parse(artifact.expires_at);
  if (!Number.isFinite(expiresAt)) {
    throw new HttpError(
      503,
      "EVIDENCE_METADATA_INVALID",
      "Evidence metadata is temporarily unavailable.",
    );
  }
  if (expiresAt <= Date.now()) {
    throw new HttpError(422, "EVIDENCE_EXPIRED", "Evidence has expired.");
  }
  if (!artifact.storage_owner_id) {
    throw new HttpError(
      503,
      "STORAGE_METADATA_UNAVAILABLE",
      "Evidence storage metadata is temporarily unavailable.",
    );
  }
  if (artifact.storage_owner_id !== userId) {
    throw new HttpError(403, "EVIDENCE_OWNER_MISMATCH", "Evidence ownership is invalid.");
  }
  const extension = artifact.declared_mime === "application/pdf"
    ? "pdf"
    : artifact.declared_mime === "image/jpeg"
    ? "jpg"
    : artifact.declared_mime === "image/png"
    ? "png"
    : null;
  const expectedPath = extension
    ? `${userId.toLowerCase()}/${evidenceId}/source.${extension}`
    : "";
  if (
    artifact.bucket_id !== "corporate-intake-evidence" ||
    artifact.object_path !== expectedPath
  ) {
    throw new HttpError(409, "EVIDENCE_OBJECT_MISMATCH", "Evidence object metadata is inconsistent.");
  }
  if (!artifact.storage_object_id) {
    throw new HttpError(409, "EVIDENCE_NOT_UPLOADED", "Upload the evidence object before finalizing.");
  }
  if (
    artifact.artifact_storage_object_id &&
    artifact.artifact_storage_object_id !== artifact.storage_object_id
  ) {
    throw new HttpError(409, "EVIDENCE_OBJECT_REPLACED", "Evidence object identity changed.");
  }
  if (artifact.stored_byte_size === null || artifact.stored_mime === null) {
    throw new HttpError(
      503,
      "STORAGE_METADATA_UNAVAILABLE",
      "Evidence storage metadata is temporarily unavailable.",
    );
  }
  if (artifact.stored_byte_size < 1 || artifact.stored_byte_size > 10_485_760) {
    await rejectPermanent(
      dependencies,
      evidenceId,
      userId,
      artifact.stored_byte_size === 0 ? "EMPTY_FILE" : "SIZE_INVALID",
      artifact.stored_byte_size && artifact.stored_byte_size > 10_485_760 ? 413 : 415,
      "EVIDENCE_SIZE_INVALID",
      "Stored evidence size is invalid.",
    );
  }
  let bytes: Uint8Array;
  try {
    bytes = await dependencies.downloadObject(artifact.bucket_id, artifact.object_path);
  } catch (error) {
    if (error instanceof HttpError && error.status === 413) {
      await rejectPermanent(
        dependencies,
        evidenceId,
        userId,
        "SIZE_INVALID",
        413,
        "EVIDENCE_TOO_LARGE",
        "Stored evidence exceeds the size limit.",
      );
    }
    throw error;
  }
  if (bytes.byteLength === 0) {
    await rejectPermanent(
      dependencies,
      evidenceId,
      userId,
      "EMPTY_FILE",
      415,
      "EVIDENCE_EMPTY",
      "Stored evidence is empty.",
    );
  }
  if (
    bytes.byteLength > 10_485_760 ||
    bytes.byteLength !== artifact.declared_byte_size ||
    bytes.byteLength !== artifact.stored_byte_size
  ) {
    await rejectPermanent(
      dependencies,
      evidenceId,
      userId,
      "SIZE_INVALID",
      bytes.byteLength > 10_485_760 ? 413 : 415,
      "EVIDENCE_SIZE_MISMATCH",
      "Stored evidence size does not match its declaration.",
    );
  }
  const detectedMime = detectAllowedMime(bytes);
  if (!detectedMime) {
    await rejectPermanent(
      dependencies,
      evidenceId,
      userId,
      "MAGIC_BYTES_INVALID",
      415,
      "EVIDENCE_MAGIC_INVALID",
      "Stored evidence has an unsupported file signature.",
    );
  }
  if (
    detectedMime !== artifact.declared_mime ||
    artifact.stored_mime !== artifact.declared_mime
  ) {
    await rejectPermanent(
      dependencies,
      evidenceId,
      userId,
      "MIME_MISMATCH",
      415,
      "EVIDENCE_MIME_MISMATCH",
      "Stored evidence MIME does not match its declaration.",
    );
  }
  const result = await dependencies.finalize({
    p_evidence_id: evidenceId,
    p_client_id: userId,
    p_storage_object_id: artifact.storage_object_id,
    p_detected_mime: detectedMime,
    p_actual_byte_size: bytes.byteLength,
    p_sha256_digest: await sha256HexBytes(bytes),
    p_idempotency_key: idempotencyKey,
    p_actor_user_id: userId,
  });
  return jsonResponse({
    evidenceReference: result.evidence_reference,
    status: result.status,
    expiresAt: result.expires_at,
    replayed: result.replayed,
  });
}

export function createCorporateEvidenceHandler(
  dependencies: CorporateEvidenceDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const origin = request.headers.get("origin");
    try {
      if (origin && !allowedOrigins.has(origin)) {
        throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Request origin is not allowed.");
      }
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), origin);
      }
      if (request.method !== "POST") {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "Only POST is accepted.");
      }
      const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
      const endpoint = pathname.endsWith("/corporate-evidence/prepare")
        ? "prepare"
        : pathname.endsWith("/corporate-evidence/finalize")
        ? "finalize"
        : null;
      if (!endpoint) {
        throw new HttpError(400, "INVALID_PATH", "The requested evidence operation is invalid.");
      }
      const userId = await verifiedClient(request, dependencies);
      const response = endpoint === "prepare"
        ? await prepare(request, userId, dependencies)
        : await finalize(request, userId, dependencies);
      return withCors(response, origin);
    } catch (error) {
      return withCors(errorResponse(error), origin);
    }
  };
}
