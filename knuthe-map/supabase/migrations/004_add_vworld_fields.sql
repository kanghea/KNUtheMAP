-- ============================================================
-- 004: V-world API 연계 필드 추가
-- ============================================================

alter table buildings
  add column if not exists bd_mgt_sn      text,     -- 건물관리번호 (V-world 고유값)
  add column if not exists vworld_enriched boolean default false;  -- V-world 처리 여부

create index if not exists idx_buildings_bd_mgt_sn on buildings (bd_mgt_sn);

-- total_floors 를 V-world 공식 데이터로 전면 교체
-- (OSM building_levels 는 부정확한 경우 많음)
update buildings set total_floors = null, vworld_enriched = false;
