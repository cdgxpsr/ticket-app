-- Photos on community posts: public bucket, each user writes only under <uid>/.
alter table public.board_posts add column if not exists images text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy post_images_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_images_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
