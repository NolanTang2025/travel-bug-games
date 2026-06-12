-- Prevent clients from reading Slack access tokens via PostgREST

drop policy if exists "slack_connections_all_own" on public.slack_connections;

create policy "slack_connections_insert_own" on public.slack_connections
  for insert with check (auth.uid() = user_id);

create policy "slack_connections_update_own" on public.slack_connections
  for update using (auth.uid() = user_id);

create policy "slack_connections_delete_own" on public.slack_connections
  for delete using (auth.uid() = user_id);

-- No direct SELECT for authenticated users on base table (tokens stay server-side)

create or replace view public.slack_connections_safe
with (security_invoker = true)
as
  select id, user_id, team_id, team_name, slack_user_id, scopes, connected_at
  from public.slack_connections
  where user_id = auth.uid();

grant select on public.slack_connections_safe to authenticated;
