import { callRpc, selectRows } from "../_shared/rest.ts";
import {
  createTtlSweeperHandler,
  type ExpiredEvidence,
  type ExpiredEnvelope,
} from "./handler.ts";

const batchSize = Number(Deno.env.get("TTL_SWEEPER_BATCH_SIZE") ?? "100");
const handler = createTtlSweeperHandler({
  expectedSecret: Deno.env.get("TTL_SWEEPER_SECRET") ?? "",
  batchSize,
  listExpiredEnvelopes: (limit) => {
    const query = new URLSearchParams({
      select: "envelope_id",
      global_status: "eq.ACTIVE",
      expires_at: `lte.${new Date().toISOString()}`,
      order: "expires_at.asc",
      limit: String(limit),
    });
    return selectRows<ExpiredEnvelope>("signing_envelopes", query);
  },
  haltEnvelope: (envelopeId, idempotencyKey) =>
    callRpc<unknown[]>("fn_global_halt_ekyc_and_refund_atomic", {
      p_envelope_id: envelopeId,
      p_party_id: null,
      p_verification_id: null,
      p_halt_reason: "TTL_EXPIRED",
      p_idempotency_key: idempotencyKey,
      p_actor_user_id: null,
    }),
  expireEvidence: (limit) =>
    callRpc<ExpiredEvidence[]>("fn_expire_corporate_intake_evidence_batch", {
      p_batch_size: limit,
    }),
});

Deno.serve(handler);
