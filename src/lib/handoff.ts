import { resizeDataUrl } from "@/lib/imageResize";
import { supabase } from "@/integrations/supabase/client";
import { messageFromFunctionsError } from "@/lib/edgeFunctionError";

/** Reduce photo size inside ai_game JSON before uploading handoff. */
export async function buildGameHandoffSnapshot(): Promise<Record<string, string>> {
  const raw = sessionStorage.getItem("ai_game");
  if (!raw) throw new Error("No game in session");
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (typeof o.photo === "string" && o.photo.startsWith("data:image") && o.photo.length > 120_000) {
      o.photo = await resizeDataUrl(o.photo, 960, 0.72);
    }
    return { ai_game: JSON.stringify(o) };
  } catch {
    return { ai_game: raw };
  }
}

export async function createHandoffCode(snapshot: Record<string, string>): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ code?: string; error?: string }>(
    "game-handoff",
    { body: { action: "create", snapshot } },
  );
  if (error) throw new Error(await messageFromFunctionsError(error));
  if (data?.error || !data?.code) throw new Error(data?.error || "handoff failed");
  return data.code;
}

export async function retrieveHandoffSnapshot(code: string): Promise<Record<string, string>> {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const { data, error } = await supabase.functions.invoke<{
    snapshot?: Record<string, string>;
    error?: string;
  }>("game-handoff", { body: { action: "retrieve", code: cleaned } });
  if (error) throw new Error(await messageFromFunctionsError(error));
  if (data?.error) throw new Error(data.error);
  const snap = data?.snapshot;
  if (!snap || typeof snap !== "object") throw new Error("empty snapshot");
  return snap as Record<string, string>;
}

export function applySnapshotToSession(snapshot: Record<string, string>) {
  for (const [k, v] of Object.entries(snapshot)) {
    if (typeof v === "string") sessionStorage.setItem(k, v);
  }
}
