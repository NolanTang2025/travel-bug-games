import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

const SCOPES = [
  "channels:history",
  "groups:history",
  "im:history",
  "chat:write",
  "users:read",
  "app_mentions:read",
].join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:8081";
  const clientId = Deno.env.get("SLACK_CLIENT_ID");
  const clientSecret = Deno.env.get("SLACK_CLIENT_SECRET");
  const redirectUri = Deno.env.get("SLACK_REDIRECT_URI") ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/slack-oauth`;

  if (!clientId || !clientSecret) {
    return new Response("Slack not configured", { status: 500 });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const action = url.searchParams.get("action");

  if (action === "authorize" && state) {
    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("user_scope", SCOPES);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    return Response.redirect(authUrl.toString(), 302);
  }

  if (!code || !state) {
    return new Response(JSON.stringify({ error: "Missing code or state" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let userId: string;
  try {
    userId = atob(state);
  } catch {
    return Response.redirect(`${siteUrl}/twin?slack=error`, 302);
  }

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.ok) {
    console.error("Slack OAuth error", tokenData);
    return Response.redirect(`${siteUrl}/twin?slack=error`, 302);
  }

  const userAccessToken = tokenData.authed_user?.access_token as string | undefined;
  const slackUserId = tokenData.authed_user?.id as string | undefined;
  const botAccessToken = tokenData.access_token as string | undefined;
  const botUserId = tokenData.bot_user_id as string | undefined;
  const teamId = tokenData.team?.id;
  const teamName = tokenData.team?.name;

  if (!userAccessToken || !slackUserId || !teamId || !botAccessToken) {
    console.error("Slack OAuth missing token fields", {
      hasUser: Boolean(userAccessToken),
      hasBot: Boolean(botAccessToken),
      hasSlackUser: Boolean(slackUserId),
    });
    return Response.redirect(`${siteUrl}/twin?slack=error`, 302);
  }

  const admin = serviceClient();
  await admin.from("slack_connections").upsert(
    {
      user_id: userId,
      team_id: teamId,
      team_name: teamName,
      slack_user_id: slackUserId,
      access_token: userAccessToken,
      bot_access_token: botAccessToken,
      bot_user_id: botUserId ?? null,
      scopes: SCOPES,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,team_id" },
  );

  return Response.redirect(`${siteUrl}/twin?slack=connected`, 302);
});
