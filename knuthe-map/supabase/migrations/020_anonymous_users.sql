-- ─────────────────────────────────────────────────────────────────────────────
-- 020: 익명 사용자 지원 — handle_new_user 트리거 보강
--
-- 방봐요 비로그인 사용을 위해 Supabase Anonymous Auth 활성화.
-- 익명 사용자는 auth.users 에 email=NULL 로 들어오는데, 기존 트리거가
-- public.users.email NOT NULL 제약과 충돌해 실패함.
--
-- 변경:
--   1. public.users.email 을 nullable 로 (익명 사용자가 email 없이 row 가짐)
--   2. handle_new_user 가 NULL email 케이스를 안전하게 처리
--   3. 익명 사용자에게는 nickname 도 placeholder ("손님") 부여
--
-- 별도로 Supabase 대시보드에서 Authentication → Settings →
-- "Enable anonymous sign-ins" 도 ON 해야 합니다.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. email NOT NULL 제약 제거 (익명 사용자는 email 없음)
alter table public.users
  alter column email drop not null;

-- 2. handle_new_user 트리거 NULL email 안전 처리
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_anonymous boolean;
  fallback_nickname text;
begin
  is_anonymous := coalesce(new.is_anonymous, false);

  fallback_nickname := case
    when new.raw_user_meta_data->>'full_name' is not null
      then new.raw_user_meta_data->>'full_name'
    when new.email is not null
      then split_part(new.email, '@', 1)
    when is_anonymous
      then '손님'
    else
      '사용자'
  end;

  insert into public.users (id, email, nickname, avatar_url)
  values (
    new.id,
    new.email,                               -- NULL 허용 (익명)
    fallback_nickname,
    new.raw_user_meta_data->>'avatar_url'    -- NULL 허용 (이미 nullable)
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;
