-- ─────────────────────────────────────────────────────────────────────────────
-- 022: 룸메이트 프로필에 성별(gender) 추가
--
-- 룸메이트 매칭에서 동성 우선/이성 분리 같은 정책을 펴려면 성별 정보가 필요하다.
-- 학과(dept)·학번(grade)은 users 테이블에 이미 존재하므로 거기서 JOIN 으로 읽고,
-- 성별만 roommate_profiles 에 추가한다.
--
-- 'unknown' 기본값은 두지 않는다 — 새 가입자는 온보딩에서 반드시 입력하고,
-- 기존 행은 0개라 마이그레이션 제약 충돌이 없다 (016 migration 이후 첫 작성자).
-- 만약 기존 행이 있다면 default 'female' 같은 값으로 채우는 분기를 두지 않고
-- 명시적으로 backfill 하는 정책 (아직 user 0).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.roommate_profiles
  add column if not exists gender text
    check (gender in ('male', 'female'));

-- 기존 행을 막기 위한 NOT NULL 은 새 행부터 적용. 016 migration 직후 row 가
-- 없는 것을 가정하지만 안전하게 NULL 허용으로 두고, 신규 insert 검증은 API 에서.
-- 추후 모든 행이 채워지면 NOT NULL 추가 마이그레이션을 별도로 둔다.

-- 매칭 필터(동성/이성)에 자주 쓰이므로 인덱스
create index if not exists idx_roommate_profiles_gender
  on public.roommate_profiles (gender);
