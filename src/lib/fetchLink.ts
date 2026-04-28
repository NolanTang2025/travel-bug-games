import { supabase } from "@/integrations/supabase/client";
import { messageFromFunctionsError } from "@/lib/edgeFunctionError";

export type FetchLinkOk =
  | { ok: true; kind: "image"; dataUrl: string; bytes: number }
  | {
      ok: true;
      kind: "page";
      url: string;
      title?: string;
      description?: string;
      imageUrls: string[];
      imageDataUrl?: string;
      imageBytes?: number;
      warning?: string;
      ownerUsername?: string;
      ownerComments?: string[];
    };

export type FetchLinkResponse = FetchLinkOk | { ok: false; error: string };

/** Server-side fetch of a direct image or HTML page preview (Open Graph). */
export async function fetchLinkPreview(url: string, opts?: { cookie?: string | null }): Promise<FetchLinkOk> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL is empty");

  const { data, error } = await supabase.functions.invoke<FetchLinkResponse>("fetch-link", {
    body: { url: trimmed, cookie: opts?.cookie ?? null },
  });

  if (error) throw new Error(await messageFromFunctionsError(error));
  if (!data) throw new Error("Empty response");
  if (!data.ok) throw new Error("error" in data && data.error ? data.error : "Request failed");

  return data;
}
