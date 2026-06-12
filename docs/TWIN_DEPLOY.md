# Twin archive → Slack deploy checklist

## 1. Supabase

1. Run migration: `supabase db push` or apply `supabase/migrations/20250603120000_twin_archive.sql` in Dashboard SQL editor.
2. Confirm bucket `archive-media` exists (migration creates it).
3. Auth: enable **Email** (magic link) and **Google** in Authentication → Providers.
4. Set redirect URLs: `https://mnemo.games/login`, `http://localhost:8080/login` (dev).

### Edge secrets

| Secret | Purpose |
|--------|---------|
| `LOVABLE_API_KEY` | AI archive / twin / drafts |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role in functions |
| `SUPABASE_ANON_KEY` | JWT validation in functions |
| `SITE_URL` | `https://mnemo.games` |
| `SLACK_CLIENT_ID` | OAuth |
| `SLACK_CLIENT_SECRET` | OAuth |
| `SLACK_SIGNING_SECRET` | Events API |
| `SLACK_REDIRECT_URI` | `https://<project>.supabase.co/functions/v1/slack-oauth` |

Deploy functions:

```bash
supabase functions deploy generate-archive
supabase functions deploy generate-twin
supabase functions deploy slack-oauth
supabase functions deploy slack-events
supabase functions deploy slack-draft-reply
supabase functions deploy slack-send-draft
```

## 2. Slack App

1. Create app at https://api.slack.com/apps
2. **OAuth & Permissions** — User token scopes: `chat:write`, `channels:history`, `groups:history`, `im:history`, `users:read`, `app_mentions:read`
3. Redirect URL: your `slack-oauth` function URL
4. **Event Subscriptions** — Request URL: `https://<project>.supabase.co/functions/v1/slack-events`
   - Subscribe: `app_mention`, `message.im`
5. Install to workspace for testing

## 3. Vercel

Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

```bash
vercel --prod
```

## 4. E2E test

1. Sign in at `/login`
2. `/archive/new` — upload 2 photos + journal → generate archive
3. `/archive/:id` — create digital twin
4. `/twin` — Connect Slack
5. @mention app or DM → draft appears on `/twin`
6. `/twin/drafts/:id` — edit → Send
