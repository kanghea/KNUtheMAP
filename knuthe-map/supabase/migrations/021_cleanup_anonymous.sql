-- ─────────────────────────────────────────────────────────────────────────────
-- 021: 7일 미사용 익명 사용자 정리
--
-- 비로그인 사용자는 Supabase Anonymous Auth 로 자동 가입되어 auth.users 에
-- 누적된다. 정식 로그인으로 전환되지 않고 7일간 활동 없으면 정리.
--
-- 활동 기준: 본인 셋(bangbwayo_sets) 또는 트랙(bangbwayo_tracks) 의 updated_at.
-- 셋이 0개인 익명 사용자는 auth.users.created_at 기준 7일.
--
-- 정리 대상에서 제외:
--   · is_anonymous = false (정식 사용자)
--   · 7일 내 활동 흔적 있음
--
-- ON DELETE CASCADE 로 bangbwayo_sets/tracks/responses/photos 모두 자동 정리.
-- Storage 의 사진 객체는 별도 정리가 필요 — 이건 정책 결정 후 다음 PR.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.cleanup_anonymous_users()
returns table(deleted_count int) as $$
declare
  cutoff timestamptz := now() - interval '7 days';
  victim record;
  count_  int := 0;
begin
  -- 정리 대상: 7일 내 활동 0 인 익명 사용자
  for victim in
    select u.id
    from auth.users u
    where coalesce(u.is_anonymous, false) = true
      and u.created_at < cutoff
      and not exists (
        select 1 from public.bangbwayo_sets s
        where s.user_id = u.id and s.updated_at >= cutoff
      )
      and not exists (
        select 1 from public.bangbwayo_tracks t
          join public.bangbwayo_sets s2 on s2.id = t.set_id
        where s2.user_id = u.id and t.updated_at >= cutoff
      )
  loop
    -- auth.users 에서 삭제 — public.users 와 bangbwayo_* 는 ON DELETE CASCADE
    delete from auth.users where id = victim.id;
    count_ := count_ + 1;
  end loop;

  return query select count_;
end;
$$ language plpgsql security definer;

-- 실행 권한 — service role 만 호출 가능 (anon/authenticated 차단)
revoke all on function public.cleanup_anonymous_users() from public;
revoke all on function public.cleanup_anonymous_users() from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 자동 실행 — Supabase pg_cron 사용
--
-- 이 부분은 Supabase 대시보드의 Database → Extensions 에서 pg_cron 을
-- 활성화한 후 아래 SQL 을 실행해 등록해야 합니다.
--
-- 또는 Vercel Cron / GitHub Actions 등 외부에서 매일 호출하셔도 됩니다.
-- ─────────────────────────────────────────────────────────────────────────────

-- 매일 새벽 3시(KST 기준은 18:00 UTC) 실행 — 트래픽 적은 시간대
-- pg_cron 은 UTC 기준이라 KST 새벽 3시는 18:00.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'cleanup-anonymous-users',
      '0 18 * * *',                       -- 매일 18:00 UTC = KST 03:00
      $cron$select public.cleanup_anonymous_users()$cron$
    );
  end if;
end $$;
