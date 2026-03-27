-- ─────────────────────────────────────────────────────────────────────────────
-- 011: Supabase Storage 버킷 생성
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 버킷 생성 ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('building-images', 'building-images', true, 10485760,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('room-images',     'room-images',     true, 10485760,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;

-- ── RLS: 공개 읽기 ────────────────────────────────────────────────────────────
-- public=true 버킷이면 CDN URL로 누구나 읽을 수 있지만 정책도 명시
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public_read_building_images'
  ) then
    execute $p$
      create policy "public_read_building_images" on storage.objects
        for select using (bucket_id = 'building-images')
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public_read_room_images'
  ) then
    execute $p$
      create policy "public_read_room_images" on storage.objects
        for select using (bucket_id = 'room-images')
    $p$;
  end if;
end;
$$;
