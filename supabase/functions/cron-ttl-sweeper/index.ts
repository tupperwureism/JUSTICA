import { deriveIdempotencyKey, sha256Hex } from "../_shared/crypto.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  requirePost,
} from "../_shared/http.ts";
import { callRpc, selectRows } from "../_shared/rest.ts";

type ExpiredEnvelope = {
  envelope_id: string;
};

async function safelyEqual(left: string, right: string): Promise<boolean> {
  if (!left || !right) return false;
  return (await sha256Hex(left)) === (await sha256Hex(right));
}

async function handle(request: Request): Promise<Response> {
  requirePost(request);
  const suppliedSecret = request.headers.get("x-cron-secret") ?? "";
  const expectedSecret = Deno.env.get("TTL_SWEEPER_SECRET") ?? "";
  if (!(await safelyEqual(suppliedSecret, expectedSecret))) {
    throw new HttpError(401, "INVALID_CRON_SECRET", "Cron authentication failed.");
  }

  const limitValue = Number(Deno.env.get("TTL_SWEEPER_BATCH_SIZE") ?? "100");
  const limit = Number.isInteger(limitValue) && limitValue >= 1 && limitValue <= 500
    ? limitValue
    : 100;
  const query = new URLSearchParams({
    select: "envelope_id",
    global_status: "eq.ACTIVE",
    expires_at: `lte.${new Date().toISOString()}`,
    order: "expires_at.asc",
    limit: String(limit),
  });
  const expired = await selectRows<ExpiredEnvelope>("signing_envelopes", query);

  const results = [];
  for (const envelope of expired) {
    try {
      const result = await callRpc<unknown[]>("fn_global_halt_ekyc_and_refund_atomic", {
        p_envelope_id: envelope.envelope_id,
        p_party_id: null,
        p_verification_id: null,
        p_halt_reason: "TTL_EXPIRED",
        p_idempotency_key: await deriveIdempotencyKey("ttl-expired", envelope.envelope_id),
        p_actor_user_id: null,
      });
      results.push({ envelopeId: envelope.envelope_id, ok: true, result });
    } catch (error) {
      console.error(
        "TTL halt failed",
        envelope.envelope_id,
        error instanceof Error ? error.message : "unknown",
      );
      results.push({ envelopeId: envelope.envelope_id, ok: false });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  return jsonResponse(
    { ok: failed === 0, scanned: expired.length, halted: expired.length - failed, failed, results },
    failed === 0 ? 200 : 207,
  );
}

Deno.serve(async (request) => {
  try {
    return await handle(request);
  } catch (error) {
    return errorResponse(error);
  }
});
