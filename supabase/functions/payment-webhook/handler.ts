import {
  deriveIdempotencyKey,
  sha256HexBytes,
  verifyHmacSha256Bytes,
} from "../_shared/crypto.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  requirePost,
} from "../_shared/http.ts";
import { callRpc, RestError } from "../_shared/rest.ts";
import {
  rejectUnknownKeys,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const RPC_NAME = "fn_process_corporate_payment_webhook_atomic";
const RESULT_KEYS = new Set([
  "event_id",
  "provider_event_id",
  "order_id",
  "corporate_case_id",
  "escrow_id",
  "escrow_status",
  "case_stage",
  "order_status",
  "provider_event_status",
  "funded_milestone_count",
  "replayed",
]);

type PaymentPayload = {
  providerEventId: string;
  eventType: "INVOICE_PAID";
  orderId: string;
  caseId: string;
  escrowId: string;
  amountIdr: number;
  paymentGatewayRef: string;
};

export type PaymentWebhookRpcRow = {
  event_id: string;
  provider_event_id: string;
  order_id: string;
  corporate_case_id: string;
  escrow_id: string;
  escrow_status: "HELD_IN_ESCROW";
  case_stage: "ESCROW_LOCKED";
  order_status: "ACTIVE";
  provider_event_status: "PROCESSED";
  funded_milestone_count: number;
  replayed: boolean;
};

export type PaymentWebhookDependencies = {
  getEnvironment(name: string): string | undefined;
  nowMs(): number;
  callRpc<T>(name: string, parameters: unknown): Promise<T>;
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
  const orderId = requireUuid(payload, "orderId").toLowerCase();
  const paymentGatewayRef = requireString(payload, "paymentGatewayRef", 64);
  if (paymentGatewayRef !== `CORP-${orderId}`) {
    throw new HttpError(
      400,
      "INVALID_FIELD",
      "Field paymentGatewayRef must match the canonical order reference.",
    );
  }
  return {
    providerEventId: requireString(payload, "providerEventId", 192),
    eventType: requireEnum(payload, "eventType", ["INVOICE_PAID"]),
    orderId,
    caseId: requireUuid(payload, "caseId").toLowerCase(),
    escrowId: requireUuid(payload, "escrowId").toLowerCase(),
    amountIdr: requireInteger(payload, "amountIdr", 1, 9_999_999_999_999),
    paymentGatewayRef,
  };
}

function requiredEnvironment(
  dependencies: PaymentWebhookDependencies,
  name: string,
  maxLength: number,
  trim = true,
): string {
  const configured = dependencies.getEnvironment(name);
  const value = trim ? configured?.trim() : configured;
  if (!value || value.length > maxLength) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Webhook server configuration is unavailable.");
  }
  return value;
}

function requireWebhookSecret(
  dependencies: PaymentWebhookDependencies,
): string {
  const secret = dependencies.getEnvironment("PAYMENT_WEBHOOK_SECRET");
  const byteLength = secret === undefined
    ? 0
    : new TextEncoder().encode(secret).byteLength;
  // This is a key-material length floor, not proof that the value has entropy.
  if (secret === undefined || byteLength < 32 || byteLength > 4096) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Webhook server configuration is unavailable.");
  }
  return secret;
}

function requireMaximumSkewSeconds(
  dependencies: PaymentWebhookDependencies,
): number {
  const configured = dependencies.getEnvironment("PAYMENT_WEBHOOK_MAX_SKEW_SECONDS");
  if (configured === undefined) return 300;
  if (!/^[1-9][0-9]{0,2}$/.test(configured)) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Webhook server configuration is unavailable.");
  }
  const seconds = Number(configured);
  if (seconds > 900) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Webhook server configuration is unavailable.");
  }
  return seconds;
}

async function requireSignature(
  request: Request,
  rawBody: Uint8Array,
  dependencies: PaymentWebhookDependencies,
): Promise<void> {
  const secret = requireWebhookSecret(dependencies);
  const maxSkewSeconds = requireMaximumSkewSeconds(dependencies);
  const valid = await verifyHmacSha256Bytes({
    body: rawBody,
    secret,
    signature: request.headers.get("x-webhook-signature") ?? "",
    timestamp: request.headers.get("x-webhook-timestamp") ?? "",
    nowMs: dependencies.nowMs(),
    maxSkewSeconds,
  });
  if (!valid) {
    throw new HttpError(401, "INVALID_SIGNATURE", "Webhook signature is invalid or stale.");
  }
}

async function readRawBody(request: Request, maxBytes = 64 * 1024): Promise<Uint8Array> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the accepted limit.");
  }
  const rawBody = new Uint8Array(await request.arrayBuffer());
  if (rawBody.byteLength > maxBytes) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the accepted limit.");
  }
  return rawBody;
}

function parseJson(rawBody: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBody));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

function requireExactResult(
  value: unknown,
  payload: PaymentPayload,
): PaymentWebhookRpcRow {
  if (!Array.isArray(value) || value.length !== 1) {
    throw new HttpError(502, "INVALID_SETTLEMENT_RESULT", "Settlement result was not canonical.");
  }
  const row = requireRecord(value[0]);
  if (
    Object.keys(row).length !== RESULT_KEYS.size
    || Object.keys(row).some((key) => !RESULT_KEYS.has(key))
  ) {
    throw new HttpError(502, "INVALID_SETTLEMENT_RESULT", "Settlement result was not canonical.");
  }

  let result: PaymentWebhookRpcRow;
  try {
    result = {
      event_id: requireUuid(row, "event_id").toLowerCase(),
      provider_event_id: requireString(row, "provider_event_id", 192),
      order_id: requireUuid(row, "order_id").toLowerCase(),
      corporate_case_id: requireUuid(row, "corporate_case_id").toLowerCase(),
      escrow_id: requireUuid(row, "escrow_id").toLowerCase(),
      escrow_status: requireEnum(row, "escrow_status", ["HELD_IN_ESCROW"]),
      case_stage: requireEnum(row, "case_stage", ["ESCROW_LOCKED"]),
      order_status: requireEnum(row, "order_status", ["ACTIVE"]),
      provider_event_status: requireEnum(row, "provider_event_status", ["PROCESSED"]),
      funded_milestone_count: row.funded_milestone_count as number,
      replayed: row.replayed as boolean,
    };
  } catch {
    throw new HttpError(502, "INVALID_SETTLEMENT_RESULT", "Settlement result was not canonical.");
  }

  if (
    !Number.isInteger(result.funded_milestone_count)
    || result.funded_milestone_count < 1
    || typeof result.replayed !== "boolean"
    || result.provider_event_id !== payload.providerEventId
    || result.order_id !== payload.orderId
    || result.corporate_case_id !== payload.caseId
    || result.escrow_id !== payload.escrowId
  ) {
    throw new HttpError(502, "INVALID_SETTLEMENT_RESULT", "Settlement result was not canonical.");
  }
  return result;
}

function mapRpcError(error: unknown): HttpError {
  if (error instanceof RestError) {
    const detail = JSON.stringify(error.details);
    if (
      error.status === 409
      || detail.includes("CORPORATE_PAYMENT_WEBHOOK_EVENT_CONFLICT")
      || detail.includes("CORPORATE_PAYMENT_WEBHOOK_IDEMPOTENCY_CONFLICT")
    ) {
      return new HttpError(409, "IDEMPOTENCY_CONFLICT", "Provider event conflicts with prior evidence.");
    }
  }
  return new HttpError(500, "SETTLEMENT_FAILED", "Payment settlement could not be completed.");
}

export function createPaymentWebhookHandler(
  dependencies: PaymentWebhookDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      requirePost(request);
      const rawBody = await readRawBody(request);
      await requireSignature(request, rawBody, dependencies);
      const providerName = requiredEnvironment(
        dependencies,
        "PAYMENT_PROVIDER_NAME",
        64,
      );
      const value = parseJson(rawBody);
      const payload = parsePayload(value);
      const digest = await sha256HexBytes(rawBody);
      const idempotencyKey = await deriveIdempotencyKey(
        "payment-webhook",
        `${providerName}:${payload.providerEventId}`,
      );

      let rawResult: unknown;
      try {
        rawResult = await dependencies.callRpc<unknown>(RPC_NAME, {
          p_provider_name: providerName,
          p_provider_event_id: payload.providerEventId,
          p_event_type: payload.eventType,
          p_raw_payload_sha256: digest,
          p_order_id: payload.orderId,
          p_case_id: payload.caseId,
          p_escrow_id: payload.escrowId,
          p_expected_amount_idr: payload.amountIdr,
          p_payment_gateway_ref: payload.paymentGatewayRef,
          p_idempotency_key: idempotencyKey,
        });
      } catch (error) {
        throw mapRpcError(error);
      }

      const result = requireExactResult(rawResult, payload);
      return jsonResponse({
        ok: true,
        eventId: result.event_id,
        replayed: result.replayed,
        status: result.escrow_status,
      });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

const environment = (name: string): string | undefined => Deno.env.get(name);

export const handle = createPaymentWebhookHandler({
  getEnvironment: environment,
  nowMs: () => Date.now(),
  callRpc,
});
