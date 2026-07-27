import { HttpError } from "./http.ts";

export class RestError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(
    status: number,
    details: unknown,
  ) {
    super(`Supabase REST request failed with status ${status}`);
    this.status = status;
    this.details = details;
  }
}

function adminHeaders(extra: Record<string, string> = {}): Headers {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Service role key is unavailable.");
  }
  return new Headers({
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    ...extra,
  });
}

function baseUrl(): string {
  const value = Deno.env.get("SUPABASE_URL");
  if (!value) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Supabase URL is unavailable.");
  }
  return value.replace(/\/+$/, "");
}

async function decode(response: Response): Promise<unknown> {
  const text = await response.text();
  const value = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new RestError(response.status, value);
  }
  return value;
}

export async function selectRows<T>(
  table: string,
  query: URLSearchParams,
): Promise<T[]> {
  const response = await fetch(`${baseUrl()}/rest/v1/${table}?${query}`, {
    headers: adminHeaders(),
  });
  return (await decode(response)) as T[];
}

export async function insertRow<T>(table: string, value: unknown): Promise<T> {
  const response = await fetch(`${baseUrl()}/rest/v1/${table}`, {
    method: "POST",
    headers: adminHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(value),
  });
  const rows = (await decode(response)) as T[];
  if (rows.length !== 1) {
    throw new RestError(500, { message: "Expected exactly one inserted row." });
  }
  return rows[0];
}

export async function updateRows(
  table: string,
  query: URLSearchParams,
  value: unknown,
): Promise<void> {
  const response = await fetch(`${baseUrl()}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify(value),
  });
  await decode(response);
}

export async function callRpc<T>(name: string, parameters: unknown): Promise<T> {
  const response = await fetch(`${baseUrl()}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(parameters),
  });
  return (await decode(response)) as T;
}

export function eq(value: string): string {
  return `eq.${value}`;
}
