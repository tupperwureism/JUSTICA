import {
  createCorporateIntakeHandler,
  type CorporateIntakeDependencies,
} from "./handler.ts";
import { HttpError } from "../_shared/http.ts";
import { callRpc } from "../_shared/rest.ts";

function environment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "Intake service is unavailable.");
  }
  return value;
}

const handler = createCorporateIntakeHandler({
  verifyUser: async (request) => {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new HttpError(401, "INVALID_JWT", "A valid user session is required.");
    }
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!publishableKey) {
      throw new HttpError(500, "SERVER_MISCONFIGURED", "Auth service is unavailable.");
    }
    const response = await fetch(`${environment("SUPABASE_URL")}/auth/v1/user`, {
      headers: { apikey: publishableKey, authorization },
    });
    if (!response.ok) {
      throw new HttpError(401, "INVALID_JWT", "Invalid or expired JWT.");
    }
    const value = await response.json() as { id?: unknown };
    if (typeof value.id !== "string") {
      throw new HttpError(401, "INVALID_JWT", "Invalid auth response.");
    }
    return value.id;
  },
  callRpc: (name, parameters) => callRpc<unknown[]>(name, parameters),
} satisfies CorporateIntakeDependencies);

Deno.serve(handler);
