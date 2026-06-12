-- Live danmaku on /play (anonymous send + public read + realtime)

create table public.play_danmaku (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(trim(message)) between 1 and 80),
  color text not null default 'pink' check (color in ('pink', 'yellow', 'cyan', 'violet', 'ink')),
  created_at timestamptz not null default now()
);

create index play_danmaku_created_at_idx on public.play_danmaku (created_at desc);

alter table public.play_danmaku enable row level security;

create policy "play_danmaku_select_all"
  on public.play_danmaku for select
  using (true);

create policy "play_danmaku_insert_anon"
  on public.play_danmaku for insert
  to anon, authenticated
  with check (char_length(trim(message)) between 1 and 80);

grant select, insert on public.play_danmaku to anon, authenticated;

alter publication supabase_realtime add table public.play_danmaku;
