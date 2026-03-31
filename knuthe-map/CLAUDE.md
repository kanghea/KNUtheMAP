<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# KNUtheMAP — AI 어시스턴트 가이드

경북대학교 주변 학생 전용 원룸 지도 서비스 (KNUtheMAP).
Mapbox 기반 지도에 건물 폴리곤·마커를 표시하고, 건물 세부 정보·월세 거래·리뷰를 제공한다.

---

## 프로젝트 구조

```
KNUtheMAP/                  # Git 루트
└── knuthe-map/             # Next.js 앱 루트 (여기서 npm 명령 실행)
    ├── app/                # App Router 페이지 & API 라우트
    ├── components/         # 재사용 컴포넌트
    ├── lib/                # 유틸리티·훅·타입
    ├── public/             # 정적 에셋
    ├── supabase/           # DB 마이그레이션 SQL
    ├── scripts/            # 데이터 시딩·백필 스크립트
    └── docs/               # API 가이드
```

**중요:** Next.js 앱 루트는 `knuthe-map/` 이다. 모든 `npm run *` 명령은 이 디렉터리에서 실행한다.

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 스타일링 | Tailwind CSS 4 (inline style 병행) |
| 지도 | Mapbox GL JS 3 + Three.js 0.18 (3D 레이어) |
| DB / Auth | Supabase (PostgreSQL + RLS + OAuth) |
| 배포 | Vercel (Turbopack 빌드) |

---

## 코딩 원칙

### 더미 데이터 금지
임의로 만든 숫자·텍스트·데이터를 코드에 절대 넣지 않는다.
- 별점, 리뷰 수, 통계 등은 실제 DB 데이터에서만 가져온다.
- DB 테이블이 아직 없으면 해당 UI 요소를 숨기거나 "준비 중" 상태로 표시한다.
- "일단 임시로" 넣는 더미값도 허용하지 않는다.

### 코드 스타일
- 2칸 들여쓰기, 세미콜론 없음
- 함수형 컴포넌트 + 훅 (클래스 컴포넌트 금지)
- 임포트 경로: `@/` 별칭 사용 (상대 경로 지양)
- 커밋 접두사: `feat:` `fix:` `design:` `security:` `data:` `docs:` `refactor:`

---

## 🎨 테마 시스템 — 페이지 작성 시 필수

모든 페이지는 사용자의 다크/라이트 테마 설정을 반영해야 한다.

### 테마 읽는 방법 (Server Component)

```tsx
import { cookies } from 'next/headers'
import { parsePrefs } from '@/lib/prefs'

export default async function MyPage() {
  const jar = await cookies()
  const raw = jar.get('knu_prefs')?.value
  const prefs = raw ? parsePrefs(raw) : null
  const theme = (prefs?.theme ?? 'dark') as 'dark' | 'light'

  // theme을 토큰으로 변환해서 스타일에 적용
  const tok = MY_THEME[theme]

  return <div style={{ background: tok.pageBg, color: tok.textPrimary }}>...</div>
}
```

### 전역 공통 토큰 사용 (권장)

`lib/theme-tokens.ts`에 정의된 `THEME_TOKENS`를 가져다 쓴다.

```tsx
import { THEME_TOKENS } from '@/lib/theme-tokens'

const tok = THEME_TOKENS[theme]
// tok.pageBg, tok.cardBg, tok.cardBorder, tok.textPrimary, tok.textSecondary ...
```

### 페이지 전용 토큰 (필요 시)

페이지에 특수한 색상이 필요하면 파일 상단에 로컬 상수로 선언한다 (`app/buildings/[id]/page.tsx` 패턴 참고).

```tsx
const MY_THEME = {
  dark:  { pageBg: '#0a0a0a', cardBg: '#111111', textPrimary: '#ffffff', ... },
  light: { pageBg: '#f8fafc', cardBg: '#ffffff',  textPrimary: '#0f172a', ... },
} as const
type Tok = typeof MY_THEME[keyof typeof MY_THEME]
```

### 테마별 핵심 색상 참조

| 토큰 | 다크 | 라이트 |
|---|---|---|
| `pageBg` | `#0a0a0a` | `#f8fafc` |
| `cardBg` | `#111111` | `#ffffff` |
| `cardBorder` | `rgba(255,255,255,0.07)` | `#e2e8f0` |
| `textPrimary` | `#ffffff` | `#0f172a` |
| `textSecondary` | `rgba(255,255,255,0.5)` | `#64748b` |
| `accentColor` | `#2563eb` | `#2563eb` |

### Client Component에서 테마 받기

클라이언트 컴포넌트는 `theme` prop을 부모(Server Component)로부터 전달받는다.

```tsx
// Server Component (page.tsx)
const theme = (prefs?.theme ?? 'dark') as 'dark' | 'light'
return <MyClient theme={theme} />

// Client Component
'use client'
export default function MyClient({ theme }: { theme: 'dark' | 'light' }) {
  const tok = THEME_TOKENS[theme]
  ...
}
```

### 주의사항
- 하드코딩된 `#0a0a0a`, `#111111` 등 다크 고정 색상 사용 금지 (라이트 모드 미지원 됨)
- `zones/[name]/page.tsx`는 아직 테마 미적용 상태 — 수정 시 테마 적용 필수
- 기본값은 항상 `'dark'` (신규 사용자·쿠키 없는 경우)

---

## 인증 & 권한

### 서버에서 사용자 확인

```tsx
import { getServerUser, getServerRole } from '@/lib/auth-server'

const user = await getServerUser()   // null이면 비로그인
const role = await getServerRole()   // 'tenant' | 'owner' | 'agent' | 'admin'
```

### 클라이언트에서 역할 확인

```tsx
import { useRole } from '@/lib/useRole'

const role = useRole()  // HttpOnly 쿠키 기반, XSS 안전
```

### 역할 체계

`tenant(기본)` → `owner(건물주)` → `agent(중개사)` → `admin`

### Supabase 클라이언트 패턴

```tsx
// 서버 (RLS 우회 가능, SUPABASE_SERVICE_ROLE_KEY 필요)
import { createServiceClient } from '@/lib/supabase'
const supabase = createServiceClient()

// 브라우저 (RLS 적용, anon key)
import { createBrowserSupabase } from '@/lib/supabase-browser'
const supabase = createBrowserSupabase()
```

**절대 금지:** `SUPABASE_SERVICE_ROLE_KEY`를 클라이언트 번들에 노출하지 않는다.

---

## 데이터베이스 스키마

### `buildings` — 3,078건 (핵심 테이블)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid PK | 고유 식별자 |
| `osm_id` | text | OpenStreetMap 원본 ID |
| `name` | text | 건물명 |
| `address` | text | 도로명주소 |
| `lat` / `lng` | float | 중심 좌표 (전체 3,078개) |
| `footprint` | jsonb `[[lng,lat],…]` | 건물 외곽 폴리곤 (1,978개) |
| `height_m` | float | 건물 높이 (m) |
| `building_type` | text | OSM 건물 분류 |
| `zone` | text | 소속 구역명 (2,771개 배정) |
| `total_floors` | int | 지상층수 |
| `main_purps_nm` | text | 주용도 |
| `use_apr_day` | text `YYYYMMDD` | 사용승인일 |
| `tot_area` | float | 연면적 (㎡) |
| `hhld_cnt` | int | 세대수 |
| `has_elevator` / `has_parking` | bool | 편의시설 여부 |
| `is_active` | bool | 지도 노출 여부 |

### `zones` — 7건

현재 구역: **북문·텍문·경북대학교·서문·쪽문·정문·동문**

### `map_layers` — 41건

POI 레이어 (교문, 편의시설 등)

### 추가 테이블

`users`, `reviews`, `transactions`, `user_contracts`, `rooms`, `units` — `supabase/migrations/` 참고

---

## API 라우트 패턴

```
app/api/
├── rooms/          GET — GeoJSON 스트림 (s-maxage=60)
├── buildings/      GET — 건물 목록 + 필터
├── buildings/[id]/ GET — 건물 상세 + 리뷰 + 거래내역
├── zones/          GET — 구역 목록
├── layers/         GET — 지도 레이어 POI
└── admin/          POST/PATCH/DELETE — 관리자 전용
```

### 응답 패턴

```ts
// 성공
return NextResponse.json({ type: 'FeatureCollection', features: [...] })

// DB 오류 시 빈 응답 (500 금지 — graceful degradation)
if (error) return NextResponse.json({ type: 'FeatureCollection', features: [] })
```

---

## 파일 & 컴포넌트 컨벤션

- 페이지: `app/**/(route)/page.tsx` — Server Component 기본
- 클라이언트 전용: `_client.tsx` 또는 `'use client'` 상단 선언
- 컴포넌트: `PascalCase.tsx`
- 유틸/훅: `camelCase.ts`, 훅은 `use` 접두사
- 페이지 전용 컴포넌트: `app/[route]/_components/` 하위
- 섹션 구분 주석: `// ── 섹션명 ──────` 패턴 사용

---

## 환경변수

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase DB URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 익명 키 (RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 서비스 키 (**클라이언트 노출 절대 금지**) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox 지도 토큰 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth 세션 |
| `VWORLD_KEY` | V-World API (국토부) |
| `BLDRGST_API_KEY` | 건축물대장 API — **URL-encoded 저장**, URLSearchParams에 넣으면 이중인코딩 주의 |
| `NAVER_MAP_CLIENT_ID` / `NAVER_MAP_CLIENT_SECRET` | Naver Maps (역지오코딩) |

자세한 API 사용법은 `docs/api-guide.md` 참조.

---

## 개발 명령

```bash
# knuthe-map/ 디렉터리에서 실행
npm run dev       # 개발 서버 (Turbopack)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 검사

# 데이터 스크립트
npm run seed                 # 초기 건물 3,078건 시딩
npm run backfill:vworld      # V-World 보강
npm run backfill:bldrgst     # 건축물대장 보강
npm run collect:area         # 건물 외곽선 수집
npm run import:area          # 외곽선 일괄 임포트
```

---

## 보안 요구사항

- **CSRF 보호:** `proxy.ts` 미들웨어에서 Origin/Referer 검증
- **RLS:** 모든 공개 테이블에 `is_active = true` 필터 적용
- **HttpOnly 쿠키:** 역할 정보는 HttpOnly 쿠키로만 관리 (XSS 방지)
- **보안 헤더:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- **서비스 키 격리:** `SUPABASE_SERVICE_ROLE_KEY`는 서버 API 라우트·스크립트에서만 사용

---

## 현재 개발 단계

- **Phase 1 (진행 중):** 핵심 지도 + 필터 + 건물 상세 + 리뷰
- **Phase 2:** 멘토 커뮤니티 + 룸메이트 게시판
- **Phase 3:** 스마트 가격 예측
- **Phase 4:** 역경매 마켓플레이스 (학생 조건 게시 → 중개사 입찰)
