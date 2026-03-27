-- ─────────────────────────────────────────────────────────────────────────────
-- 010: 역할 체계 확장 · 호실 관리 · 채팅 구조
-- ─────────────────────────────────────────────────────────────────────────────

-- ── users.role 확장 ───────────────────────────────────────────────────────────
alter table public.users
  drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('tenant', 'owner', 'agent', 'admin'));

-- 기존 'observer' → 'tenant' 마이그레이션
update public.users set role = 'tenant' where role = 'observer';

-- role 기본값 변경
alter table public.users alter column role set default 'tenant';

-- grade, dept 컬럼 (007 migration에서 이미 추가됐으면 skip)
alter table public.users
  add column if not exists grade text,
  add column if not exists dept  text;

-- ── role_requests — 권한 신청 ─────────────────────────────────────────────────
create table if not exists public.role_requests (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.users(id) on delete cascade,
  requested_role text        not null check (requested_role in ('owner', 'agent')),
  status         text        not null default 'pending'
                             check (status in ('pending', 'approved', 'rejected')),

  -- 신청 정보
  business_name  text,        -- 사무소명 / 건물명
  license_number text,        -- 공인중개사 등록번호 (agent만)
  phone          text,
  memo           text,        -- 기타 메모

  -- 검토
  reviewed_by    uuid        references public.users(id) on delete set null,
  reviewed_at    timestamptz,
  reject_reason  text,

  created_at     timestamptz not null default now()
);

create index if not exists idx_role_requests_user_id on public.role_requests (user_id);
create index if not exists idx_role_requests_status  on public.role_requests (status);

-- ── owner_buildings — 건물주↔건물 연결 ──────────────────────────────────────
create table if not exists public.owner_buildings (
  id                  uuid        primary key default gen_random_uuid(),
  owner_id            uuid        not null references public.users(id) on delete cascade,
  building_id         uuid        not null references public.buildings(id) on delete cascade,
  dedicated_agent_id  uuid        references public.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  unique (owner_id, building_id)
);

create index if not exists idx_owner_buildings_owner_id    on public.owner_buildings (owner_id);
create index if not exists idx_owner_buildings_building_id on public.owner_buildings (building_id);

-- ── agent_buildings — 중개사↔건물 연결 (다수) ───────────────────────────────
create table if not exists public.agent_buildings (
  id          uuid        primary key default gen_random_uuid(),
  agent_id    uuid        not null references public.users(id) on delete cascade,
  building_id uuid        not null references public.buildings(id) on delete cascade,
  is_primary  boolean     not null default false,
  created_at  timestamptz not null default now(),
  unique (agent_id, building_id)
);

create index if not exists idx_agent_buildings_agent_id    on public.agent_buildings (agent_id);
create index if not exists idx_agent_buildings_building_id on public.agent_buildings (building_id);

-- ── building_units — 건물 호실 단위 ─────────────────────────────────────────
create table if not exists public.building_units (
  id              uuid        primary key default gen_random_uuid(),
  building_id     uuid        not null references public.buildings(id) on delete cascade,
  floor           int         not null,
  unit_number     text        not null,   -- "101", "202" 등

  area_m2         float,
  room_type       text        check (room_type in ('원룸','투룸','복층형원룸','오피스텔','아파트','빌라','단독주택')),

  -- 현재 상태
  status          text        not null default 'vacant'
                              check (status in ('vacant', 'occupied', 'reserved')),

  -- 관리비, 기본 조건 (매물 등록 시 기본값으로 사용)
  base_deposit    int,        -- 기본 보증금 (만원)
  base_rent       int,        -- 기본 월세 (만원)
  maintenance     int,        -- 관리비 (만원)

  memo            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (building_id, floor, unit_number)
);

create index if not exists idx_building_units_building_id on public.building_units (building_id);
create index if not exists idx_building_units_status      on public.building_units (status);

create trigger building_units_updated_at
  before update on public.building_units
  for each row execute function set_updated_at();

-- ── owner_contracts — 건물주 임대 계약 ──────────────────────────────────────
create table if not exists public.owner_contracts (
  id              uuid        primary key default gen_random_uuid(),
  building_id     uuid        not null references public.buildings(id) on delete cascade,
  unit_id         uuid        not null references public.building_units(id) on delete cascade,
  owner_id        uuid        not null references public.users(id) on delete cascade,
  agent_id        uuid        references public.users(id) on delete set null,  -- 담당 중개사

  -- 세입자 정보 (비공개 — owner만 조회 가능)
  tenant_name     text,
  tenant_phone    text,

  contract_type   text        not null check (contract_type in ('월세', '전세')),
  deposit         int         not null default 0,
  monthly_rent    int,
  maintenance     int,

  contract_start  date,
  contract_end    date,
  is_auto_renew   boolean     not null default false,

  status          text        not null default 'active'
                              check (status in ('active', 'expired', 'terminated')),

  memo            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_owner_contracts_building_id on public.owner_contracts (building_id);
create index if not exists idx_owner_contracts_unit_id     on public.owner_contracts (unit_id);
create index if not exists idx_owner_contracts_owner_id    on public.owner_contracts (owner_id);
create index if not exists idx_owner_contracts_status      on public.owner_contracts (status);

create trigger owner_contracts_updated_at
  before update on public.owner_contracts
  for each row execute function set_updated_at();

-- ── 트리거: owner_contracts 활성 계약 변경 시 building_units.status 자동 갱신
create or replace function public.sync_unit_status()
returns trigger as $$
begin
  if TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and new.status = 'active') then
    update public.building_units set status = 'occupied' where id = new.unit_id;
  elsif TG_OP = 'UPDATE' and new.status in ('expired', 'terminated') then
    -- 해당 호실에 다른 활성 계약 없으면 vacant
    if not exists (
      select 1 from public.owner_contracts
      where unit_id = new.unit_id and status = 'active' and id <> new.id
    ) then
      update public.building_units set status = 'vacant' where id = new.unit_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_owner_contract_change on public.owner_contracts;
create trigger on_owner_contract_change
  after insert or update on public.owner_contracts
  for each row execute function public.sync_unit_status();

-- ── 트리거: owner_contracts → transactions 자동 연동 ────────────────────────
create or replace function public.sync_owner_contract_to_transactions()
returns trigger as $$
declare
  v_unit public.building_units%rowtype;
begin
  select * into v_unit from public.building_units where id = new.unit_id;

  insert into public.transactions (
    building_id, reported_by, contract_type,
    rent, deposit, maintenance,
    floor, area_m2, room_type, unit_number,
    contract_start, contract_end, contract_date,
    source, is_active
  ) values (
    new.building_id, new.owner_id, new.contract_type,
    new.monthly_rent, new.deposit, new.maintenance,
    v_unit.floor, v_unit.area_m2, v_unit.room_type, v_unit.unit_number,
    new.contract_start, new.contract_end,
    coalesce(new.contract_start, current_date),
    'admin',
    new.status = 'active'
  )
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_owner_contract_to_tx on public.owner_contracts;
create trigger on_owner_contract_to_tx
  after insert on public.owner_contracts
  for each row execute function public.sync_owner_contract_to_transactions();

-- ── 조회수 추적 ───────────────────────────────────────────────────────────────
create table if not exists public.listing_views (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        references public.rooms(id) on delete cascade,
  unit_id     uuid        references public.building_units(id) on delete cascade,
  viewer_id   uuid        references public.users(id) on delete set null,
  viewed_at   timestamptz not null default now(),
  -- 비로그인 식별용
  session_id  text
);

create index if not exists idx_listing_views_room_id on public.listing_views (room_id);
create index if not exists idx_listing_views_unit_id on public.listing_views (unit_id);
create index if not exists idx_listing_views_viewed_at on public.listing_views (viewed_at desc);

-- ── conversations — 채팅방 (나중에 기능 구현, 구조만 생성) ─────────────────
create table if not exists public.conversations (
  id           uuid        primary key default gen_random_uuid(),
  type         text        not null default 'direct'
                           check (type in ('direct', 'inquiry')),

  -- 매물 문의 시 연결
  building_id  uuid        references public.buildings(id) on delete set null,
  unit_id      uuid        references public.building_units(id) on delete set null,
  room_id      uuid        references public.rooms(id) on delete set null,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  last_read_at    timestamptz,
  created_at      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references public.users(id) on delete cascade,
  content         text        not null,
  type            text        not null default 'text'
                              check (type in ('text', 'image', 'contract')),
  metadata        jsonb,      -- 이미지 URL, 계약 정보 등
  created_at      timestamptz not null default now()
);

create index if not exists idx_messages_conversation_id on public.messages (conversation_id);
create index if not exists idx_messages_created_at      on public.messages (created_at desc);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.role_requests      enable row level security;
alter table public.owner_buildings    enable row level security;
alter table public.agent_buildings    enable row level security;
alter table public.building_units     enable row level security;
alter table public.owner_contracts    enable row level security;
alter table public.listing_views      enable row level security;
alter table public.conversations      enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages           enable row level security;

-- role_requests
create policy "rr_select_own"   on public.role_requests for select using (auth.uid() = user_id);
create policy "rr_insert_own"   on public.role_requests for insert with check (auth.uid() = user_id);
-- admin은 service role로 처리

-- owner_buildings
create policy "ob_select_owner" on public.owner_buildings for select using (auth.uid() = owner_id);
create policy "ob_insert_owner" on public.owner_buildings for insert with check (auth.uid() = owner_id);
create policy "ob_update_owner" on public.owner_buildings for update using (auth.uid() = owner_id);

-- agent_buildings
create policy "ab_select_agent" on public.agent_buildings for select using (auth.uid() = agent_id);
create policy "ab_insert_agent" on public.agent_buildings for insert with check (auth.uid() = agent_id);
create policy "ab_update_agent" on public.agent_buildings for update using (auth.uid() = agent_id);
create policy "ab_delete_agent" on public.agent_buildings for delete using (auth.uid() = agent_id);

-- building_units: owner + agent + 일반 조회
create policy "bu_select_all"   on public.building_units for select using (true);
create policy "bu_insert_owner" on public.building_units for insert
  with check (exists (
    select 1 from public.owner_buildings ob
    where ob.building_id = building_units.building_id and ob.owner_id = auth.uid()
  ));
create policy "bu_update_owner" on public.building_units for update
  using (exists (
    select 1 from public.owner_buildings ob
    where ob.building_id = building_units.building_id and ob.owner_id = auth.uid()
  ));

-- owner_contracts: owner만
create policy "oc_select_own" on public.owner_contracts for select using (auth.uid() = owner_id);
create policy "oc_insert_own" on public.owner_contracts for insert with check (auth.uid() = owner_id);
create policy "oc_update_own" on public.owner_contracts for update using (auth.uid() = owner_id);

-- listing_views: 누구나 insert, 본인 select
create policy "lv_insert_all"  on public.listing_views for insert with check (true);
create policy "lv_select_own"  on public.listing_views for select
  using (viewer_id is null or auth.uid() = viewer_id);

-- conversations: 멤버만
create policy "conv_select_member" on public.conversations for select
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversations.id and cm.user_id = auth.uid()
  ));
create policy "conv_insert_auth" on public.conversations for insert with check (auth.uid() is not null);

create policy "cm_select_own" on public.conversation_members for select using (auth.uid() = user_id);
create policy "cm_insert_own" on public.conversation_members for insert with check (true);

create policy "msg_select_member" on public.messages for select
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ));
create policy "msg_insert_member" on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
    )
  );
