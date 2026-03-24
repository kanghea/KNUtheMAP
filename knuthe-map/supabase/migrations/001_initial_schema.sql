-- ============================================================
-- KNUtheMAP 초기 스키마
-- users / reviews / mentor_posts 는 추후 추가 예정
-- ============================================================


-- ■ 1. buildings (건물)
create table buildings (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,                          -- 건물 이름 (예: 화이트빌)
  address           text        not null,                          -- 관리자 입력 주소
  geocoded_address  text,                                          -- Mapbox API 반환 정제 주소
  lat               float8      not null,                          -- Geocoding API 자동 입력
  lng               float8      not null,                          -- Geocoding API 자동 입력
  total_floors      int,                                           -- 총 층수
  floor_structure   jsonb,                                         -- 층별 호실 구조 {"1":["101","102"],"2":["201"]}
  has_elevator      boolean     default false,
  has_parking       boolean     default false,
  images            text[]      default '{}',                      -- Supabase Storage 경로 배열
  owner_name        text,                                          -- 건물주 이름 (직접 거래용)
  owner_phone       text,                                          -- 건물주 연락처 (직접 거래용)
  is_active         boolean     default true,                      -- 지도 노출 여부
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ■ 2. rooms (호실) — 좌표 없음, 지도 마커로 표시되지 않음
create table rooms (
  id            uuid        primary key default gen_random_uuid(),
  building_id   uuid        not null references buildings(id) on delete cascade,
  room_number   text        not null,                              -- 호수 (예: 101)
  floor         int,                                               -- 층
  room_type     text        check (room_type in ('원룸', '투룸', '오피스텔', '고시원')),
  size_m2       float4,                                            -- 면적
  rent          int,                                               -- 월세 (만원)
  deposit       int,                                               -- 보증금 (만원)
  maintenance   int,                                               -- 관리비 (만원)
  options       jsonb       default '{}',                          -- 옵션 목록 (에어컨, 냉장고 등)
  images        text[]      default '{}',                          -- Supabase Storage 경로 배열
  is_vacant     boolean     default true,                          -- 공실 여부
  description   text,
  is_active     boolean     default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ■ 3. agents (공인중개사)
create table agents (
  id            uuid        primary key default gen_random_uuid(),
  agency_name   text        not null,                              -- 업체명
  contact_name  text,                                              -- 담당자 이름
  phone         text,
  address       text,
  is_active     boolean     default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ■ 4. building_agents (건물-공인중개사 N:N 연결)
create table building_agents (
  building_id   uuid        not null references buildings(id) on delete cascade,
  agent_id      uuid        not null references agents(id) on delete cascade,
  note          text,                                              -- 특이사항
  created_at    timestamptz default now(),
  primary key (building_id, agent_id)                             -- 복합 PK
);

-- ■ 5. map_layers (경북대 실생활 레이어) — 독립 테이블
create table map_layers (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,                              -- 예: 동문, 북쪽 사잇길
  layer_type    text        not null check (layer_type in ('gate', 'alley', 'streetlight', 'mascot')),
  lat           float8      not null,
  lng           float8      not null,
  description   text,
  is_active     boolean     default true,
  created_at    timestamptz default now()
);


-- ============================================================
-- 인덱스
-- ============================================================

-- Mapbox 뷰포트 쿼리 성능 (건물 좌표)
create index idx_buildings_lat_lng on buildings (lat, lng);

-- 건물별 호실 목록 조회 성능
create index idx_rooms_building_id on rooms (building_id);


-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger buildings_updated_at
  before update on buildings
  for each row execute function set_updated_at();

create trigger rooms_updated_at
  before update on rooms
  for each row execute function set_updated_at();

create trigger agents_updated_at
  before update on agents
  for each row execute function set_updated_at();


-- ============================================================
-- RLS (행 수준 보안)
-- ============================================================

alter table buildings      enable row level security;
alter table rooms          enable row level security;
alter table agents         enable row level security;
alter table building_agents enable row level security;
alter table map_layers     enable row level security;

-- 열람은 누구나 가능
create policy "buildings_select"       on buildings       for select using (is_active = true);
create policy "rooms_select"           on rooms           for select using (is_active = true);
create policy "agents_select"          on agents          for select using (is_active = true);
create policy "building_agents_select" on building_agents for select using (true);
create policy "map_layers_select"      on map_layers      for select using (is_active = true);

-- 쓰기는 관리자만 가능 (추후 users 테이블 추가 시 admin role 체크로 교체)
-- 현재는 service_role key 사용하는 서버 클라이언트로만 쓰기 허용
