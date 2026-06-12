import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/invokeEdge";

export type TwinPersona = {
  id: string;
  user_id: string;
  archive_id: string;
  display_name: string;
  bio_short: string | null;
  system_prompt: string;
  traits_json: {
    tone?: string;
    languages?: string[];
    interests?: string[];
    sample_phrases?: string[];
    avoid?: string[];
  };
  is_active: boolean;
  created_at: string;
};

function asText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((v) => asText(v)).filter((v): v is string => !!v);
  return list.length ? list : undefined;
}

/** Coerce DB / AI shapes so React never receives invalid children. */
export function normalizeTwinPersona(row: Record<string, unknown>): TwinPersona {
  const rawTraits = row.traits_json;
  let traits: TwinPersona["traits_json"] = {};
  if (rawTraits && typeof rawTraits === "object" && !Array.isArray(rawTraits)) {
    const t = rawTraits as Record<string, unknown>;
    traits = {
      tone: asText(t.tone),
      languages: asStringList(t.languages),
      interests: asStringList(t.interests),
      sample_phrases: asStringList(t.sample_phrases),
      avoid: asStringList(t.avoid),
    };
  }

  return {
    id: String(row.id ?? ""),
    user_id: String(row.user_id ?? ""),
    archive_id: String(row.archive_id ?? ""),
    display_name: asText(row.display_name) ?? "Your twin",
    bio_short: asText(row.bio_short) ?? null,
    system_prompt: asText(row.system_prompt) ?? "",
    traits_json: traits,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at ?? ""),
  };
}

export type SlackConnection = {
  id: string;
  team_id: string;
  team_name: string | null;
  slack_user_id: string;
  connected_at: string;
};

export type SlackDraft = {
  id: string;
  persona_id: string | null;
  team_id: string;
  channel_id: string;
  thread_ts: string | null;
  trigger_text: string;
  draft_text: string;
  status: "pending" | "approved" | "sent" | "dismissed";
  slack_message_ts: string | null;
  created_at: string;
  updated_at: string;
};

export async function generateTwin(archiveId: string): Promise<{ personaId: string }> {
  const data = await invokeEdge<{ personaId: string }>("generate-twin", { archiveId });
  return { personaId: data.personaId };
}

export async function fetchActivePersona(): Promise<TwinPersona | null> {
  const { data, error } = await supabase
    .from("twin_personas")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return normalizeTwinPersona(row as Record<string, unknown>);
}

export async function fetchSlackConnection(): Promise<SlackConnection | null> {
  const { data, error } = await supabase
    .from("slack_connections_safe")
    .select("id, team_id, team_name, slack_user_id, connected_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as SlackConnection | null;
}

export function getSlackOAuthUrl(userId: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const state = btoa(userId);
  return `${base}/functions/v1/slack-oauth?action=authorize&state=${encodeURIComponent(state)}`;
}

export async function fetchPendingDrafts(): Promise<SlackDraft[]> {
  const { data, error } = await supabase
    .from("slack_drafts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SlackDraft[];
}

export async function fetchDraft(id: string): Promise<SlackDraft | null> {
  const { data, error } = await supabase
    .from("slack_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as SlackDraft | null;
}

export async function sendDraft(draftId: string, draftText: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("slack-send-draft", {
    body: { draftId, draftText, action: "send" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

export async function dismissDraft(draftId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("slack-send-draft", {
    body: { draftId, action: "dismiss" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
