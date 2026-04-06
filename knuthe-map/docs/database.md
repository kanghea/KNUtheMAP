<!-- 트리거: 테이블, 컬럼, RLS, 마이그레이션, 스키마, Supabase DB -->
# 데이터베이스 스키마

## 기술 스택

- **Supabase** (PostgreSQL) — 실시간 구독, Auth, Storage 통합
- 마이그레이션: `supabase/migrations/` 디렉토리 (001 ~ 017)

## 주요 테이블

### buildings (건물)

지도 마커 단위. 좌표(`lat`, `lng`)를 가진다.

| 주요 컬럼 | 설명 |
|---|---|
| `id` | UUID PK |
| `name` | 건물명 |
| `address` | 주소 |
| `lat`, `lng` | 좌표 (Geocoding API로 자동 입력) |
| `zone` | 구역 (동문/북문/쪽문 등) |
| `total_floors` | 총 층수 |
| `main_purps_nm` | 건축물 주용도 |
| `images` | JSONB 이미지 배열 |
| `is_active` | 지도 노출 여부 |
| `vworld_enriched` / `bldrgst_enriched` / `juso_enriched` | 외부 API 보강 여부 플래그 |

### rooms (호실)

buildings 하위 (1:N). 좌표 없음 — 건물 좌표를 사용.

| 주요 컬럼 | 설명 |
|---|---|
| `building_id` | FK → buildings |
| `unit_number` | 호수 |
| `floor` | 층 |
| `room_type` | 원룸/투룸/오피스텔/고시원 |
| `deposit`, `monthly_rent`, `maintenance_fee` | 보증금, 월세, 관리비 |
| `is_vacant` | 공실 여부 |

### users (사용자)

| 주요 컬럼 | 설명 |
|---|---|
| `id` | UUID PK (Supabase Auth UID) |
| `role` | `tenant` / `owner` / `agent` / `admin` / `roommate` |
| `grade` | 학년 |
| `department` | 학과 |

### reviews (리뷰)

사용자의 건물 리뷰. `user_id` + `building_id` 연결.

### transactions (거래 내역)

건물별 실거래 데이터. 공공 API에서 수집.

### user_contracts (내 계약)

사용자가 직접 등록한 계약 정보.

### map_layers (지도 레이어)

경북대 실생활 레이어 (교문, 사잇길, 가로등 등). GeoJSON 형태.

### units (건물주 호실)

건물주가 직접 관리하는 호실 정보. `owner_id` FK.

## 테이블 관계

```
buildings ──< rooms          (1:N)
buildings ──< reviews        (1:N, via user)
buildings ──< transactions   (1:N)
users ──< reviews            (1:N)
users ──< user_contracts     (1:N)
users ──< units              (1:N, owner)
map_layers                   (독립)
```

## 마이그레이션 파일

마이그레이션은 `supabase/migrations/` 디렉토리에 번호순으로 정렬:

- `001_initial_schema.sql` — buildings, agents, building_agents, map_layers
- `006_users_reviews_transactions.sql` — users, reviews, transactions
- `008_rooms.sql` — rooms 테이블
- `009_user_contracts.sql` — 사용자 계약
- `010_roles_units.sql` — 역할 확장 + units
- `015_admin_rls_hardening.sql` — RLS 정책 강화
- `016_roommate.sql` — 룸메이트 기능

새 마이그레이션 추가 시 다음 번호를 사용한다 (현재 마지막: 017).

## Supabase 클라이언트 사용

| 용도 | 파일 | 함수 |
|---|---|---|
| 서버 (API Route, RSC) | `lib/supabase-server.ts` | `createSupabaseServer()` — 쿠키 기반, RLS 적용 |
| 브라우저 | `lib/supabase-browser.ts` | `createBrowserSupabase()` — anon key, RLS 적용 |
| 관리 스크립트/서버 전용 | `lib/supabase.ts` | `createServiceClient()` — Service Role 키, RLS 우회 |

## 흔한 실수

- ❌ `createServiceClient()`를 일반 사용자 요청에 사용 → RLS 전부 우회됨
  ✅ 사용자 요청은 반드시 `createSupabaseServer()` 사용. Service Role은 관리 스크립트·시드 전용

- ❌ 마이그레이션 번호를 건너뛰거나 중복 → 실행 순서 오류
  ✅ 마지막 번호 다음 번호를 순차적으로 사용

- ❌ RLS 정책 없이 테이블 생성 → 모든 사용자가 전체 데이터 접근
  ✅ 새 테이블에는 반드시 RLS 정책 추가 (`015_admin_rls_hardening.sql` 참고)

- ❌ `users.role` 변경을 클라이언트에서 직접 시도 → 권한 에스컬레이션
  ✅ role 변경은 관리자 API(`/api/admin/approvals`)를 통해서만 수행
