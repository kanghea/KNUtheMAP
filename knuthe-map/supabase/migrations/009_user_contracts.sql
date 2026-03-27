-- ─────────────────────────────────────────────────────────────────────────────
-- 009: user_contracts · user_contract_history
-- 유저 실계약 이력 관리 + 건물 실거래 자동 연동
-- ─────────────────────────────────────────────────────────────────────────────

-- ── transactions 컬럼 추가 ────────────────────────────────────────────────────
alter table public.transactions
  add column if not exists unit_number      text,
  add column if not exists user_contract_id uuid;

-- source check constraint 확장 (기존 constraint 교체)
alter table public.transactions
  drop constraint if exists transactions_source_check;
alter table public.transactions
  add constraint transactions_source_check
  check (source in ('user_report', 'review', 'public_data', 'admin', 'user_contract'));

-- ── user_contracts ────────────────────────────────────────────────────────────
create table if not exists public.user_contracts (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references public.users(id) on delete cascade,

  -- 건물 연결 (검색으로 찾은 경우 building_id, 못 찾으면 address_text 직접 입력)
  building_id          uuid        references public.buildings(id) on delete set null,
  address_text         text,        -- building_id 없을 때 직접 입력한 주소

  -- 호실 정보
  unit_number          text,        -- 호수 (e.g. "301호")
  floor                int,
  area_m2              float,
  room_type            text,

  -- 계약 조건
  contract_type        text        not null check (contract_type in ('월세', '전세')),
  deposit              int         not null default 0,   -- 보증금 (만원)
  monthly_rent         int,                              -- 월세 (만원), 전세는 null
  maintenance          int,                              -- 관리비 (만원)

  -- 계약 기간
  contract_start       date,
  contract_end         date,

  -- 연장 연결 (연장 계약이면 이전 계약 참조)
  is_renewal           boolean     not null default false,
  previous_contract_id uuid        references public.user_contracts(id) on delete set null,

  memo                 text,
  is_active            boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_user_contracts_user_id     on public.user_contracts (user_id);
create index if not exists idx_user_contracts_building_id on public.user_contracts (building_id);
create index if not exists idx_user_contracts_unit        on public.user_contracts (building_id, unit_number);

create trigger user_contracts_updated_at
  before update on public.user_contracts
  for each row execute function set_updated_at();

-- ── user_contract_history ────────────────────────────────────────────────────
-- 한 행 = 한 변경 이벤트 (금액 변동 추적)
create table if not exists public.user_contract_history (
  id              uuid        primary key default gen_random_uuid(),
  contract_id     uuid        not null references public.user_contracts(id) on delete cascade,
  user_id         uuid        not null references public.users(id) on delete cascade,

  -- 어떤 액션인지
  action          text        not null
                              check (action in ('created', 'updated', 'renewed', 'ended')),

  -- 변경된 필드만: {"deposit": [500, 600], "monthly_rent": [40, 45]}
  -- created/renewed 때는 null (snapshot으로 전체 확인)
  changed_fields  jsonb,

  -- 변경 시점의 계약 전체 상태 (가격 추이 재현용)
  snapshot        jsonb       not null,

  created_at      timestamptz not null default now()
);

create index if not exists idx_uch_contract_id on public.user_contract_history (contract_id);
create index if not exists idx_uch_user_id     on public.user_contract_history (user_id);
create index if not exists idx_uch_created_at  on public.user_contract_history (created_at desc);

-- ── 트리거: user_contracts INSERT → history 기록 ─────────────────────────────
create or replace function public.user_contract_on_insert()
returns trigger as $$
begin
  insert into public.user_contract_history (contract_id, user_id, action, changed_fields, snapshot)
  values (
    new.id,
    new.user_id,
    case when new.is_renewal then 'renewed' else 'created' end,
    null,
    jsonb_build_object(
      'contract_type',  new.contract_type,
      'deposit',        new.deposit,
      'monthly_rent',   new.monthly_rent,
      'maintenance',    new.maintenance,
      'contract_start', new.contract_start,
      'contract_end',   new.contract_end,
      'unit_number',    new.unit_number,
      'floor',          new.floor,
      'area_m2',        new.area_m2
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_contract_insert on public.user_contracts;
create trigger on_user_contract_insert
  after insert on public.user_contracts
  for each row execute function public.user_contract_on_insert();

-- ── 트리거: user_contracts UPDATE → 변경 필드만 history 기록 ─────────────────
create or replace function public.user_contract_on_update()
returns trigger as $$
declare
  v_changed jsonb := '{}'::jsonb;
  v_action  text  := 'updated';
begin
  -- is_active false로 바뀌면 'ended'
  if new.is_active = false and old.is_active = true then
    v_action := 'ended';
  end if;

  -- 가격 관련 필드 변경 감지
  if new.deposit       is distinct from old.deposit then
    v_changed := v_changed || jsonb_build_object('deposit',      jsonb_build_array(old.deposit,      new.deposit));
  end if;
  if new.monthly_rent  is distinct from old.monthly_rent then
    v_changed := v_changed || jsonb_build_object('monthly_rent', jsonb_build_array(old.monthly_rent, new.monthly_rent));
  end if;
  if new.maintenance   is distinct from old.maintenance then
    v_changed := v_changed || jsonb_build_object('maintenance',  jsonb_build_array(old.maintenance,  new.maintenance));
  end if;
  if new.contract_start is distinct from old.contract_start then
    v_changed := v_changed || jsonb_build_object('contract_start', jsonb_build_array(old.contract_start, new.contract_start));
  end if;
  if new.contract_end  is distinct from old.contract_end then
    v_changed := v_changed || jsonb_build_object('contract_end', jsonb_build_array(old.contract_end, new.contract_end));
  end if;
  if new.unit_number   is distinct from old.unit_number then
    v_changed := v_changed || jsonb_build_object('unit_number',  jsonb_build_array(old.unit_number,  new.unit_number));
  end if;

  -- 변경사항이 없으면 기록 안 함
  if v_changed = '{}'::jsonb and v_action = 'updated' then
    return new;
  end if;

  insert into public.user_contract_history (contract_id, user_id, action, changed_fields, snapshot)
  values (
    new.id,
    new.user_id,
    v_action,
    case when v_changed = '{}'::jsonb then null else v_changed end,
    jsonb_build_object(
      'contract_type',  new.contract_type,
      'deposit',        new.deposit,
      'monthly_rent',   new.monthly_rent,
      'maintenance',    new.maintenance,
      'contract_start', new.contract_start,
      'contract_end',   new.contract_end,
      'unit_number',    new.unit_number,
      'floor',          new.floor,
      'area_m2',        new.area_m2
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_contract_update on public.user_contracts;
create trigger on_user_contract_update
  after update on public.user_contracts
  for each row execute function public.user_contract_on_update();

-- ── 트리거: user_contracts → transactions 자동 동기화 ────────────────────────
-- building_id 있는 경우만 실거래 탭에 반영
create or replace function public.sync_user_contract_to_transactions()
returns trigger as $$
begin
  -- building_id 없으면 동기화 안 함
  if new.building_id is null then
    return new;
  end if;

  -- is_active=false 이면 transactions에서도 비활성화
  if new.is_active = false then
    update public.transactions
      set is_active = false
      where user_contract_id = new.id;
    return new;
  end if;

  -- upsert: user_contract_id 기준
  insert into public.transactions (
    building_id, reported_by, contract_type,
    rent, deposit, maintenance,
    floor, area_m2, room_type, unit_number,
    contract_start, contract_end, contract_date,
    source, user_contract_id, is_active
  ) values (
    new.building_id, new.user_id, new.contract_type,
    new.monthly_rent, new.deposit, new.maintenance,
    new.floor, new.area_m2, new.room_type, new.unit_number,
    new.contract_start, new.contract_end, coalesce(new.contract_start, current_date),
    'user_contract', new.id, new.is_active
  )
  on conflict (user_contract_id) do update set
    contract_type  = excluded.contract_type,
    rent           = excluded.rent,
    deposit        = excluded.deposit,
    maintenance    = excluded.maintenance,
    floor          = excluded.floor,
    area_m2        = excluded.area_m2,
    room_type      = excluded.room_type,
    unit_number    = excluded.unit_number,
    contract_start = excluded.contract_start,
    contract_end   = excluded.contract_end,
    contract_date  = excluded.contract_date,
    is_active      = excluded.is_active;

  return new;
end;
$$ language plpgsql security definer;

-- upsert용 unique constraint
alter table public.transactions
  drop constraint if exists transactions_user_contract_id_key;
alter table public.transactions
  add constraint transactions_user_contract_id_key
  unique (user_contract_id);

drop trigger if exists on_user_contract_sync on public.user_contracts;
create trigger on_user_contract_sync
  after insert or update on public.user_contracts
  for each row execute function public.sync_user_contract_to_transactions();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.user_contracts        enable row level security;
alter table public.user_contract_history enable row level security;

-- user_contracts: 본인만 CRUD
create policy "uc_select_own" on public.user_contracts
  for select using (auth.uid() = user_id);
create policy "uc_insert_own" on public.user_contracts
  for insert with check (auth.uid() = user_id);
create policy "uc_update_own" on public.user_contracts
  for update using (auth.uid() = user_id);
create policy "uc_delete_own" on public.user_contracts
  for delete using (auth.uid() = user_id);

-- user_contract_history: 본인 조회만
create policy "uch_select_own" on public.user_contract_history
  for select using (auth.uid() = user_id);

-- ── 건물별 호수 가격 추이 뷰 ─────────────────────────────────────────────────
create or replace view public.unit_price_history as
select
  t.building_id,
  t.unit_number,
  t.contract_type,
  t.deposit,
  t.rent,
  t.floor,
  t.area_m2,
  t.contract_start,
  t.contract_end,
  t.contract_date,
  t.source
from public.transactions t
where t.is_active = true
  and t.unit_number is not null
order by t.building_id, t.unit_number, t.contract_date;
