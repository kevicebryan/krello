-- Krello: tambah avatar_url + policy storage bucket `images`
-- Paste & Run di Supabase Dashboard → SQL Editor
-- Prasyarat: bucket public bernama `images` sudah dibuat di Storage

-- ---------------------------------------------------------------------------
-- profiles.avatar_url
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Public URL ke file di storage bucket images (folder avatars/{user_id}/)';

-- ---------------------------------------------------------------------------
-- Storage RLS untuk bucket `images`
-- Path yang diizinkan: avatars/{auth.uid()}/...
-- Public bucket = download publik OK; upload/update/delete tetap butuh policy.
-- Upsert butuh INSERT + SELECT + UPDATE.
-- ---------------------------------------------------------------------------

drop policy if exists "images_avatar_select_own" on storage.objects;
drop policy if exists "images_avatar_insert_own" on storage.objects;
drop policy if exists "images_avatar_update_own" on storage.objects;
drop policy if exists "images_avatar_delete_own" on storage.objects;

create policy "images_avatar_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  );

create policy "images_avatar_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  );

create policy "images_avatar_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  );

create policy "images_avatar_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  );
