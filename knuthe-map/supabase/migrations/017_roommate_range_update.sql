-- ─────────────────────────────────────────────────────────────────────────────
-- 017: 룸메이트 프로필 — 수면 시간 범위 + 샤워/머리 복수 선택
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. 취침 시간: 단일값 → 범위 (bedtime_start, bedtime_end) ───────────────
alter table public.roommate_profiles rename column bedtime to bedtime_start;
alter table public.roommate_profiles add column bedtime_end text not null default '';

-- 기존 데이터: bedtime_end를 bedtime_start와 동일하게 설정
update public.roommate_profiles set bedtime_end = bedtime_start where bedtime_end = '';

-- ── 2. 기상 시간: 단일값 → 범위 (wakeup_start, wakeup_end) ────────────────
alter table public.roommate_profiles rename column wakeup_time to wakeup_start;
alter table public.roommate_profiles add column wakeup_end text not null default '';

-- 기존 데이터: wakeup_end를 wakeup_start와 동일하게 설정
update public.roommate_profiles set wakeup_end = wakeup_start where wakeup_end = '';

-- ── 3. 샤워 시간대: text → text[] ─────────────────────────────────────────
-- 기존 check constraint 삭제
alter table public.roommate_profiles drop constraint if exists roommate_profiles_shower_time_check;
alter table public.roommate_profiles drop constraint if exists roommate_profiles_hair_wash_time_check;

-- 타입 변경 (기존 단일값을 배열로 변환)
alter table public.roommate_profiles
  alter column shower_time type text[]
  using array[shower_time];

alter table public.roommate_profiles
  alter column hair_wash_time type text[]
  using array[hair_wash_time];

-- 새 check constraint (배열 원소가 유효한 값인지 확인)
alter table public.roommate_profiles
  add constraint roommate_profiles_shower_time_check
  check (shower_time <@ array['morning', 'lunch', 'evening']::text[]);

alter table public.roommate_profiles
  add constraint roommate_profiles_hair_wash_time_check
  check (hair_wash_time <@ array['morning', 'lunch', 'evening']::text[]);

-- ── 4. 호환도 계산 함수 갱신 ───────────────────────────────────────────────
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
  v_bed_start_idx int;
  v_bed_end_idx int;
  t_bed_start_idx int;
  t_bed_end_idx int;
  v_bed_mid float;
  t_bed_mid float;
  v_wake_start_idx int;
  v_wake_end_idx int;
  t_wake_start_idx int;
  t_wake_end_idx int;
  v_wake_mid float;
  t_wake_mid float;
  time_diff float;
  shower_overlap int;
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

  -- ── 취침 시간 비교 (범위 중간값 사용) ──
  v_bed_start_idx := case v.bedtime_start
    when '9시' then 0 when '10시' then 1 when '11시' then 2 when '12시' then 3
    when '1시' then 4 when '2시' then 5 when '3시' then 6 when '4시' then 7
    else 8 end;
  v_bed_end_idx := case v.bedtime_end
    when '9시' then 0 when '10시' then 1 when '11시' then 2 when '12시' then 3
    when '1시' then 4 when '2시' then 5 when '3시' then 6 when '4시' then 7
    else 8 end;
  t_bed_start_idx := case t.bedtime_start
    when '9시' then 0 when '10시' then 1 when '11시' then 2 when '12시' then 3
    when '1시' then 4 when '2시' then 5 when '3시' then 6 when '4시' then 7
    else 8 end;
  t_bed_end_idx := case t.bedtime_end
    when '9시' then 0 when '10시' then 1 when '11시' then 2 when '12시' then 3
    when '1시' then 4 when '2시' then 5 when '3시' then 6 when '4시' then 7
    else 8 end;
  v_bed_mid := (v_bed_start_idx + v_bed_end_idx) / 2.0;
  t_bed_mid := (t_bed_start_idx + t_bed_end_idx) / 2.0;
  time_diff := abs(v_bed_mid - t_bed_mid);
  max_score := max_score + w_bedtime;
  score := score + w_bedtime * greatest(0, 1.0 - time_diff * 0.25);

  -- ── 기상 시간 비교 (범위 중간값 사용) ──
  v_wake_start_idx := case v.wakeup_start
    when '4시' then 0 when '5시' then 1 when '6시' then 2 when '7시' then 3
    when '8시' then 4 when '9시' then 5 when '10시' then 6 when '11시' then 7
    else 8 end;
  v_wake_end_idx := case v.wakeup_end
    when '4시' then 0 when '5시' then 1 when '6시' then 2 when '7시' then 3
    when '8시' then 4 when '9시' then 5 when '10시' then 6 when '11시' then 7
    else 8 end;
  t_wake_start_idx := case t.wakeup_start
    when '4시' then 0 when '5시' then 1 when '6시' then 2 when '7시' then 3
    when '8시' then 4 when '9시' then 5 when '10시' then 6 when '11시' then 7
    else 8 end;
  t_wake_end_idx := case t.wakeup_end
    when '4시' then 0 when '5시' then 1 when '6시' then 2 when '7시' then 3
    when '8시' then 4 when '9시' then 5 when '10시' then 6 when '11시' then 7
    else 8 end;
  v_wake_mid := (v_wake_start_idx + v_wake_end_idx) / 2.0;
  t_wake_mid := (t_wake_start_idx + t_wake_end_idx) / 2.0;
  time_diff := abs(v_wake_mid - t_wake_mid);
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
    score := score + 0;
  end if;

  -- ── 잠귀 ──
  max_score := max_score + w_light_sleep;
  score := score + w_light_sleep * (1.0 - abs(v.light_sleep - t.light_sleep) / 3.0);

  -- ── 잠버릇 ──
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

  -- ── 온도 선호 ──
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

  -- ── 샤워 시간대 (배열 교집합 기반) ──
  max_score := max_score + w_shower_time;
  select count(*) into shower_overlap
    from unnest(v.shower_time) as a
    join unnest(t.shower_time) as b on a = b;
  if shower_overlap > 0 then
    score := score + w_shower_time;
  else
    score := score + w_shower_time * 0.5;
  end if;

  -- 최종 점수 (0~100)
  if max_score = 0 then return 0; end if;
  return round((score / max_score) * 100)::int;
end;
$$ language plpgsql stable;
