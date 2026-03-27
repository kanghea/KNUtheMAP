-- 013: rooms 테이블에 호수(unit_number) 컬럼 추가
alter table public.rooms
  add column if not exists unit_number text;

-- 호수 형식 예시: '101', '202', 'B101' (지하), '301가'
-- 앱 레이어에서 검증 처리 (텍스트로 유연하게 저장)
