<!-- 트리거: 외부 API, 환경변수, 키, Supabase/Mapbox/Naver/Kakao/V-World -->
# 외부 API 가이드 & 환경변수

이 문서가 환경변수의 유일한 정식 출처다. 다른 문서에서 환경변수를 참조할 때는 이 문서를 가리켜라.

## 환경변수 목록

`.env.local` 파일에 설정한다.

### Supabase

| 변수 | 용도 | 공개 여부 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 공개 (NEXT_PUBLIC) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트용 익명 키 (RLS 적용) | 공개 (NEXT_PUBLIC) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버/스크립트용 서비스 키 (RLS 우회) | **서버 전용 — 절대 클라이언트 노출 금지** |

### Mapbox

| 변수 | 용도 | 공개 여부 |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | 지도 렌더링 토큰 | 공개 (NEXT_PUBLIC) |

### Naver Cloud

| 변수 | 용도 | 공개 여부 |
|---|---|---|
| `NAVER_MAP_CLIENT_ID` | Maps JS API — Road View, 역지오코딩 | 서버 전용 |
| `NAVER_MAP_CLIENT_SECRET` | Maps JS API 시크릿 | 서버 전용 |

### 공공 데이터 API

| 변수 | 용도 | 공개 여부 |
|---|---|---|
| `VWORLD_KEY` | V-World (국토부) — 도로명주소 건물 정보 조회 | 서버 전용 |
| `BLDRGST_API_KEY` | 공공데이터포털 — 건축물대장 정보서비스. **URL-encoded 상태로 저장**, 이중인코딩 주의 | 서버 전용 |
| `JUSO_CONFIRM_KEY` | 주소정보 누리집 — 주소 검색 API (현재 미사용) | 서버 전용 |

### Kakao

| 변수 | 용도 | 공개 여부 |
|---|---|---|
| `KAKAO_REST_API_KEY` | Kakao REST API 키 (현재 미사용) | 서버 전용 |

### 인증

| 변수 | 용도 | 공개 여부 |
|---|---|---|
| `NEXTAUTH_SECRET` | 세션 암호화 키 + role 쿠키 암호화 파생 키 | 서버 전용 |
| `NEXTAUTH_URL` | 콜백 기준 URL (`http://localhost:3000`) | 서버 전용 |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | 서버 전용 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 | 서버 전용 |

## 외부 API 사용 현황

### Supabase

- **인증**: Google OAuth 로그인 (`supabase.auth`)
- **DB**: PostgreSQL 직접 쿼리 (`supabase.from('table')`)
- **Storage**: 이미지 업로드 (`supabase.storage`)
- **실시간**: 구독 (현재 미사용)

### Mapbox

- **지도 렌더링**: `mapbox-gl` 라이브러리로 3D 지도 표시
- **커스텀 스타일**: `mapbox://styles/kanghae/cmn4en33v00nc01skhcdsahel`
- **Geocoding**: 주소 → 좌표 변환 (`/api/admin/geocode`)

### Naver Cloud

- **Road View**: 건물 상세 페이지에서 네이버 로드뷰 표시 (`NaverRoadView` 컴포넌트)
- **역지오코딩**: 좌표 → 주소 변환

### V-World (국토부)

- **건물 정보 조회**: 도로명주소 기반 건물 정보 보강
- 스크립트: `scripts/backfill-vworld.ts`

### 공공데이터포털 (건축물대장)

- **건축물대장 조회**: 건물 상세 정보 (용도, 면적 등) 보강
- 스크립트: `scripts/backfill-bldrgst.ts`
- **주의**: `BLDRGST_API_KEY`는 URL-encoded 상태로 `.env.local`에 저장해야 함. 코드에서 다시 encode하면 이중인코딩 오류 발생

## 데이터 보강 스크립트

| 명령어 | 스크립트 | 설명 |
|---|---|---|
| `npm run seed` | `scripts/seed-full-data.ts` | 전체 시드 데이터 삽입 |
| `npm run backfill:vworld` | `scripts/backfill-vworld.ts` | V-World 건물 정보 보강 |
| `npm run backfill:bldrgst` | `scripts/backfill-bldrgst.ts` | 건축물대장 정보 보강 |
| `npm run backfill:addresses` | `scripts/backfill-addresses.ts` | 주소 데이터 보강 |
| `npm run backfill:names` | `scripts/backfill-names.ts` | 건물명 보강 |
| `npm run collect:area` | `scripts/collect-area.ts` | 면적 데이터 수집 |

## 흔한 실수

- ❌ `BLDRGST_API_KEY`를 코드에서 `encodeURIComponent()` 처리 → 이중인코딩
  ✅ `.env.local`에 이미 URL-encoded 상태로 저장되므로 그대로 사용

- ❌ `SUPABASE_SERVICE_ROLE_KEY`를 `NEXT_PUBLIC_` 접두사로 변경 → 클라이언트 노출
  ✅ Service Role 키는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않음

- ❌ 환경변수 목록을 다른 파일(README, AGENTS.md 등)에 중복 기재 → stale 정보 발생
  ✅ 이 문서가 유일한 정식 출처. 다른 파일에서는 "docs/api-guide.md 참조"로 연결

- ❌ Naver/Kakao API 키를 `NEXT_PUBLIC_` 접두사로 노출 → 키 탈취
  ✅ 서버 전용 키는 `NEXT_PUBLIC_` 없이 서버에서만 사용
