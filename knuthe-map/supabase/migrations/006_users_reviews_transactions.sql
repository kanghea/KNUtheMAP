-- ─────────────────────────────────────────────────────────────────────────────
-- 006: users · reviews · transactions
-- ─────────────────────────────────────────────────────────────────────────────

-- ── updated_at 자동 갱신 함수 ───────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── users ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  nickname    text,
  avatar_url  text,
  role        text        not null default 'observer'
                          check (role in ('observer', 'admin')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function set_updated_at();

-- Google 로그인 시 public.users 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nickname, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── reviews ──────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id                uuid        primary key default gen_random_uuid(),
  building_id       uuid        not null references buildings(id) on delete cascade,
  user_id           uuid        not null references public.users(id) on delete cascade,

  rating_overall    int         not null check (rating_overall between 1 and 5),
  rating_clean      int         check (rating_clean between 1 and 5),
  rating_noise      int         check (rating_noise between 1 and 5),
  rating_security   int         check (rating_security between 1 and 5),
  rating_transport  int         check (rating_transport between 1 and 5),
  rating_cost       int         check (rating_cost between 1 and 5),

  content           text        not null check (char_length(content) >= 20),
  pros              text,
  cons              text,

  floor             int,
  room_type         text,
  lived_from        date,
  lived_to          date,

  rent              int,
  deposit           int,
  maintenance       int,

  is_anonymous      boolean     default false,
  is_active         boolean     default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_reviews_building_id on reviews (building_id);
create index if not exists idx_reviews_user_id     on reviews (user_id);
create index if not exists idx_reviews_created_at  on reviews (created_at desc);

create unique index if not exists idx_reviews_unique_active
  on reviews (building_id, user_id) where is_active = true;

create trigger reviews_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- ── transactions ─────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid        primary key default gen_random_uuid(),
  building_id     uuid        not null references buildings(id) on delete cascade,
  reported_by     uuid        references public.users(id) on delete set null,
  review_id       uuid        references reviews(id) on delete set null,

  contract_type   text        not null check (contract_type in ('월세', '전세')),
  rent            int,
  deposit         int         not null,
  maintenance     int,

  area_m2         float,
  floor           int,
  room_type       text,

  contract_date   date,
  contract_start  date,
  contract_end    date,

  source          text        not null default 'user_report'
                              check (source in ('user_report', 'review', 'public_data', 'admin')),
  is_active       boolean     default true,
  created_at      timestamptz default now()
);

create index if not exists idx_transactions_building_id   on transactions (building_id);
create index if not exists idx_transactions_contract_date on transactions (contract_date desc);

-- ── 리뷰 작성 시 transactions 자동 삽입 ──────────────────────────────────────
create or replace function public.review_to_transaction()
returns trigger as $$
begin
  if new.deposit is not null then
    insert into public.transactions (
      building_id, reported_by, review_id,
      contract_type, rent, deposit, maintenance,
      floor, room_type, contract_date, source
    ) values (
      new.building_id, new.user_id, new.id,
      case when new.rent is not null and new.rent > 0 then '월세' else '전세' end,
      new.rent, new.deposit, new.maintenance,
      new.floor, new.room_type, coalesce(new.lived_from, current_date),
      'review'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_created_insert_transaction on reviews;
create trigger on_review_created_insert_transaction
  after insert on reviews
  for each row execute function public.review_to_transaction();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.users        enable row level security;
alter table public.reviews      enable row level security;
alter table public.transactions enable row level security;

-- users
create policy "users_select"     on public.users for select using (true);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- reviews
create policy "reviews_select"     on reviews for select using (is_active = true);
create policy "reviews_insert"     on reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on reviews for update using (auth.uid() = user_id);

-- transactions
create policy "transactions_select" on transactions for select using (is_active = true);
create policy "transactions_insert" on transactions
  for insert with check (auth.uid() = reported_by);

-- ── 건물별 평균 평점 뷰 ───────────────────────────────────────────────────────
create or replace view public.building_ratings as
select
  building_id,
  count(*)::int                          as review_count,
  round(avg(rating_overall), 1)::float   as avg_overall,
  round(avg(rating_clean), 1)::float     as avg_clean,
  round(avg(rating_noise), 1)::float     as avg_noise,
  round(avg(rating_security), 1)::float  as avg_security,
  round(avg(rating_transport), 1)::float as avg_transport,
  round(avg(rating_cost), 1)::float      as avg_cost
from reviews
where is_active = true
group by building_id;
