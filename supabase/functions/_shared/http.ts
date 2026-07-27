export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function readJsonBody(request: Request, maxBytes = 64 * 1024): Promise<{
  rawBody: string;
  value: unknown;
}> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the accepted limit.");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the accepted limit.");
  }

  try {
    return { rawBody, value: JSON.parse(rawBody) };
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ ok: false, code: error.code, message: error.message }, error.status);
  }
  console.error("Edge function failure", error instanceof Error ? error.message : "unknown");
  return jsonResponse(
    { ok: false, code: "INTERNAL_ERROR", message: "The request could not be processed." },
    500,
  );
}

export function requirePost(request: Request): void {
  if (request.method !== "POST") {
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Only POST is accepted.");
  }
}
