-- ─────────────────────────────────────────────────────────────────────────────
-- 024: users.role 에 'bangbwayo' 추가
--
-- 방봐요 모드를 별도 role 로 분리. 룸메이트(roommate) 가 이미 role+viewMode
-- 패턴으로 운영되는 것과 동일한 일관성 회복:
--   · tenant    : 방보기 모드
--   · roommate  : 룸메이트 모드
--   · bangbwayo : 방봐요 모드 (신규) — 익명 사용자 + 방봐요 모드 정식 사용자
--
-- 의미: role 은 "현재 어느 모드를 사용하는가" 를 반영. 권한 체크용 admin/owner/
-- agent 와는 의미 결이 다르지만, 같은 컬럼을 공유한다 (룸메이트와 동일 패턴).
--
-- 익명 사용자 처리: 020 의 handle_new_user 트리거가 role 을 명시하지 않아
-- 데이터베이스 기본값(tenant)으로 들어오는데, 방봐요 진입(EnsureAnonymousSession)
-- 흐름에서 명시적으로 'bangbwayo' 로 update 하도록 클라이언트 코드를 변경.
-- 트리거 자체는 변경하지 않음 — 정식 로그인 익명 인계(linkIdentity) 시
-- handle_new_user 가 다시 호출되지 않아 영향 없음.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('tenant', 'owner', 'agent', 'admin', 'roommate', 'bangbwayo'));
