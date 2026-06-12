import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

export function userClient(authHeader: string) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
}

import { corsHeaders } from "./cors.ts";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: unauthorized() };
  }
  const supabase = userClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: unauthorized() };
  }
  return { user, supabase, authHeader };
}
