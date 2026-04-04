-- ─────────────────────────────────────────────────────────────────────────────
-- 016: 룸메이트 매칭 서비스
-- ─────────────────────────────────────────────────────────────────────────────

-- ── users.role 확장: roommate 추가 ──────────────────────────────────────────
alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('tenant', 'owner', 'agent', 'admin', 'roommate'));

-- ── roommate_profiles — 룸메이트 프로필 ─────────────────────────────────────
create table if not exists public.roommate_profiles (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.users(id) on delete cascade unique,

  -- 섹션 1: 기본 정보
  birth_year     int         not null check (birth_year between 1999 and 2008),
  student_id     int         not null check (student_id between 17 and 26),
  living_type    text        not null check (living_type in ('dormitory', 'offcampus')),
  dormitory      text,       -- 기숙사 건물명 (living_type='dormitory'일 때)

  -- 섹션 2: 수면 패턴
  bedtime        text        not null,  -- '9시','10시',...,'4시','그 이후'
  wakeup_time    text        not null,  -- '4시','5시',...,'11시','그 이후'
  sleep_habits   text[]      not null default '{}',  -- '없음','이갈이','코골이','잠꼬대','몸부림'
  light_sleep    int         not null check (light_sleep between 1 and 4),  -- 잠귀 (1=어두움, 4=밝음)
  sleep_light    text        not null check (sleep_light in ('none', 'fluorescent', 'stand', 'mood')),

  -- 섹션 3: 위생·청결
  shower_duration text       not null,  -- '5분','10분',...,'40분','그 이상'
  shower_time    text        not null check (shower_time in ('morning', 'lunch', 'evening')),
  hair_wash_time text        not null check (hair_wash_time in ('morning', 'lunch', 'evening')),
  cleaning_freq  text        not null check (cleaning_freq in ('daily', '3-4week', '1-2week')),
  cleanliness    int         not null check (cleanliness between 1 and 4),

  -- 섹션 4: 생활 환경
  cold_sensitivity  int      not null check (cold_sensitivity between 1 and 4),
  heat_sensitivity  int      not null check (heat_sensitivity between 1 and 4),
  perfume_usage  text        not null check (perfume_usage in ('none', 'sometimes', 'daily')),
  scent_sensitivity text     not null check (scent_sensitivity in ('sensitive', 'none')),
  sound_pref     text        not null check (sound_pref in ('earphone', 'speaker', 'flexible')),
  smoking        text        not null check (smoking in ('smoker', 'nonsmoker')),

  -- 섹션 5: 습관
  drinking_freq  text        not null check (drinking_freq in ('none', 'level1', 'level2', 'daily')),
  drinking_amount text       not null check (drinking_amount in ('none', 'level1', 'level2', 'good')),
  gaming         text        not null check (gaming in ('none', 'sometimes', 'daily')),
  indoor_call    text        not null check (indoor_call in ('often', 'short', 'none')),
  exercise       text        not null check (exercise in ('none', 'sometimes', 'daily')),
  indoor_eating  text        not null check (indoor_eating in ('dislike', 'no_smell', 'snack', 'any')),
  bug_tolerance  text        not null check (bug_tolerance in ('hate', 'cant_catch', 'can_catch', 'like')),

  -- 섹션 6: 사회·관계
  sharing        text        not null check (sharing in ('dislike', 'ask_first', 'any')),
  guest_policy   text        not null check (guest_policy in ('any', 'known_only', 'ask_first', 'dislike')),
  relationship   int         not null check (relationship between 1 and 4),  -- 1=학교 사람, 4=절친
  alarm_usage    text        not null check (alarm_usage in ('yes', 'no')),
  alarm_freq     text        not null check (alarm_freq in ('until_wake', 'once')),
  hometown_freq  text        not null check (hometown_freq in ('weekly', 'biweekly', 'monthly', 'sixweeks', 'vacation')),
  study_place    text        not null check (study_place in ('dorm', 'library', 'studyroom', 'flexible')),

  -- 섹션 7: 마무리
  mbti           text,       -- 4자리 MBTI (선택 사항)
  introduction   text        check (char_length(introduction) <= 200),
  wants_to_leave text        not null check (wants_to_leave in ('yes', 'no')),  -- 대학 홀길 생각

  -- 스와이프 가중치 (5번 비교 결과)
  swipe_weights  jsonb       not null default '{}',

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_roommate_profiles_user_id    on public.roommate_profiles (user_id);
create index if not exists idx_roommate_profiles_living_type on public.roommate_profiles (living_type);
create index if not exists idx_roommate_profiles_dormitory   on public.roommate_profiles (dormitory);

-- ── RLS 정책 ────────────────────────────────────────────────────────────────
alter table public.roommate_profiles enable row level security;

-- 본인 프로필 읽기/쓰기
create policy "Users can view own roommate profile"
  on public.roommate_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own roommate profile"
  on public.roommate_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own roommate profile"
  on public.roommate_profiles for update
  using (auth.uid() = user_id);

-- roommate role 사용자는 다른 사람의 프로필도 볼 수 있음
create policy "Roommates can view other profiles"
  on public.roommate_profiles for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'roommate'
    )
  );

-- 관리자는 모두 접근 가능
create policy "Admins can manage all roommate profiles"
  on public.roommate_profiles for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── updated_at 자동 갱신 트리거 ─────────────────────────────────────────────
create or replace function public.update_roommate_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_roommate_updated_at
  before update on public.roommate_profiles
  for each row execute function public.update_roommate_updated_at();

-- ── 호환도 계산 함수 ────────────────────────────────────────────────────────
-- 두 사용자의 호환도를 0~100 점수로 계산
-- viewer_id: 점수를 보는 사용자 (가중치 적용 대상)
-- target_id: 비교 대상 사용자
create or replace function public.calculate_compatibility(viewer_id uuid, target_id uuid)
returns int as $$
declare
  v public.roommate_profiles;
  t public.roommate_profiles;
  w jsonb;
  score float := 0;
  max_score float := 0;

  -- 기본 가중치 (갈등 유발 정도에 따라)
  w_bedtime float := 5.0;
  w_wakeup float := 4.0;
  w_cleanliness float := 5.0;
  w_smoking float := 6.0;
  w_light_sleep float := 3.0;
  w_sleep_habits float := 3.0;
  w_sleep_light float := 3.0;
  w_scent float := 3.0;
  w_sound float := 3.0;
  w_temperature float := 2.5;
  w_guest float := 2.0;
  w_sharing float := 2.0;
  w_drinking float := 1.5;
  w_gaming float := 1.0;
  w_indoor_call float := 1.5;
  w_indoor_eating float := 1.5;
  w_alarm float := 2.0;
  w_exercise float := 1.0;
  w_relationship float := 1.0;
  w_bug float := 0.5;
  w_perfume float := 1.5;
  w_shower_time float := 1.0;

  -- 스와이프 가중치 배율
  mult float;

  -- 시간 매핑용
  v_bed_idx int;
  t_bed_idx int;
  v_wake_idx int;
  t_wake_idx int;
  time_diff int;
begin
  -- 프로필 조회
  select * into v from public.roommate_profiles where user_id = viewer_id;
  select * into t from public.roommate_profiles where user_id = target_id;

  if v is null or t is null then return 0; end if;
  if viewer_id = target_id then return 100; end if;

  -- 스와이프 가중치 적용
  w := v.swipe_weights;
  if w ? 'sleep' then
    mult := (w->>'sleep')::float;
    w_bedtime := w_bedtime * mult;
    w_wakeup := w_wakeup * mult;
  end if;
  if w ? 'cleanliness' then
    mult := (w->>'cleanliness')::float;
    w_cleanliness := w_cleanliness * mult;
  end if;
  if w ? 'smoking' then
    mult := (w->>'smoking')::float;
    w_smoking := w_smoking * mult;
  end if;
  if w ? 'sleep_habits' then
    mult := (w->>'sleep_habits')::float;
    w_sleep_habits := w_sleep_habits * mult;
    w_light_sleep := w_light_sleep * mult;
  end if;
  if w ? 'temperature' then
    mult := (w->>'temperature')::float;
    w_temperature := w_temperature * mult;
  end if;
  if w ? 'sound' then
    mult := (w->>'sound')::float;
    w_sound := w_sound * mult;
  end if;
  if w ? 'guest' then
    mult := (w->>'guest')::float;
    w_guest := w_guest * mult;
  end if;
  if w ? 'sharing' then
    mult := (w->>'sharing')::float;
    w_sharing := w_sharing * mult;
  end if;
  if w ? 'drinking' then
    mult := (w->>'drinking')::float;
    w_drinking := w_drinking * mult;
  end if;
  if w ? 'alarm' then
    mult := (w->>'alarm')::float;
    w_alarm := w_alarm * mult;
  end if;

  -- ── 취침 시간 비교 ──
  v_bed_idx := case v.bedtime
    when '9시' then 0 when '10시' then 1 when '11시' then 2 when '12시' then 3
    when '1시' then 4 when '2시' then 5 when '3시' then 6 when '4시' then 7
    else 8 end;
  t_bed_idx := case t.bedtime
    when '9시' then 0 when '10시' then 1 when '11시' then 2 when '12시' then 3
    when '1시' then 4 when '2시' then 5 when '3시' then 6 when '4시' then 7
    else 8 end;
  time_diff := abs(v_bed_idx - t_bed_idx);
  max_score := max_score + w_bedtime;
  score := score + w_bedtime * greatest(0, 1.0 - time_diff * 0.25);

  -- ── 기상 시간 비교 ──
  v_wake_idx := case v.wakeup_time
    when '4시' then 0 when '5시' then 1 when '6시' then 2 when '7시' then 3
    when '8시' then 4 when '9시' then 5 when '10시' then 6 when '11시' then 7
    else 8 end;
  t_wake_idx := case t.wakeup_time
    when '4시' then 0 when '5시' then 1 when '6시' then 2 when '7시' then 3
    when '8시' then 4 when '9시' then 5 when '10시' then 6 when '11시' then 7
    else 8 end;
  time_diff := abs(v_wake_idx - t_wake_idx);
  max_score := max_score + w_wakeup;
  score := score + w_wakeup * greatest(0, 1.0 - time_diff * 0.25);

  -- ── 청결 수준 ──
  max_score := max_score + w_cleanliness;
  score := score + w_cleanliness * (1.0 - abs(v.cleanliness - t.cleanliness) / 3.0);

  -- ── 흡연 (불일치 시 큰 감점) ──
  max_score := max_score + w_smoking;
  if v.smoking = t.smoking then
    score := score + w_smoking;
  else
    score := score + 0;  -- 흡연 불일치 = 0점
  end if;

  -- ── 잠귀 ──
  max_score := max_score + w_light_sleep;
  score := score + w_light_sleep * (1.0 - abs(v.light_sleep - t.light_sleep) / 3.0);

  -- ── 잠버릇 (공통 항목이 적을수록 좋음 — 둘 다 '없음'이면 최고점) ──
  max_score := max_score + w_sleep_habits;
  if v.sleep_habits = '{없음}' and t.sleep_habits = '{없음}' then
    score := score + w_sleep_habits;
  elsif '없음' = any(v.sleep_habits) or '없음' = any(t.sleep_habits) then
    score := score + w_sleep_habits * 0.7;
  else
    score := score + w_sleep_habits * 0.3;
  end if;

  -- ── 수면등 ──
  max_score := max_score + w_sleep_light;
  if v.sleep_light = t.sleep_light then
    score := score + w_sleep_light;
  elsif v.sleep_light = 'none' or t.sleep_light = 'none' then
    score := score + w_sleep_light * 0.3;
  else
    score := score + w_sleep_light * 0.6;
  end if;

  -- ── 향 민감도 ──
  max_score := max_score + w_scent;
  if v.scent_sensitivity = t.scent_sensitivity then
    score := score + w_scent;
  elsif v.scent_sensitivity = 'sensitive' and t.perfume_usage = 'daily' then
    score := score + 0;
  elsif t.scent_sensitivity = 'sensitive' and v.perfume_usage = 'daily' then
    score := score + 0;
  else
    score := score + w_scent * 0.5;
  end if;

  -- ── 소리 선호 ──
  max_score := max_score + w_sound;
  if v.sound_pref = t.sound_pref then
    score := score + w_sound;
  elsif v.sound_pref = 'flexible' or t.sound_pref = 'flexible' then
    score := score + w_sound * 0.7;
  else
    score := score + w_sound * 0.3;
  end if;

  -- ── 온도 선호 (추위/더위 종합) ──
  max_score := max_score + w_temperature;
  score := score + w_temperature * (1.0 -
    (abs(v.cold_sensitivity - t.cold_sensitivity) + abs(v.heat_sensitivity - t.heat_sensitivity)) / 6.0);

  -- ── 친구 초대 ──
  max_score := max_score + w_guest;
  if v.guest_policy = t.guest_policy then
    score := score + w_guest;
  elsif v.guest_policy = 'any' or t.guest_policy = 'any' then
    score := score + w_guest * 0.6;
  else
    score := score + w_guest * 0.3;
  end if;

  -- ── 개인 물건 공유 ──
  max_score := max_score + w_sharing;
  if v.sharing = t.sharing then
    score := score + w_sharing;
  elsif v.sharing = 'any' or t.sharing = 'any' then
    score := score + w_sharing * 0.6;
  else
    score := score + w_sharing * 0.2;
  end if;

  -- ── 음주 빈도 ──
  max_score := max_score + w_drinking;
  if v.drinking_freq = t.drinking_freq then
    score := score + w_drinking;
  else
    score := score + w_drinking * 0.4;
  end if;

  -- ── 게임 ──
  max_score := max_score + w_gaming;
  if v.gaming = t.gaming then
    score := score + w_gaming;
  else
    score := score + w_gaming * 0.5;
  end if;

  -- ── 실내 통화 ──
  max_score := max_score + w_indoor_call;
  if v.indoor_call = t.indoor_call then
    score := score + w_indoor_call;
  elsif v.indoor_call = 'none' and t.indoor_call = 'often' then
    score := score + 0;
  elsif t.indoor_call = 'none' and v.indoor_call = 'often' then
    score := score + 0;
  else
    score := score + w_indoor_call * 0.5;
  end if;

  -- ── 실내 취식 ──
  max_score := max_score + w_indoor_eating;
  if v.indoor_eating = t.indoor_eating then
    score := score + w_indoor_eating;
  elsif v.indoor_eating = 'any' or t.indoor_eating = 'any' then
    score := score + w_indoor_eating * 0.6;
  elsif v.indoor_eating = 'dislike' or t.indoor_eating = 'dislike' then
    score := score + w_indoor_eating * 0.1;
  else
    score := score + w_indoor_eating * 0.5;
  end if;

  -- ── 알람 ──
  max_score := max_score + w_alarm;
  if v.alarm_usage = t.alarm_usage then
    if v.alarm_freq = t.alarm_freq then
      score := score + w_alarm;
    else
      score := score + w_alarm * 0.6;
    end if;
  else
    score := score + w_alarm * 0.3;
  end if;

  -- ── 운동 ──
  max_score := max_score + w_exercise;
  if v.exercise = t.exercise then
    score := score + w_exercise;
  else
    score := score + w_exercise * 0.5;
  end if;

  -- ── 룸메와의 관계 ──
  max_score := max_score + w_relationship;
  score := score + w_relationship * (1.0 - abs(v.relationship - t.relationship) / 3.0);

  -- ── 벌레 내성 ──
  max_score := max_score + w_bug;
  if v.bug_tolerance = t.bug_tolerance then
    score := score + w_bug;
  else
    score := score + w_bug * 0.5;
  end if;

  -- ── 향수 사용 ──
  max_score := max_score + w_perfume;
  if v.perfume_usage = t.perfume_usage then
    score := score + w_perfume;
  else
    score := score + w_perfume * 0.4;
  end if;

  -- ── 샤워 시간대 ──
  max_score := max_score + w_shower_time;
  if v.shower_time = t.shower_time then
    score := score + w_shower_time;
  else
    score := score + w_shower_time * 0.5;
  end if;

  -- 최종 점수 (0~100)
  if max_score = 0 then return 0; end if;
  return round((score / max_score) * 100)::int;
end;
$$ language plpgsql stable;
