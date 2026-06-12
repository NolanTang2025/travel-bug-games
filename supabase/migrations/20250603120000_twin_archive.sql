-- Twin archive + persona + Slack draft loop

create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Travel archives
create table public.user_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  journal_text text not null default '',
  summary_json jsonb,
  status text not null default 'draft' check (status in ('draft', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_archives_user_id_idx on public.user_archives (user_id);

alter table public.user_archives enable row level security;

create policy "archives_all_own" on public.user_archives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Archive media
create table public.archive_media (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.user_archives (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  caption text,
  created_at timestamptz not null default now()
);

create index archive_media_archive_id_idx on public.archive_media (archive_id);

alter table public.archive_media enable row level security;

create policy "archive_media_all_own" on public.archive_media
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Twin personas
create table public.twin_personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  archive_id uuid not null references public.user_archives (id) on delete cascade,
  display_name text not null,
  bio_short text,
  system_prompt text not null,
  traits_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index twin_personas_user_id_idx on public.twin_personas (user_id);

alter table public.twin_personas enable row level security;

create policy "personas_all_own" on public.twin_personas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Slack connections
create table public.slack_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id text not null,
  team_name text,
  slack_user_id text not null,
  access_token text not null,
  scopes text,
  connected_at timestamptz not null default now(),
  unique (user_id, team_id)
);

alter table public.slack_connections enable row level security;

create policy "slack_connections_all_own" on public.slack_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Slack drafts
create table public.slack_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  persona_id uuid references public.twin_personas (id) on delete set null,
  team_id text not null,
  channel_id text not null,
  thread_ts text,
  trigger_text text not null default '',
  draft_text text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'sent', 'dismissed')),
  slack_message_ts text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index slack_drafts_user_status_idx on public.slack_drafts (user_id, status);

alter table public.slack_drafts enable row level security;

create policy "slack_drafts_all_own" on public.slack_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'archive-media',
  'archive-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "archive_media_storage_select"
on storage.objects for select to authenticated
using (bucket_id = 'archive-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "archive_media_storage_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'archive-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "archive_media_storage_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'archive-media' and (storage.foldername(name))[1] = auth.uid()::text);
