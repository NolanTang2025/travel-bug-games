alter table public.slack_connections
  add column if not exists bot_access_token text,
  add column if not exists bot_user_id text;
