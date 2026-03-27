-- 007: users 테이블에 학번·학과 컬럼 추가

alter table public.users
  add column if not exists grade text,   -- e.g. '27학번'
  add column if not exists dept  text;   -- e.g. '경영학부'
