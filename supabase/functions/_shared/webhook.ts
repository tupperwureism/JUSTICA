import { verifyHmacSha256 } from "./crypto.ts";
import { HttpError } from "./http.ts";

export async function requireValidWebhookSignature(options: {
  request: Request;
  rawBody: string;
  secretEnvironmentName: string;
  maxSkewEnvironmentName: string;
}): Promise<void> {
  const secret = Deno.env.get(options.secretEnvironmentName);
  if (!secret) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Webhook secret is unavailable.");
  }

  const signature = options.request.headers.get("x-webhook-signature") ?? "";
  const timestamp = options.request.headers.get("x-webhook-timestamp") ?? "";
  const configuredSkew = Number(Deno.env.get(options.maxSkewEnvironmentName) ?? "300");
  const maxSkewSeconds = Number.isInteger(configuredSkew) && configuredSkew > 0
    ? configuredSkew
    : 300;

  const valid = await verifyHmacSha256({
    body: options.rawBody,
    secret,
    signature,
    timestamp,
    maxSkewSeconds,
  });
  if (!valid) {
    throw new HttpError(401, "INVALID_SIGNATURE", "Webhook signature is invalid or stale.");
  }
}
