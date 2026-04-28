import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE);
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action === "create") {
      const snapshot = body?.snapshot;
      if (!snapshot || typeof snapshot !== "object") {
        return new Response(JSON.stringify({ error: "snapshot object required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      let code = randomCode();
      for (let attempt = 0; attempt < 10; attempt++) {
        const { error } = await sb.from("game_handoffs").insert({
          code,
          payload: snapshot,
          expires_at: expiresAt,
        });
        if (!error) {
          return new Response(JSON.stringify({ code }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (error.code === "23505") {
          code = randomCode();
          continue;
        }
        console.error("handoff insert", error);
        return new Response(JSON.stringify({ error: "Could not store handoff" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Could not allocate code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "retrieve") {
      const raw = String(body?.code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      if (raw.length < 4) {
        return new Response(JSON.stringify({ error: "invalid code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await sb
        .from("game_handoffs")
        .select("payload, expires_at")
        .eq("code", raw)
        .maybeSingle();

      if (error) {
        console.error("handoff select", error);
        return new Response(JSON.stringify({ error: "lookup failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data) {
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const exp = new Date(data.expires_at as string).getTime();
      if (Date.now() > exp) {
        await sb.from("game_handoffs").delete().eq("code", raw);
        return new Response(JSON.stringify({ error: "expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ snapshot: data.payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("game-handoff error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
