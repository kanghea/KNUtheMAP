# 데이터베이스 (Supabase PostgreSQL)

## Supabase 클라이언트

| 파일 | 용도 |
|---|---|
| `lib/supabase-server.ts` | SSR용 — 쿠키 기반 세션 유지 |
| `lib/supabase-browser.ts` | 클라이언트용 — Lazy Proxy 싱글턴 |
| `lib/supabase.ts` | 범용 로더 + `createServiceClient()` (service role, RLS 우회) |

## 테이블 스키마

### `buildings` — 3,078건
경북대 주변 건물 원본 데이터. 핵심 테이블.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 고유 식별자 |
| `osm_id` | text | OpenStreetMap 원본 ID |
| `name` | text | 건물명 (건축물대장 또는 V-World 기준) |
| `address` | text | 도로명주소 |
| `lat` / `lng` | float | 중심 좌표 — **전체 3,078개 보유** |
| `footprint` | jsonb `[[lng,lat],…]` | 건물 외곽 폴리곤 — **1,978개 보유** |
| `height_m` | float | 건물 높이 (m) |
| `building_type` | text | OSM 건물 분류 |
| `amenity` / `shop` / `office` / `religion` | text | OSM 부가 태그 |
| `zone` | text | 소속 구역명 (zones.name 참조) — **2,771개 배정** |
| `total_floors` | int | 지상층수 |
| `ugrnd_flr_cnt` | int | 지하층수 |
| `main_purps_nm` | text | 주용도 (단독주택 681, 근린생활시설 258 등) |
| `strct_cd_nm` | text | 구조 (철근콘크리트구조 등) |
| `use_apr_day` | text `YYYYMMDD` | 사용승인일 |
| `tot_area` | float | 연면적 (㎡) |
| `hhld_cnt` | int | 세대수 |
| `ride_use_elvt_cnt` | int | 승용 엘리베이터 수 |
| `has_elevator` / `has_parking` | bool | 편의시설 여부 |
| `bd_mgt_sn` | text | 건축물대장 관리번호 (19자리) — **2,939개 보유** |
| `images` | jsonb `[]` | 건물 사진 URL 배열 |
| `owner_name` / `owner_phone` | text | 건물주 정보 |
| `is_active` | bool | 지도 노출 여부 |
| `vworld_enriched` | bool | V-World 보강 완료 (3,078개) |
| `bldrgst_enriched` | bool | 건축물대장 보강 완료 (2,939개) |
| `juso_enriched` | bool | 주소정보 보강 완료 (미완료) |

**건물 용도 분포 (main_purps_nm)**
단독주택 681 · 제2종근린생활시설 158 · 제1종근린생활시설 91 · 공동주택 29 · 근린생활시설 14 · 기타

---

### `zones` — 7건
구역 단위 테이블. 지도 클러스터링 기준.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 고유 식별자 |
| `osm_id` | text | 구역 번호 |
| `name` | text | 구역명 |
| `layer_type` | text | 항상 `"zone"` |
| `lat` / `lng` | float | 구역 중심 좌표 |
| `footprint` | jsonb `[[lng,lat],…]` | 구역 경계 폴리곤 |
| `is_active` | bool | 활성 여부 |

현재 구역: **북문구역 · 텍문구역 · 경북대학교 · 서문구역 · 쪽문구역 · 정문구역 · 동문구역**

---

### `map_layers` — 41건
지도 위 POI (교문, 편의시설 등).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | 장소명 |
| `layer_type` | text | 분류 (gate 등) |
| `lat` / `lng` | float | 좌표 |
| `description` | text | 설명 |
| `icon` | text | 아이콘 식별자 |
| `zone` | text | 소속 구역 |
| `is_active` | bool | 노출 여부 |

---

### `users`
Supabase Auth 연동 사용자 테이블.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | Supabase Auth uid |
| `email` | text | 이메일 |
| `nickname` | text | 닉네임 |
| `avatar_url` | text | 프로필 이미지 |
| `role` | text | observer / tenant / owner / agent / admin |
| `grade` | int | 학년 (온보딩) |
| `dept` | text | 학과 (온보딩) |
| `created_at` | timestamptz | 가입일 |

---

### `reviews`
건물 리뷰.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `building_id` | uuid FK → buildings | 대상 건물 |
| `user_id` | uuid FK → users | 작성자 |
| `rating` | int (1-5) | 별점 |
| `content` | text | 리뷰 내용 |
| `created_at` | timestamptz | 작성일 |

---

### `transactions`
월세·전세 거래 내역.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | |
| `building_id` | uuid FK → buildings | 대상 건물 |
| `contract_type` | text | 월세 / 전세 |
| `rent` | int | 월세 (만원) |
| `deposit` | int | 보증금 (만원) |
| `area_m2` | float | 면적 (㎡) |
| `floor` | int | 층 |
| `contract_date` | date | 계약일 |

---

## 테이블 관계

```
buildings ──< rooms            (1:N)
buildings ──< reviews          (1:N)
buildings ──< transactions     (1:N)
buildings >──< agents          (N:N, building_agents 중간 테이블)
users ──< reviews              (1:N)
zones ──< buildings            (1:N, zone 컬럼으로 연결)
map_layers                     (독립)
```

## 마이그레이션
`supabase/migrations/` 디렉토리에 순번 SQL 파일로 관리.
예: `007_users_grade_dept.sql` — 온보딩 컬럼 추가.

## RLS 정책
Supabase RLS로 데이터 접근 제어.
- anon key: 제한된 읽기 권한
- service role: RLS 우회 (관리자 스크립트·API 쓰기용)
