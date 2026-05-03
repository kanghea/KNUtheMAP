# KNUtheMAP 🗺️

> **경북대학교 학생이 만든, 경북대학교 학생을 위한 자취방 커뮤니티 지도**
> *직방·다방이 건물주 편이라면, KNUtheMAP은 학생 편이다.*

<br />

## 프로젝트 소개

경북대 주변 자취방 정보는 흩어져 있고, 공인중개사·건물주의 관점으로만 검색됩니다.
신입생은 어느 문(동문·북문·쪽문)이 어디 있는지도 모른 채 방을 구하고,
야간에 가로등이 없다는 것도, 사잇길이 있다는 것도, 계약하고 나서야 알게 됩니다.

**KNUtheMAP**은 이 문제를 해결하기 위해 만들었습니다.

- 경북대 주변 **3,000여 건물 데이터** 기반의 3D 자취방 지도
- 학과·학년·예산을 입력받는 **온보딩 → 맞춤 매물 추천**
- 학생 시점의 **리뷰·실거래가·옵션 정보**
- 함께 살 사람을 찾는 **룸메이트 매칭**
- 방 보러 갈 때 쓰는 **방봐요(bangbwayo) 도구** — 체크리스트·레이더 차트로 매물 비교
- **건물주·공인중개사·관리자 대시보드** 분리

> 메인 코드베이스는 [`knuthe-map/`](./knuthe-map) 디렉토리에 있습니다.

<br />

## 기술 스택

| 구분 | 기술 |
|---|---|
| Framework | **Next.js 16** (App Router, RSC) |
| Runtime | **React 19** |
| 언어 | **TypeScript 5** |
| 지도 | **Mapbox GL JS v3** (3D 빌딩, GeoJSON 소스) |
| 스타일링 | **Tailwind CSS v4** + 자체 테마 토큰 시스템 (다크/라이트) |
| Backend | **Next.js API Routes** (App Router `route.ts`) |
| Database | **Supabase** (PostgreSQL, RLS, Storage) |
| 인증 | **Supabase Auth** + Google OAuth + AES-256-GCM 암호화 역할 쿠키 |
| 외부 API | V-World, 건축물대장 정보서비스, Naver Maps (Road View) |
| 배포 | Vercel |

> ⚠️ **Next.js 16은 13/14 시절과 다릅니다.** 코드 작성 전 `node_modules/next/dist/docs/` 가이드를 먼저 확인하세요.

<br />

## 주요 기능

### 지도 & 검색
- **3D 건물 지도** — 경북대 주변 3,078개 건물 + footprint 폴리곤 1,978개
- **7개 구역 분리** — 정문 / 동문 / 서문 / 북문 / 쪽문 / 텍문 / 경북대 캠퍼스
- **41개 POI 레이어** — 교문, 편의시설 등
- **동적 필터** — 월세·보증금 범위, 건물 연식, 엘리베이터, 방 종류, 교문까지 거리
- **저장된 필터 + 새 매물 알림** (`saved_filters` 1행/유저, RLS 기반)

### 사용자 플로우
- **온보딩** — 학과/학년 → 예산(월세·보증금) → 건물 연식 → 교문 선호 → 우선순위
- **역할 시스템** — `observer` / `tenant` / `roommate` / `bangbwayo` / `owner` / `agent` / `admin`
- **방봐요 모드** — 익명 세션 지원, 체크리스트로 매물 직접 평가 후 레이더 차트로 비교
- **룸메이트 매칭** — 스와이프 UI, 성별·예산·라이프스타일 기반

### 대시보드
- **건물주(owner)** — 소유 건물·호실 등록, 계약 관리
- **공인중개사(agent)** — 담당 건물 매물·통계
- **관리자(admin)** — 건물·호실 CRUD, 역할 승인, 사용자 관리, 이미지 업로드

<br />

## 프로젝트 구조

```
KNUtheMAP/
└── knuthe-map/                       # Next.js 16 앱 루트
    ├── app/                          # App Router
    │   ├── (auth)/login/             # Google OAuth 로그인
    │   ├── auth/callback/            # OAuth 콜백 → 역할 쿠키 발급
    │   ├── api/                      # REST API (admin / owner / agent / 공개)
    │   ├── map/                      # 메인 지도
    │   ├── onboarding/               # 학과·예산·우선순위 입력
    │   ├── rooms/                    # 호실 목록·상세
    │   ├── buildings/[id]/           # 건물 상세
    │   ├── transactions/             # 실거래가
    │   ├── zones/[name]/             # 구역별 페이지
    │   ├── bangbwayo/                # 방봐요 — sets / map / 탭 UI
    │   ├── roommate/                 # 룸메이트 매칭
    │   ├── owner/                    # 건물주 대시보드
    │   ├── agent/                    # 공인중개사 대시보드
    │   ├── admin/                    # 관리자 대시보드
    │   ├── me/                       # 내 정보
    │   └── settings/theme/           # 테마 설정
    ├── components/
    │   ├── shared/                   # PageWrapper, DashboardHeader, Card, MoneyDrumPicker 등 공통
    │   ├── map/                      # MapView, FilterBar, DynamicFilter, PrefsIsland
    │   ├── auth/                     # LoginButton
    │   ├── onboarding/               # 단계별 Step* 컴포넌트
    │   ├── bangbwayo/                # 체크리스트, RadarChart, SetCardRow
    │   ├── roommate/                 # RoommateSwipe, RoommateChecklist
    │   ├── contracts/                # 계약 카드
    │   └── review/                   # 리뷰 폼/카드
    ├── lib/
    │   ├── supabase.ts               # createServiceClient (RLS 우회)
    │   ├── supabase-server.ts        # SSR 클라이언트
    │   ├── supabase-browser.ts       # 클라이언트 싱글턴
    │   ├── auth-guard.ts             # requireAuth / requireRole
    │   ├── auth-server.ts            # RSC용 인증 헬퍼 (React cache)
    │   ├── role-cookie.ts            # AES-256-GCM 역할 쿠키
    │   ├── theme-tokens.ts           # 다크/라이트 토큰
    │   ├── mapbox.ts                 # KNU_CENTER, MAP_DEFAULTS
    │   ├── filter-context.tsx        # 필터 Context
    │   ├── gates.ts / gate-utils.ts  # 교문 좌표·거리 계산
    │   ├── zone-data.ts              # 구역 데이터
    │   ├── bangbwayo-*.ts            # 방봐요 도메인 로직
    │   └── score-buildings.ts        # 매물 추천 점수
    ├── docs/                         # 도메인별 상세 문서
    ├── scripts/                      # seed / backfill 스크립트
    └── supabase/migrations/          # 24개 마이그레이션 SQL
```

<br />

## 데이터베이스 스키마

상세 정의는 [`knuthe-map/docs/database.md`](./knuthe-map/docs/database.md) 참고.

| 테이블 | 행수 | 설명 |
|---|---|---|
| `buildings` | 3,078 | 건물 원본 + V-World·건축물대장 보강 (footprint, 용도, 연식, 면적, 세대수 등) |
| `zones` | 7 | 구역 폴리곤 (정문·동문·서문·북문·쪽문·텍문·경북대) |
| `map_layers` | 41 | 교문·POI |
| `rooms` | — | 호실 (호수, 층, 월세·보증금, 옵션, 공실 여부) |
| `users` | — | Supabase Auth 연동 (role, grade, dept) |
| `reviews` | — | 건물 리뷰 (별점·내용) |
| `transactions` | — | 월세/전세 실거래 |
| `saved_filters` | — | 사용자별 필터 + 새 매물 알림 (1행/유저) |
| `user_contracts` | — | 임차 계약 |
| `roommate_*` | — | 룸메이트 매칭 |
| `bangbwayo_*` | — | 방봐요 세트·체크리스트 |

마이그레이션은 `knuthe-map/supabase/migrations/001~024_*.sql` 순서로 적용.

<br />

## 인증·권한

Supabase Auth (Google OAuth) + 7단계 역할 시스템.

| 역할 | 의미 |
|---|---|
| `observer` | Google 로그인만 — 지도·건물 열람 |
| `tenant` | 학교 이메일 인증 — 리뷰 작성, 북마크, 룸메이트 |
| `roommate` | 룸메이트 모드 사용자 |
| `bangbwayo` | 방봐요 모드 사용자 (익명 세션 지원) |
| `owner` | 건물주 — 자기 건물·계약 관리 |
| `agent` | 공인중개사 — 담당 매물 관리 |
| `admin` | 내부 관리자 — 전체 CRUD |

권한 검증은 항상 DB 기준 (`requireRole`). 역할 쿠키는 UI 캐시 용도로만 사용하며 인가 판단의 근거가 아닙니다.

<br />

## 시작하기

### 필요 환경
- Node.js 18+
- Supabase 프로젝트
- Mapbox 토큰
- Google Cloud Console (OAuth 클라이언트)
- (선택) V-World, 건축물대장, Naver Maps 키

### 설치 & 실행

```bash
git clone https://github.com/kanghea/knuthemap.git
cd knuthemap/knuthe-map

npm install
cp .env.example .env.local   # 환경변수 채우기
npm run dev                   # http://localhost:3000
```

### 환경변수 (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 서버/스크립트 전용 — 절대 클라이언트 노출 금지

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# NextAuth (역할 쿠키 암호화 키로 재사용)
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Supabase Auth Provider)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 외부 API (선택)
VWORLD_KEY=
BLDRGST_API_KEY=                  # URL-encoded 상태로 저장 (이중인코딩 주의)
NAVER_MAP_CLIENT_ID=
NAVER_MAP_CLIENT_SECRET=
JUSO_CONFIRM_KEY=                 # 현재 미사용
KAKAO_REST_API_KEY=               # 현재 미사용
```

### DB 마이그레이션

Supabase 대시보드 SQL Editor에서 `supabase/migrations/` 내 SQL 파일을 번호 순서대로 실행.

### 데이터 시드 / 백필

```bash
npm run seed                      # full_data.json 시드
npm run backfill:addresses        # 도로명 주소 보강
npm run backfill:vworld           # V-World 건물정보 보강
npm run backfill:bldrgst          # 건축물대장 보강
npm run backfill:names            # 건물명 보강
npm run backfill:use-apr-day      # 사용승인일 보강
npm run collect:area              # 면적 수집
npm run import:area               # 면적 임포트
```

<br />

## 개발 컨벤션

> 자세한 가이드: [`knuthe-map/AGENTS.md`](./knuthe-map/AGENTS.md), [`knuthe-map/CLAUDE.md`](./knuthe-map/CLAUDE.md), `knuthe-map/docs/*`

- **더미 데이터 금지** — 별점·리뷰 수·통계는 실제 DB만, DB가 없으면 "준비 중" 처리
- **컴포넌트 재사용 우선** — 새 UI 작성 전 `components/shared/` 와 `lib/hooks/` 확인
- **시각 토큰** — 인라인 hex 금지. 서버는 `getServerThemeTokens()`, 클라이언트는 `useTheme()`
- **다크/라이트 양쪽 지원** — 모든 페이지·컴포넌트가 두 테마에서 정상 표시
- **외곽 패턴** — 새 페이지는 `<PageWrapper tok={tok}>` + `<DashboardHeader tok={tok}>` 로 시작

### 도메인별 문서

| 문서 | 내용 |
|---|---|
| [`docs/auth.md`](./knuthe-map/docs/auth.md) | 인증·인가 (Supabase Auth, 역할 쿠키, 권한 가드) |
| [`docs/ui.md`](./knuthe-map/docs/ui.md) | UI·스타일링 (Tailwind 4, 테마 토큰, 공유 컴포넌트) |
| [`docs/map.md`](./knuthe-map/docs/map.md) | 지도 (Mapbox GL, GeoJSON, 필터, 레이어) |
| [`docs/api.md`](./knuthe-map/docs/api.md) | API 라우트 목록 & 인가 패턴 |
| [`docs/database.md`](./knuthe-map/docs/database.md) | DB 스키마 (테이블·컬럼) |
| [`docs/admin.md`](./knuthe-map/docs/admin.md) | 관리자·건물주·공인중개사 대시보드 |
| [`docs/api-guide.md`](./knuthe-map/docs/api-guide.md) | 외부 API 키·사용법 |

<br />

## 기여하기

```bash
git checkout -b feat/your-feature-name
git commit -m "feat: 기능 설명"
# PR 생성
```

**커밋 컨벤션**

| 타입 | 설명 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `data` | 자취방 데이터 추가/수정 |
| `docs` | 문서 수정 |
| `refactor` | 리팩토링 |
| `chore` | 설정·의존성 변경 |

<br />

## 만든 사람

경북대학교 학생이 직접 만들었습니다.
"방 구하면서 너무 고생해서 만들었다" 가 전부인 프로젝트입니다.

- 제보·피드백: GitHub Issues
- 경북대 에브리타임 게시판에서도 찾을 수 있습니다

<br />

---

<p align="center">
  <strong>KNUtheMAP</strong> · 경북대 자취방 커뮤니티 지도<br/>
  <sub>건물주 편 말고, 학생 편</sub>
</p>
