-- Public community games wall (upvoted picks)

create table public.community_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  archive_id uuid references public.user_archives (id) on delete set null,
  title text not null,
  author_name text,
  tagline text,
  template_id text,
  engine text,
  spec jsonb not null default '{}',
  cover_path text,
  upvote_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index community_games_rank_idx on public.community_games (upvote_count desc, created_at desc);
create index community_games_user_idx on public.community_games (user_id);

alter table public.community_games enable row level security;

create policy "community_games_select_all"
  on public.community_games for select
  using (true);

create policy "community_games_insert_own"
  on public.community_games for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "community_games_delete_own"
  on public.community_games for delete
  to authenticated
  using (auth.uid() = user_id);

create table public.community_game_upvotes (
  game_id uuid not null references public.community_games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

alter table public.community_game_upvotes enable row level security;

create policy "community_upvotes_select_all"
  on public.community_game_upvotes for select
  using (true);

create policy "community_upvotes_insert_own"
  on public.community_game_upvotes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "community_upvotes_delete_own"
  on public.community_game_upvotes for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.sync_community_game_upvote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  gid := coalesce(new.game_id, old.game_id);
  update public.community_games
  set upvote_count = (
    select count(*)::integer from public.community_game_upvotes where game_id = gid
  )
  where id = gid;
  return coalesce(new, old);
end;
$$;

create trigger community_game_upvotes_sync_insert
  after insert on public.community_game_upvotes
  for each row execute function public.sync_community_game_upvote_count();

create trigger community_game_upvotes_sync_delete
  after delete on public.community_game_upvotes
  for each row execute function public.sync_community_game_upvote_count();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-covers',
  'community-covers',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "community_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'community-covers');

create policy "community_covers_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

grant select on public.community_games to anon, authenticated;
grant insert, delete on public.community_games to authenticated;
grant select, insert, delete on public.community_game_upvotes to authenticated;
