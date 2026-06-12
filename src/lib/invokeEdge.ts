import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

type EdgeErrorBody = { error?: string; message?: string };

/** Invoke a Supabase Edge Function and surface `{ error }` from non-2xx bodies. */
export async function invokeEdge<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Please sign in again to use AI features");
  }

  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    throw new Error(await resolveInvokeError(error, data as EdgeErrorBody | null));
  }

  const bodyError = (data as EdgeErrorBody | null)?.error;
  if (bodyError) throw new Error(bodyError);

  return data as T;
}

async function resolveInvokeError(
  error: Error,
  data: EdgeErrorBody | null,
): Promise<string> {
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const payload = (await error.context.clone().json()) as EdgeErrorBody;
      if (payload.error) return payload.error;
      if (payload.message) return payload.message;
    } catch {
      try {
        const text = await error.context.clone().text();
        if (text.trim()) return text.slice(0, 280);
      } catch { /* ignore */ }
    }
  }

  if (error instanceof FunctionsRelayError) {
    return "Edge Function relay error — try again in a moment";
  }

  if (error.message && !error.message.includes("non-2xx")) {
    return error.message;
  }

  return "Edge Function request failed";
}
