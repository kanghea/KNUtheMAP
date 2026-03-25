-- ============================================================
-- 005: 건축물대장 API 연계 필드 추가
-- ============================================================

alter table buildings
  add column if not exists use_apr_day     text,      -- 사용승인일 (YYYYMMDD)
  add column if not exists ugrnd_flr_cnt   smallint,  -- 지하층수
  add column if not exists tot_area        numeric,   -- 연면적 (㎡)
  add column if not exists main_purps_nm   text,      -- 주용도명 (예: 공동주택, 제1종근린생활시설)
  add column if not exists strct_cd_nm     text,      -- 구조명 (예: 철근콘크리트구조)
  add column if not exists hhld_cnt        integer,   -- 세대수
  add column if not exists ride_use_elvt_cnt smallint, -- 승용승강기수
  add column if not exists bldrgst_enriched boolean default false; -- 건축물대장 처리 여부

create index if not exists idx_buildings_bldrgst on buildings (bldrgst_enriched);
