import { deriveIdempotencyKey, sha256Hex } from "../_shared/crypto.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  readJsonBody,
  requirePost,
} from "../_shared/http.ts";
import {
  callRpc,
  eq,
  insertRow,
  RestError,
  selectRows,
  updateRows,
} from "../_shared/rest.ts";
import {
  rejectUnknownKeys,
  requireEnum,
  requirePositiveAmount,
  requireRecord,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";
import { requireValidWebhookSignature } from "../_shared/webhook.ts";

type PaymentEvent = {
  event_id: string;
  order_id: string;
  provider_name: string;
  provider_event_id: string;
  event_type: string;
  payload_digest_sha256: string;
  signature_verified: boolean;
  processed_status: "PENDING" | "PROCESSED" | "FAILED" | "RETRYING";
};

type PaymentPayload = {
  providerEventId: string;
  eventType: "INVOICE_PAID";
  orderId: string;
  caseId: string;
  escrowId: string;
  amountIdr: number;
  paymentGatewayRef: string;
};

function parsePayload(value: unknown): PaymentPayload {
  const payload = requireRecord(value);
  rejectUnknownKeys(payload, [
    "providerEventId",
    "eventType",
    "orderId",
    "caseId",
    "escrowId",
    "amountIdr",
    "paymentGatewayRef",
  ]);
  return {
    providerEventId: requireString(payload, "providerEventId", 192),
    eventType: requireEnum(payload, "eventType", ["INVOICE_PAID"]),
    orderId: requireUuid(payload, "orderId"),
    caseId: requireUuid(payload, "caseId"),
    escrowId: requireUuid(payload, "escrowId"),
    amountIdr: requirePositiveAmount(payload, "amountIdr"),
    paymentGatewayRef: requireString(payload, "paymentGatewayRef", 64),
  };
}

async function findEvent(providerEventId: string): Promise<PaymentEvent | null> {
  const query = new URLSearchParams({
    select:
      "event_id,order_id,provider_name,provider_event_id,event_type,payload_digest_sha256,signature_verified,processed_status",
    provider_event_id: eq(providerEventId),
    limit: "1",
  });
  return (await selectRows<PaymentEvent>("provider_webhook_events", query))[0] ?? null;
}

function assertSameEvent(
  event: PaymentEvent,
  payload: PaymentPayload,
  providerName: string,
  digest: string,
): void {
  if (
    event.order_id !== payload.orderId ||
    event.provider_name !== providerName ||
    event.event_type !== payload.eventType ||
    event.payload_digest_sha256 !== digest ||
    !event.signature_verified
  ) {
    throw new HttpError(409, "IDEMPOTENCY_CONFLICT", "Provider event ID was reused.");
  }
}

async function registerEvent(
  payload: PaymentPayload,
  providerName: string,
  digest: string,
): Promise<PaymentEvent> {
  const existing = await findEvent(payload.providerEventId);
  if (existing) {
    assertSameEvent(existing, payload, providerName, digest);
    return existing;
  }

  try {
    return await insertRow<PaymentEvent>("provider_webhook_events", {
      order_id: payload.orderId,
      provider_name: providerName,
      provider_event_id: payload.providerEventId,
      event_type: payload.eventType,
      payload_digest_sha256: digest,
      signature_verified: true,
      processed_status: "PENDING",
    });
  } catch (error) {
    if (!(error instanceof RestError) || error.status !== 409) {
      throw error;
    }
    const raced = await findEvent(payload.providerEventId);
    if (!raced) {
      throw error;
    }
    assertSameEvent(raced, payload, providerName, digest);
    return raced;
  }
}

async function handle(request: Request): Promise<Response> {
  requirePost(request);
  const { rawBody, value } = await readJsonBody(request);
  await requireValidWebhookSignature({
    request,
    rawBody,
    secretEnvironmentName: "PAYMENT_WEBHOOK_SECRET",
    maxSkewEnvironmentName: "PAYMENT_WEBHOOK_MAX_SKEW_SECONDS",
  });
  const payload = parsePayload(value);
  const providerName = Deno.env.get("PAYMENT_PROVIDER_NAME")?.trim();
  if (!providerName || providerName.length > 64) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Payment provider name is unavailable.");
  }

  const digest = await sha256Hex(rawBody);
  const event = await registerEvent(payload, providerName, digest);
  if (event.processed_status === "PROCESSED") {
    return jsonResponse({ ok: true, replayed: true, eventId: event.event_id });
  }

  const idempotencyKey = await deriveIdempotencyKey(
    "payment-webhook",
    `${providerName}:${payload.providerEventId}`,
  );
  const result = await callRpc<unknown[]>("fn_lock_corporate_escrow_webhook_atomic", {
    p_order_id: payload.orderId,
    p_case_id: payload.caseId,
    p_escrow_id: payload.escrowId,
    p_expected_amount_idr: payload.amountIdr,
    p_payment_gateway_ref: payload.paymentGatewayRef,
    p_idempotency_key: idempotencyKey,
  });

  await updateRows(
    "provider_webhook_events",
    new URLSearchParams({ event_id: eq(event.event_id), processed_status: "in.(PENDING,RETRYING)" }),
    { processed_status: "PROCESSED", processed_at: new Date().toISOString() },
  );
  return jsonResponse({ ok: true, replayed: false, eventId: event.event_id, result });
}

Deno.serve(async (request) => {
  try {
    return await handle(request);
  } catch (error) {
    return errorResponse(error);
  }
});
