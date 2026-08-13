import { handle } from "./handler.ts";
import { errorResponse } from "../_shared/http.ts";

Deno.serve(async (request) => {
  try {
    return await handle(request);
  } catch (error) {
    return errorResponse(error);
  }
});
