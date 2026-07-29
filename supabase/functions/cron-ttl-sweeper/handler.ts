import { deriveIdempotencyKey, sha256Hex } from "../_shared/crypto.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  requirePost,
} from "../_shared/http.ts";

export type ExpiredEnvelope = {
  envelope_id: string;
};

export type ExpiredEvidence = {
  evidence_id: string;
  previous_status: string;
  status: string;
};

export type TtlSweeperDependencies = {
  expectedSecret: string;
  batchSize: number;
  listExpiredEnvelopes(limit: number): Promise<ExpiredEnvelope[]>;
  haltEnvelope(envelopeId: string, idempotencyKey: string): Promise<unknown>;
  expireEvidence(limit: number): Promise<ExpiredEvidence[]>;
};

async function safelyEqual(left: string, right: string): Promise<boolean> {
  if (!left || !right) return false;
  return (await sha256Hex(left)) === (await sha256Hex(right));
}

export function createTtlSweeperHandler(
  dependencies: TtlSweeperDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      requirePost(request);
      const suppliedSecret = request.headers.get("x-cron-secret") ?? "";
      if (!(await safelyEqual(suppliedSecret, dependencies.expectedSecret))) {
        throw new HttpError(401, "INVALID_CRON_SECRET", "Cron authentication failed.");
      }
      const limit = Number.isInteger(dependencies.batchSize) &&
          dependencies.batchSize >= 1 &&
          dependencies.batchSize <= 500
        ? dependencies.batchSize
        : 100;
      const expired = await dependencies.listExpiredEnvelopes(limit);
      const results = [];
      for (const envelope of expired) {
        try {
          const result = await dependencies.haltEnvelope(
            envelope.envelope_id,
            await deriveIdempotencyKey("ttl-expired", envelope.envelope_id),
          );
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
      let evidence = { scanned: 0, expired: 0, failed: 0 };
      try {
        const evidenceRows = await dependencies.expireEvidence(limit);
        evidence = {
          scanned: evidenceRows.length,
          expired: evidenceRows.filter((row) => row.status === "EXPIRED").length,
          failed: evidenceRows.filter((row) => row.status !== "EXPIRED").length,
        };
      } catch (error) {
        console.error(
          "Evidence TTL batch failed",
          error instanceof Error ? error.message : "unknown",
        );
        evidence.failed = 1;
      }
      const failed = results.filter((result) => !result.ok).length;
      const ok = failed === 0 && evidence.failed === 0;
      return jsonResponse(
        {
          ok,
          scanned: expired.length,
          halted: expired.length - failed,
          failed,
          results,
          evidence,
        },
        ok ? 200 : 207,
      );
    } catch (error) {
      return errorResponse(error);
    }
  };
}
