import { deriveIdempotencyKey } from "../_shared/crypto.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  readJsonBody,
  requirePost,
} from "../_shared/http.ts";
import { callRpc, eq, selectRows } from "../_shared/rest.ts";
import {
  rejectUnknownKeys,
  requireEnum,
  requireInteger,
  requireIsoTimestamp,
  requireRecord,
  requireSha256,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";
import { requireValidWebhookSignature } from "../_shared/webhook.ts";

type EkycOutcome =
  | "PASSED"
  | "LIVENESS_FAILED"
  | "ILLEGAL_CONFIRMED"
  | "REQUIRES_MANUAL_REVIEW";

type EkycPayload = {
  providerEventId: string;
  envelopeId: string;
  partyId: string;
  userId: string;
  userRole: "client" | "advocate";
  verificationType: "LIVENESS_OCR" | "SIPP_BIOMETRIC";
  outcome: EkycOutcome;
  livenessAttemptCount: number;
  evidenceDigestSha256: string;
  verifiedAt: string;
};

type Verification = {
  verification_id: string;
  envelope_id: string;
  party_id: string;
  user_id: string;
  user_role: string;
  provider_name: string;
  provider_reference_id: string;
  verification_type: string;
  status: string;
  liveness_attempt_count: number;
  result_digest_sha256: string;
  verified_at: string;
};

type CallbackResult = {
  verification_id: string | null;
  global_status: string;
  expired: boolean;
  replayed: boolean;
};

function parsePayload(value: unknown): EkycPayload {
  const payload = requireRecord(value);
  rejectUnknownKeys(payload, [
    "providerEventId",
    "envelopeId",
    "partyId",
    "userId",
    "userRole",
    "verificationType",
    "outcome",
    "livenessAttemptCount",
    "evidenceDigestSha256",
    "verifiedAt",
  ]);
  const result: EkycPayload = {
    providerEventId: requireString(payload, "providerEventId", 192),
    envelopeId: requireUuid(payload, "envelopeId"),
    partyId: requireUuid(payload, "partyId"),
    userId: requireUuid(payload, "userId"),
    userRole: requireEnum(payload, "userRole", ["client", "advocate"]),
    verificationType: requireEnum(payload, "verificationType", [
      "LIVENESS_OCR",
      "SIPP_BIOMETRIC",
    ]),
    outcome: requireEnum(payload, "outcome", [
      "PASSED",
      "LIVENESS_FAILED",
      "ILLEGAL_CONFIRMED",
      "REQUIRES_MANUAL_REVIEW",
    ]),
    livenessAttemptCount: requireInteger(payload, "livenessAttemptCount", 0, 3),
    evidenceDigestSha256: requireSha256(payload, "evidenceDigestSha256"),
    verifiedAt: requireIsoTimestamp(payload, "verifiedAt"),
  };
  if (
    (result.outcome === "LIVENESS_FAILED" &&
      (result.verificationType !== "LIVENESS_OCR" || result.livenessAttemptCount < 1)) ||
    (result.outcome !== "LIVENESS_FAILED" && result.livenessAttemptCount !== 0) ||
    (result.verificationType === "SIPP_BIOMETRIC" && result.userRole !== "advocate")
  ) {
    throw new HttpError(
      400,
      "INVALID_VERIFICATION_COMBINATION",
      "Verification role, type, outcome, and attempt are inconsistent.",
    );
  }
  return result;
}

function databaseStatus(outcome: EkycOutcome): string {
  if (outcome === "PASSED") return "PASSED";
  if (outcome === "REQUIRES_MANUAL_REVIEW") return "REQUIRES_MANUAL_REVIEW";
  return "REJECTED";
}

async function findVerification(
  providerName: string,
  providerEventId: string,
): Promise<Verification | null> {
  const rows = await selectRows<Verification>(
    "ekyc_verification_logs",
    new URLSearchParams({
      select:
        "verification_id,envelope_id,party_id,user_id,user_role,provider_name,provider_reference_id,verification_type,status,liveness_attempt_count,result_digest_sha256,verified_at",
      provider_name: eq(providerName),
      provider_reference_id: eq(providerEventId),
      limit: "1",
    }),
  );
  return rows[0] ?? null;
}

function assertSameVerification(
  existing: Verification,
  payload: EkycPayload,
  providerName: string,
): void {
  if (
    existing.envelope_id !== payload.envelopeId ||
    existing.party_id !== payload.partyId ||
    existing.user_id !== payload.userId ||
    existing.user_role !== payload.userRole ||
    existing.provider_name !== providerName ||
    existing.verification_type !== payload.verificationType ||
    existing.status !== databaseStatus(payload.outcome) ||
    existing.liveness_attempt_count !== payload.livenessAttemptCount ||
    existing.result_digest_sha256 !== payload.evidenceDigestSha256 ||
    Date.parse(existing.verified_at) !== Date.parse(payload.verifiedAt)
  ) {
    throw new HttpError(409, "IDEMPOTENCY_CONFLICT", "Provider event ID was reused.");
  }
}

async function handle(request: Request): Promise<Response> {
  requirePost(request);
  const { rawBody, value } = await readJsonBody(request);
  await requireValidWebhookSignature({
    request,
    rawBody,
    secretEnvironmentName: "EKYC_WEBHOOK_SECRET",
    maxSkewEnvironmentName: "EKYC_WEBHOOK_MAX_SKEW_SECONDS",
  });
  const payload = parsePayload(value);
  const providerName = Deno.env.get("EKYC_PROVIDER_NAME")?.trim();
  if (!providerName || providerName.length > 64) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "e-KYC provider name is unavailable.");
  }

  const replay = await findVerification(providerName, payload.providerEventId);
  if (replay) {
    assertSameVerification(replay, payload, providerName);
  }

  const idempotencyKey = await deriveIdempotencyKey(
    "ekyc-callback",
    `${providerName}:${payload.providerEventId}`,
  );
  const rows = await callRpc<CallbackResult[]>("fn_process_ekyc_callback_atomic", {
    p_envelope_id: payload.envelopeId,
    p_party_id: payload.partyId,
    p_user_id: payload.userId,
    p_user_role: payload.userRole,
    p_provider_name: providerName,
    p_provider_reference_id: payload.providerEventId,
    p_verification_type: payload.verificationType,
    p_outcome: payload.outcome,
    p_liveness_attempt_count: payload.livenessAttemptCount,
    p_result_digest_sha256: payload.evidenceDigestSha256,
    p_verified_at: payload.verifiedAt,
    p_idempotency_key: idempotencyKey,
  });
  const result = rows[0];
  if (!result) {
    throw new HttpError(500, "RPC_RESULT_MISSING", "e-KYC callback result is unavailable.");
  }
  if (result.expired) {
    return jsonResponse(
      {
        ok: false,
        code: "ENVELOPE_EXPIRED",
        message: "The seven-day e-KYC window has expired.",
        globalStatus: result.global_status,
      },
      410,
    );
  }
  return jsonResponse({
    ok: true,
    replayed: result.replayed,
    verificationId: result.verification_id,
    globalStatus: result.global_status,
  });
}

Deno.serve(async (request) => {
  try {
    return await handle(request);
  } catch (error) {
    return errorResponse(error);
  }
});
