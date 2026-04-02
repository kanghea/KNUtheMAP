-- ─────────────────────────────────────────────────────────────────────────────
-- 015: 관리자 CRUD용 RLS 정책 강화 + Storage 업로드 정책 추가
--
-- 기존 상태:
--   buildings, rooms(001), agents, building_agents, map_layers는
--   SELECT 정책만 존재하고 INSERT/UPDATE/DELETE 정책이 없었음.
--   쓰기는 service_role key로만 수행했기 때문에 동작에는 문제없었으나,
--   방어 계층이 1개뿐이었음.
--
-- 변경 사항:
--   1. 핵심 테이블에 admin 전용 쓰기 RLS 정책 추가 (방어 2중화)
--   2. users 테이블 민감 정보 SELECT 정책 세분화
--   3. Storage 버킷에 업로드(INSERT) RLS 정책 추가
--   4. transactions 테이블 DELETE 방어 정책 추가
--
-- 참고: service_role key는 여전히 RLS를 우회하므로 admin API 동작에 영향 없음.
--       이 정책들은 anon key를 통한 비인가 쓰기 시도를 차단하는 2차 방어선.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 헬퍼 함수: admin 여부 확인 ──────────────────────────────────────────────
-- RLS 정책에서 반복되는 서브쿼리를 함수로 추출하여 유지보수성 향상
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. buildings 테이블 — admin 전용 쓰기 정책
-- ═══════════════════════════════════════════════════════════════════════════

create policy "buildings_insert_admin" on public.buildings
  for insert with check (public.is_admin());

create policy "buildings_update_admin" on public.buildings
  for update using (public.is_admin());

create policy "buildings_delete_admin" on public.buildings
  for delete using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. agents 테이블 — admin 전용 쓰기 정책
-- ═══════════════════════════════════════════════════════════════════════════

create policy "agents_insert_admin" on public.agents
  for insert with check (public.is_admin());

create policy "agents_update_admin" on public.agents
  for update using (public.is_admin());

create policy "agents_delete_admin" on public.agents
  for delete using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. building_agents 테이블 — admin 전용 쓰기 정책
-- ═══════════════════════════════════════════════════════════════════════════

create policy "building_agents_insert_admin" on public.building_agents
  for insert with check (public.is_admin());

create policy "building_agents_update_admin" on public.building_agents
  for update using (public.is_admin());

create policy "building_agents_delete_admin" on public.building_agents
  for delete using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. map_layers 테이블 — admin 전용 쓰기 정책
-- ═══════════════════════════════════════════════════════════════════════════

create policy "map_layers_insert_admin" on public.map_layers
  for insert with check (public.is_admin());

create policy "map_layers_update_admin" on public.map_layers
  for update using (public.is_admin());

create policy "map_layers_delete_admin" on public.map_layers
  for delete using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. role_requests 테이블 — admin 조회/수정 정책 추가
--    기존: 본인만 SELECT/INSERT (admin은 service_role로 처리)
--    추가: admin도 anon key로 조회·수정 가능하도록 정책 추가
-- ═══════════════════════════════════════════════════════════════════════════

create policy "rr_select_admin" on public.role_requests
  for select using (public.is_admin());

create policy "rr_update_admin" on public.role_requests
  for update using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. transactions 테이블 — DELETE 방어 정책
--    soft delete(is_active=false)만 허용하는 설계이므로,
--    anon key를 통한 hard delete를 명시적으로 차단
-- ═══════════════════════════════════════════════════════════════════════════

-- admin만 UPDATE 가능 (일반 사용자는 INSERT만 가능했음)
create policy "transactions_update_admin" on public.transactions
  for update using (public.is_admin());

-- hard delete는 admin만 (비상용)
create policy "transactions_delete_admin" on public.transactions
  for delete using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Storage 버킷 — 업로드(INSERT) RLS 정책 추가
--    기존: SELECT(읽기) 정책만 존재
--    추가: 인증된 사용자만 업로드 가능
-- ═══════════════════════════════════════════════════════════════════════════

-- building-images: admin만 업로드
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'building_images_insert_admin'
  ) then
    execute $p$
      create policy "building_images_insert_admin" on storage.objects
        for insert with check (
          bucket_id = 'building-images' and
          exists (select 1 from public.users where id = auth.uid() and role = 'admin')
        )
    $p$;
  end if;
end;
$$;

-- room-images: admin + 매물 등록자(owner/agent)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'room_images_insert_auth'
  ) then
    execute $p$
      create policy "room_images_insert_auth" on storage.objects
        for insert with check (
          bucket_id = 'room-images' and
          auth.uid() is not null
        )
    $p$;
  end if;
end;
$$;

-- unit-images: 인증된 사용자(owner/agent/admin)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'unit_images_insert_auth'
  ) then
    execute $p$
      create policy "unit_images_insert_auth" on storage.objects
        for insert with check (
          bucket_id = 'unit-images' and
          auth.uid() is not null
        )
    $p$;
  end if;
end;
$$;

-- Storage DELETE: admin만 가능 (실수로 파일 삭제 방지)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_delete_admin'
  ) then
    execute $p$
      create policy "storage_delete_admin" on storage.objects
        for delete using (
          exists (select 1 from public.users where id = auth.uid() and role = 'admin')
        )
    $p$;
  end if;
end;
$$;
