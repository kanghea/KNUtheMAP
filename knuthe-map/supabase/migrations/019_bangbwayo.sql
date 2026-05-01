-- ─────────────────────────────────────────────────────────────────────────────
-- 019: 방봐요 (bangbwayo) — 방 보러 갈 때 함께 가는 도구
--
-- 모델:
--   세트(투어) ⊃ 트랙(방 한 개) ⊃ 응답(체크리스트 항목) + 사진
--
-- 원칙:
--   · 표준 체크리스트 (`lib/bangbwayo-checklist.ts` 의 키 참조)
--   · 항목당 한 카드 — 카드 안에서 사진·평가·메모가 한 번에 채워짐
--   · 자동 좌표 매칭 (사진 EXIF) + 호수 수동 입력
--   · 사용자 데이터는 본인만 — RLS + 비공개 Storage
--   · 동의 흐름은 별도 사이클 — 컬럼 자리만 NULL 로 미리 마련
--   · `bangbwayo_results` 테이블 ❌ → `sets.result_generated_at` 컬럼으로 표현
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. bangbwayo_sets — 투어
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.bangbwayo_sets (
  id                       uuid        primary key default gen_random_uuid(),
  user_id                  uuid        not null references public.users(id) on delete cascade,

  -- 사용자가 자유롭게 적는 셋 제목 (NULL 이면 시작 일자로 표시)
  title                    text,

  -- 라이프사이클: active(작성 중) → ended(다 봤어요/잠시 멈춤) → results_generated
  status                   text        not null default 'active'
                                       check (status in ('active','ended','results_generated')),

  started_at               timestamptz not null default now(),
  ended_at                 timestamptz,

  -- 결과물 생성 시각 — `results` 테이블 대신 컬럼으로 표현
  result_generated_at      timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_bangbwayo_sets_user_status
  on public.bangbwayo_sets (user_id, status);

-- 사용자당 active 셋 1개만 — 부분 unique 인덱스
create unique index if not exists uq_bangbwayo_sets_one_active
  on public.bangbwayo_sets (user_id) where status = 'active';

create trigger bangbwayo_sets_updated_at
  before update on public.bangbwayo_sets
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. bangbwayo_tracks — 방 한 개
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.bangbwayo_tracks (
  id                         uuid        primary key default gen_random_uuid(),
  set_id                     uuid        not null references public.bangbwayo_sets(id) on delete cascade,
  order_index                int         not null default 0,   -- 셋 안에서의 순서

  -- 방의 정체
  building_id                uuid        references public.buildings(id) on delete set null,
  building_address_text      text,                              -- 자동 매칭 실패 시 수동 주소
  unit_number                text,                              -- 호수 — 항상 사용자 입력

  -- 시간 옵션 — MVP 는 '5min' 만, 다음 사이클에서 확장
  time_option                text        not null default '5min'
                                         check (time_option in ('5min','15min','30min')),

  -- 계약 조건 (만원 단위)
  deposit                    int,
  monthly_rent               int,
  maintenance                int,
  floor                      int,
  contract_type              text        check (contract_type in ('월세','전세','매매')),

  -- 트랙 종합 인상 (선택)
  overall_rating             int         check (overall_rating between 1 and 5),
  overall_memo               text,

  -- 라이프사이클
  status                     text        not null default 'draft'
                                         check (status in ('draft','saved','closed','included')),

  visited_at                 timestamptz not null default now(),

  -- 동의 컬럼 자리 — 별도 사이클에서 사용. 지금은 항상 NULL.
  public_share_consent_at    timestamptz,
  public_share_version       text,
  public_share_revoked_at    timestamptz,

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists idx_bangbwayo_tracks_set_id
  on public.bangbwayo_tracks (set_id);
create index if not exists idx_bangbwayo_tracks_building_id
  on public.bangbwayo_tracks (building_id) where building_id is not null;

create trigger bangbwayo_tracks_updated_at
  before update on public.bangbwayo_tracks
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. bangbwayo_responses — 카드 응답 (한 항목당 한 행)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.bangbwayo_responses (
  id                  uuid        primary key default gen_random_uuid(),
  track_id            uuid        not null references public.bangbwayo_tracks(id) on delete cascade,

  -- 마스터 데이터(`lib/bangbwayo-checklist.ts`)의 항목 키
  checklist_item_key  text        not null,

  -- 4단 척도 — 표준화된 비교를 위한 통일 형식
  rating              text        check (rating in ('good','fair','bad','unknown')),

  memo                text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (track_id, checklist_item_key)
);

create index if not exists idx_bangbwayo_responses_track_id
  on public.bangbwayo_responses (track_id);

create trigger bangbwayo_responses_updated_at
  before update on public.bangbwayo_responses
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. bangbwayo_photos — 사진 메타 (바이너리는 Storage)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.bangbwayo_photos (
  id                   uuid        primary key default gen_random_uuid(),
  track_id             uuid        not null references public.bangbwayo_tracks(id) on delete cascade,

  -- 어떤 항목과 연결된 사진인지 (NULL 가능 — 항목 없는 자유 사진)
  checklist_item_key   text,

  -- Storage path: 'bangbwayo-photos' 버킷 내 '{track_id}/{uuid}.{ext}'
  --   풀 URL ❌ — 비공개 버킷이라 매번 signed URL 생성
  storage_path         text        not null,

  -- 미래의 PII 마스킹된 사본 path 자리 (얼굴·번호판 블러). 지금은 NULL.
  masked_storage_path  text,

  -- EXIF 메타 — 좌표 자동 매칭 + 시간성 분석에 사용
  exif_lat             double precision,
  exif_lng             double precision,
  exif_taken_at        timestamptz,

  width                int,
  height               int,
  bytes                int,

  created_at           timestamptz not null default now()
);

create index if not exists idx_bangbwayo_photos_track_id
  on public.bangbwayo_photos (track_id);
create index if not exists idx_bangbwayo_photos_track_item
  on public.bangbwayo_photos (track_id, checklist_item_key)
  where checklist_item_key is not null;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RLS — 본인 데이터만
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.bangbwayo_sets      enable row level security;
alter table public.bangbwayo_tracks    enable row level security;
alter table public.bangbwayo_responses enable row level security;
alter table public.bangbwayo_photos    enable row level security;

-- sets: 본인만
create policy "bs_select_own" on public.bangbwayo_sets
  for select using (auth.uid() = user_id);
create policy "bs_insert_own" on public.bangbwayo_sets
  for insert with check (auth.uid() = user_id);
create policy "bs_update_own" on public.bangbwayo_sets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bs_delete_own" on public.bangbwayo_sets
  for delete using (auth.uid() = user_id);

-- tracks: 자신의 set 하위만
create policy "bt_select_own" on public.bangbwayo_tracks
  for select using (
    exists (select 1 from public.bangbwayo_sets s
            where s.id = bangbwayo_tracks.set_id and s.user_id = auth.uid())
  );
create policy "bt_insert_own" on public.bangbwayo_tracks
  for insert with check (
    exists (select 1 from public.bangbwayo_sets s
            where s.id = set_id and s.user_id = auth.uid())
  );
create policy "bt_update_own" on public.bangbwayo_tracks
  for update using (
    exists (select 1 from public.bangbwayo_sets s
            where s.id = bangbwayo_tracks.set_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.bangbwayo_sets s
            where s.id = set_id and s.user_id = auth.uid())
  );
create policy "bt_delete_own" on public.bangbwayo_tracks
  for delete using (
    exists (select 1 from public.bangbwayo_sets s
            where s.id = bangbwayo_tracks.set_id and s.user_id = auth.uid())
  );

-- responses: 자신의 track 하위만
create policy "br_select_own" on public.bangbwayo_responses
  for select using (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = bangbwayo_responses.track_id and s.user_id = auth.uid())
  );
create policy "br_insert_own" on public.bangbwayo_responses
  for insert with check (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = track_id and s.user_id = auth.uid())
  );
create policy "br_update_own" on public.bangbwayo_responses
  for update using (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = bangbwayo_responses.track_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = track_id and s.user_id = auth.uid())
  );
create policy "br_delete_own" on public.bangbwayo_responses
  for delete using (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = bangbwayo_responses.track_id and s.user_id = auth.uid())
  );

-- photos: 자신의 track 하위만
create policy "bp_select_own" on public.bangbwayo_photos
  for select using (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = bangbwayo_photos.track_id and s.user_id = auth.uid())
  );
create policy "bp_insert_own" on public.bangbwayo_photos
  for insert with check (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = track_id and s.user_id = auth.uid())
  );
create policy "bp_delete_own" on public.bangbwayo_photos
  for delete using (
    exists (select 1 from public.bangbwayo_tracks t
              join public.bangbwayo_sets s on s.id = t.set_id
            where t.id = bangbwayo_photos.track_id and s.user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Storage 버킷 — 비공개 (signed URL 만 사용)
-- ═══════════════════════════════════════════════════════════════════════════
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'bangbwayo-photos', 'bangbwayo-photos',
    false,                                       -- 비공개 — public URL ❌
    10485760,                                    -- 10MB
    array['image/jpeg','image/png','image/webp','image/heic']
  )
  on conflict (id) do nothing;
end $$;

-- 비공개 버킷이므로 일반 select 정책 ❌.
-- 모든 read/write 는 service role(API Route) 에서만 수행 → signed URL 발급.
-- anon/authenticated 는 storage.objects 에 직접 접근 불가.
