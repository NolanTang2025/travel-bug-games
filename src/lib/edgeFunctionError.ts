import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Edge Functions that return HTTP 4xx/5xx with JSON `{ error: string }` do not populate `invoke()`'s `data`;
 * the body lives on FunctionsHttpError.context (Response).
 */
export async function messageFromFunctionsError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.clone().json()) as { error?: string };
      if (typeof body?.error === "string" && body.error.trim()) return body.error.trim();
    } catch {
      // ignore parse errors
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Request failed";
}
