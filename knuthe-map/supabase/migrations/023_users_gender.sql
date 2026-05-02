-- ─────────────────────────────────────────────────────────────────────────────
-- 023: users 에 성별(gender) 추가 — 공통 온보딩에서 받은 값을 저장
--
-- 022 에서 roommate_profiles.gender 를 추가했지만, 그 컬럼은 룸메이트 모드
-- 사용자만 채워진다. 새 온보딩 플로우는 모든 사용자에게 학과·학번·성별을
-- 공통으로 묻고 users 테이블에 동기화한다 (OAuth callback 에서 prefs 쿠키
-- 의 gender 를 users.gender 로 동기화).
--
-- roommate_profiles.gender 는 그대로 두고 (룸메이트 매칭의 동성 우선
-- 정책에 사용), users.gender 는 모드 무관하게 보유한다. /api/roommate POST
-- 에서 두 값이 일치하도록 동기화하는 것은 후속 PR.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists gender text
    check (gender in ('male', 'female'));
