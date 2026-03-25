-- ============================================================
-- 002: full_data.json 임포트를 위한 누락 필드/테이블 추가
-- ============================================================


-- ■ 1. map_layers — zone, icon 컬럼 추가
alter table map_layers
  add column if not exists zone text,
  add column if not exists icon text;

-- layer_type 허용값에 'zone' 추가
alter table map_layers
  drop constraint if exists map_layers_layer_type_check;

alter table map_layers
  add constraint map_layers_layer_type_check
  check (layer_type in ('gate', 'alley', 'streetlight', 'mascot', 'zone'));


-- ■ 2. zones (구역 폴리곤) — 별도 테이블
--   map_layers와 달리 Point가 아닌 Polygon 지오메트리를 가짐
create table if not exists zones (
  id          uuid        primary key default gen_random_uuid(),
  osm_id      text,                                              -- OSM 원본 ID (예: "2018")
  name        text        not null,                             -- 구역명 (예: 북문구역)
  layer_type  text        not null default 'zone',
  lat         float8      not null,                             -- 대표 좌표 (centroid)
  lng         float8      not null,
  footprint   jsonb       not null,                             -- Polygon 좌표 [[lng,lat], ...]
  is_active   boolean     default true,
  created_at  timestamptz default now()
);

alter table zones enable row level security;
create policy "zones_select" on zones for select using (is_active = true);


-- ■ 3. buildings — OSM / Juso 원본 필드 추가
alter table buildings
  add column if not exists osm_id              text,
  add column if not exists zone                text,
  add column if not exists footprint           jsonb,           -- Polygon 좌표 [[lng,lat], ...]
  add column if not exists height_m            float4,          -- 건물 높이 (미터)
  add column if not exists building_type       text,            -- OSM building 태그 (yes / residential 등)
  add column if not exists amenity             text,            -- OSM amenity 태그
  add column if not exists shop                text,            -- OSM shop 태그
  add column if not exists office              text,            -- OSM office 태그
  add column if not exists religion            text,            -- OSM religion 태그
  add column if not exists juso_search_keyword text,            -- Juso 검색에 쓸 키워드
  add column if not exists juso_enriched       boolean default false,
  add column if not exists juso_official_name  text,            -- Juso API 반환 건물명
  add column if not exists juso_official_lat   float8,          -- Juso API 반환 좌표
  add column if not exists juso_official_lng   float8;


-- ■ 4. buildings — OSM 데이터에 name/address 없는 건물 다수, NOT NULL 해제
alter table buildings alter column address drop not null;
alter table buildings alter column name    drop not null;


-- ■ 5. 인덱스
create index if not exists idx_zones_lat_lng     on zones (lat, lng);
create index if not exists idx_buildings_osm_id  on buildings (osm_id);
