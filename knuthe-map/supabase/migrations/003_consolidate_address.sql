-- ============================================================
-- 003: address / geocoded_address 통합
--
-- 기존 설계:
--   address          — 관리자 직접 입력 (OSM 배치 임포트 후 대부분 null)
--   geocoded_address — Geocoding API 자동 입력 (네이버 역지오코딩으로 채워짐)
--
-- 변경:
--   geocoded_address 값을 address 로 통합 후 geocoded_address 컬럼 삭제
--   address 하나로 단일화
-- ======================일======================================

-- 1. geocoded_address → address 복사 (address 가 비어있는 행만)
update buildings
set address = geocoded_address
where address is null
  and geocoded_address is not null
  and geocoded_address <> '';

-- 2. geocoded_address 컬럼 삭제
alter table buildings drop column geocoded_address;
