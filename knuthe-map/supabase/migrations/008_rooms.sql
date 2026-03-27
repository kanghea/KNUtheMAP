-- 008: rooms (매물) 테이블

create table if not exists public.rooms (
  id               uuid        primary key default gen_random_uuid(),
  building_id      uuid        not null references buildings(id) on delete cascade,
  listed_by        uuid        references public.users(id) on delete set null,

  contract_type    text        not null check (contract_type in ('월세', '전세', '매매')),
  deposit          int         not null default 0,   -- 보증금 (만원)
  monthly_rent     int,                              -- 월세 (만원), 전세·매매는 null
  maintenance      int,                              -- 관리비 (만원)

  area_m2          float,                            -- 전용면적 (㎡)
  floor            int,
  total_floors     int,
  room_type        text        check (room_type in ('원룸','투룸','복층형원룸','오피스텔','아파트','빌라','단독주택')),
  description      text,

  images           jsonb       not null default '[]'::jsonb,
  options          jsonb       not null default '{}'::jsonb,
  characteristics  jsonb       not null default '[]'::jsonb,
  checklist        jsonb       not null default '{}'::jsonb,

  contact_phone    text,
  contact_name     text,

  available_from   date,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_rooms_building_id on rooms (building_id);
create index if not exists idx_rooms_is_active   on rooms (is_active) where is_active = true;

create trigger rooms_updated_at
  before update on public.rooms
  for each row execute function set_updated_at();

-- RLS
alter table public.rooms enable row level security;

create policy "rooms_select"     on public.rooms for select using (is_active = true);
create policy "rooms_insert"     on public.rooms for insert with check (auth.uid() = listed_by);
create policy "rooms_update_own" on public.rooms for update using (auth.uid() = listed_by);
create policy "rooms_delete_own" on public.rooms for delete using (auth.uid() = listed_by);
