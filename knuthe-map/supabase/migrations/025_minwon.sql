-- ─────────────────────────────────────────────────────────────────────────────
-- 025: 민원 대신 처리 (minwons) — 사용자가 건물 관련 민원을 접수하면
--      관리자가 처리해주는 별도 채널. /minwon 페이지에서 사용.
--
--  - 핵심 입력: 민원 본문 텍스트, 사진(스토리지 URL), 건물 주소, 건물주 연락처
--  - 접수 시점 사용자 정보 스냅샷: 학교 / 학과 / 학번 / 나이 / 연락처
--    · 본 minwons 행에 직접 저장한다. 추후 users 테이블이 바뀌어도
--      접수 당시 정보가 유지되도록.
--  - 답변은 문자로 발송 (별도 외부 SMS 게이트웨이 — 이 마이그레이션 범위 밖)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.minwons (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.users(id) on delete cascade,

  -- 민원 본문
  complaint_text    text        not null check (char_length(complaint_text) >= 5),
  image_url         text,                  -- minwon-images 버킷의 publicUrl
  building_address  text        not null,
  building_phone    text        not null,

  -- 접수 시점 사용자 정보 스냅샷
  user_school       text        not null,
  user_dept         text        not null,
  user_grade        text        not null, -- 학번 (e.g. '21학번')
  user_age          int         not null check (user_age between 1 and 120),
  user_phone        text        not null,

  -- 처리 상태
  status            text        not null default 'pending'
                                check (status in ('pending', 'in_progress', 'resolved', 'rejected')),
  admin_note        text,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_minwons_user_id    on minwons (user_id);
create index if not exists idx_minwons_status     on minwons (status);
create index if not exists idx_minwons_created_at on minwons (created_at desc);

create trigger minwons_updated_at
  before update on minwons
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.minwons enable row level security;

-- 본인 민원 조회 가능
create policy "minwons_select_own" on public.minwons
  for select using (auth.uid() = user_id);

-- 인증된 사용자만 본인 명의로 접수 가능
create policy "minwons_insert_own" on public.minwons
  for insert with check (auth.uid() = user_id);

-- 관리자는 전체 조회·수정 가능
-- (admin role 검증은 public.users.role 기준)
create policy "minwons_admin_select" on public.minwons
  for select using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "minwons_admin_update" on public.minwons
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- ── 스토리지 버킷 ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('minwon-images', 'minwon-images', true, 10485760,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public_read_minwon_images'
  ) then
    execute $p$
      create policy "public_read_minwon_images" on storage.objects
        for select using (bucket_id = 'minwon-images')
    $p$;
  end if;
end;
$$;
