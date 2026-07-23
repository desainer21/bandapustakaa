-- Jalankan sekali di Supabase SQL Editor agar admin dari dashboard dapat upload file produk.
create policy "admin manages digital files" on storage.objects for all to authenticated using (
  bucket_id = 'digital-files' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
) with check (bucket_id = 'digital-files' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
