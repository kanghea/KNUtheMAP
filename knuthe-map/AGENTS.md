<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 프로젝트 컨텍스트

## 서비스 개요
경북대학교 주변 건물 정보 지도 서비스 (KNUtheMAP).
Mapbox 기반 지도에 건물 폴리곤·마커를 표시하고, 건물 세부 정보·월세 거래·리뷰를 제공한다.

---

## 데이터베이스 (Supabase PostgreSQL)

### 테이블 목록

#### `buildings` — 3,078건
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
- 단독주택 681 · 제2종근린생활시설 158 · 제1종근린생활시설 91 · 공동주택 29 · 근린생활시설 14 · 기타

---

#### `zones` — 7건
구역 단위 테이블. 지도 클러스터링 기준이 된다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 고유 식별자 |
| `osm_id` | text | 구역 번호 (2018~2024) |
| `name` | text | 구역명 |
| `layer_type` | text | 항상 `"zone"` |
| `lat` / `lng` | float | 구역 중심 좌표 |
| `footprint` | jsonb `[[lng,lat],…]` | 구역 경계 폴리곤 |
| `is_active` | bool | 활성 여부 |

현재 구역: **북문구역·텍문구역·경북대학교·서문구역·쪽문구역·정문구역·동문구역**

---

#### `map_layers` — 41건
지도 위 POI(교문, 편의시설 등) 레이어.

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

#### 추가 예정 테이블 (미생성)

| 테이블 | 핵심 컬럼 |
|---|---|
| `users` | `id, email, nickname, avatar_url, created_at` — Supabase Auth 연동 |
| `reviews` | `id, building_id→buildings, user_id→users, rating(1-5), content, created_at` |
| `transactions` | `id, building_id→buildings, contract_type(월세/전세), rent(만원), deposit(만원), area_m2, floor, contract_date` |

---

## 환경변수 & 외부 API 키

| 환경변수 | 서비스 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | DB URL (공개 가능) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | 클라이언트용 익명 키 (RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | 서버/스크립트용 서비스 키 (RLS 우회, **절대 클라이언트 노출 금지**) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox | 지도 렌더링 토큰 |
| `NAVER_MAP_CLIENT_ID` | Naver Cloud | Maps JS API — Road View, 역지오코딩 (헤더: `X-NCP-APIGW-API-KEY-ID`) |
| `NAVER_MAP_CLIENT_SECRET` | Naver Cloud | Maps JS API 시크릿 (헤더: `X-NCP-APIGW-API-KEY`) |
| `VWORLD_KEY` | V-World (국토부) | 도로명주소 건물 정보 조회 (`LT_C_SPBD` 데이터셋) |
| `BLDRGST_API_KEY` | 공공데이터포털 | 건축물대장 정보서비스 — **URL-encoded 상태로 저장**, `URLSearchParams`에 넣으면 이중인코딩 주의 |
| `JUSO_CONFIRM_KEY` | 주소정보 누리집 | 주소 검색 API — 현재 미사용 (좌표제공용 키, 검색용 키와 별도) |
| `KAKAO_REST_API_KEY` | Kakao | REST API 키 — 현재 미사용 |
| `NEXTAUTH_SECRET` | NextAuth.js | 세션 암호화 키 |
| `NEXTAUTH_URL` | NextAuth.js | 콜백 기준 URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | NextAuth Google 로그인 프로바이더 |

자세한 API 사용법은 `docs/api-guide.md` 참조.
