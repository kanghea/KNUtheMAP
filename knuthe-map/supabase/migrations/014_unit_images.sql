-- 014: building_units 이미지 + 대표 이미지 인덱스 추가

alter table public.building_units
  add column if not exists images         jsonb not null default '[]'::jsonb,
  add column if not exists main_image_idx int   not null default 0;

-- unit-images Storage 버킷 (owner/agent 업로드용)
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'unit-images', 'unit-images', true,
    10485760,
    array['image/jpeg','image/png','image/webp']
  )
  on conflict (id) do nothing;
end $$;

-- 공개 읽기 정책
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'unit-images public read'
  ) then
    execute $policy$
      create policy "unit-images public read"
        on storage.objects for select
        using (bucket_id = 'unit-images')
    $policy$;
  end if;
end $$;
