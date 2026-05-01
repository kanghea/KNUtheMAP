-- ─────────────────────────────────────────────────────────────────────────────
-- 018: saved_filters — 사용자별 방 검색 필터 + 새 매물 알림 ON/OFF
--
-- 지금은 클라이언트 localStorage('knu_map_filters')에만 살던 MapFilters 를
-- DB로 옮겨 디바이스 간 동기화 + 향후 알림 기능의 매칭 인덱스로 재사용한다.
--
-- 한 사용자당 1행만 유지(user_id PK). 추후 "조건 N개 저장"이 필요해지면
-- id 컬럼을 추가하고 PK 재설계.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.saved_filters (
  user_id     uuid        primary key references public.users(id) on delete cascade,

  -- MapFilters 전체 JSON. 키:
  --   buildingType:  string|null
  --   rentRange:     [number, number]
  --   depositRange:  [number, number]
  --   ageRange:      [number, number]
  --   options:       string[]
  --   gate:          string|null
  --   gateMinutes:   number|null
  filters     jsonb       not null default '{}'::jsonb,

  -- "새 매물 알림" 토글. true = 조건에 맞는 매물 등록 시 알림 발송 대상.
  -- 알림 디스패처(다음 PR)는 notify=true 인 행만 매칭에 사용한다.
  notify      boolean     not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger saved_filters_updated_at
  before update on public.saved_filters
  for each row execute function set_updated_at();

-- notify=true 만 빠르게 스캔하기 위한 부분 인덱스
create index if not exists idx_saved_filters_notify_on
  on public.saved_filters (user_id) where notify = true;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.saved_filters enable row level security;

create policy "sf_select_own" on public.saved_filters
  for select using (auth.uid() = user_id);
create policy "sf_insert_own" on public.saved_filters
  for insert with check (auth.uid() = user_id);
create policy "sf_update_own" on public.saved_filters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sf_delete_own" on public.saved_filters
  for delete using (auth.uid() = user_id);
