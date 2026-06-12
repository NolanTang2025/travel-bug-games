-- Public sprites for AI-generated game assets (no PII — stylized stickers only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'game-assets',
  'game-assets',
  true,
  2097152,
  array['image/png', 'image/webp', 'image/jpeg']
)
on conflict (id) do nothing;

create policy "game_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'game-assets');

create policy "game_assets_service_insert"
  on storage.objects for insert
  with check (bucket_id = 'game-assets');
