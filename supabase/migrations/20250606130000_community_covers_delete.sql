-- Allow owners to remove their community game cover images

create policy "community_covers_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'community-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
