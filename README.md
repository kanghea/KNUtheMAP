# KNUtheMAP 🗺️

> **경북대학교 학생이 만든, 경북대 자취방 커뮤니티 지도**
> 직방·다방이 건물주 편이라면, KNUtheMAP은 학생 편입니다.

<br />

## 프로젝트 소개

경북대 주변 자취방 정보는 흩어져 있고, 대부분 공인중개사·건물주의 시선으로만 정리되어 있습니다. 신입생은 동문·북문·쪽문이 어디인지도 모른 채 방을 구하고, 야간에 가로등이 없다는 사실은 계약한 뒤에야 알게 됩니다.

**KNUtheMAP**은 경북대 학생의 실제 경험을 지도 위에 모으는 서비스입니다. Mapbox 3D 지도에 경북대 주변 건물 3,000여 채를 올리고, 직접 살아본 학생의 정보를 함께 보여줍니다.

방을 **찾는** 일부터 보러 **가는** 일, 같이 살 사람을 **구하는** 일, 살면서 생긴 문제를 **해결하는** 일까지 — 자취 전 과정을 하나의 앱에서 다룹니다.

<br />

## 핵심 기능

온보딩에서 학과·학년·성별을 입력한 뒤 고른 모드에 따라 네 갈래 흐름으로 갈라집니다.

### 🗺️ 방보기 — 자취방 지도·검색

- **3D 건물 지도** (`/map`) — Mapbox GL 위에 건물 폴리곤·마커, 교문·POI 레이어, 7개 구역(북문·정문·서문·쪽문·동문·택문·경북대학교)
- **건물·호실·실거래** — `/buildings`, `/rooms`, `/zones`, `/transactions`에서 매물과 월세·전세 거래 내역 조회
- **필터** — 건물 유형, 월세·보증금 범위, 건물 연식, 옵션, 교문까지 거리(분 단위)
- **우선순위 점수화** — 온보딩에서 정한 우선순위 순서로 건물을 점수화해 정렬
- **저장·알림** — 검색 필터를 저장하고 조건에 맞는 새 매물 알림 토글
- **리뷰·북마크·계약 관리** — 인증 회원이 직접 작성·관리

### 📋 방봐요 — 방 보러 갈 때 쓰는 체크리스트

- 방을 보러 다니는 동안 옆에서 함께 쓰는 도구 (`/bangbwayo`)
- **세트(투어) ⊃ 트랙(방 1개) ⊃ 응답(체크리스트) + 사진** 구조
- **표준 5분 체크리스트 7항목** — 첫인상·냄새, 채광, 콘센트, 창문·방충망, 방음, 곰팡이·누수, 수압
- 항목마다 사진을 찍고 4단계(좋음·보통·나쁨·모름)로 평가
- 다 본 뒤 **레이더 차트**로 방들을 한눈에 비교 (교문까지 거리 축 포함)
- 로그인 없이도 익명 세션으로 바로 시작 가능
- *현재 5분 트랙 제공 — 15분·30분 트랙은 예정*

### 👥 룸메이트 — 호환도 기반 매칭

- 기숙사·자취방 룸메이트를 호환도로 찾는 매칭 (`/roommate`)
- 수면 패턴·청결·흡연·생활습관·MBTI 등 **40여 항목 프로필** 작성
- A/B 스와이프로 "무엇이 더 중요한지" 가중치를 수집
- 가중치 + 항목 일치도를 합산한 **호환도(%)** 로 정렬
- 기숙사 / 자취방 탭으로 분리, 기숙사별 필터 제공

### 📨 민원 — "민원 대신 처리해드립니다"

- 자취하며 생긴 건물 관련 민원을 접수하면 관리자가 대신 처리하는 채널 (`/minwon`)
- 입력 — 민원 본문, 사진, 건물 주소, 건물 연락처
- 접수 시점의 사용자 정보(학교·학과·학번·나이·연락처)를 스냅샷으로 저장
- 답변은 문자로 발송
- 관리자는 `/admin/minwon`에서 처리 상태(접수·진행·완료·반려) 관리

### 🛠️ 역할별 대시보드

- **관리자(`/admin`)** — 전체 사용자·건물·호실 관리, 역할 승인, 민원 처리
- **건물주(`/owner`)** — 내 건물·호실·계약 관리
- **공인중개사(`/agent`)** — 담당 건물·매물 관리, 조회·북마크 통계

<br />

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프레임워크 | **Next.js 16** (App Router · Turbopack) |
| 언어 | **TypeScript 5** |
| UI | **React 19** · **Tailwind CSS 4** (커스텀 테마 시스템, 외부 컴포넌트 라이브러리 없음) |
| 지도 | **Mapbox GL JS 3** · **Three.js** (3D 커스텀 레이어) |
| 백엔드 | **Next.js Route Handlers** (REST API) |
| 데이터베이스 | **Supabase PostgreSQL** (Row Level Security) |
| 인증 | **Supabase Auth** + Google OAuth |
| 스토리지 | **Supabase Storage** (건물·매물·민원·아바타 이미지) |
| 배포 | **Vercel** |

다크/라이트 테마를 모두 지원하며, 모바일 퍼스트로 설계되었습니다.

<br />

## 프로젝트 구조

```
KNUtheMAP/
├── README.md
└── knuthe-map/                  # Next.js 앱 (실제 코드)
    ├── app/                     # App Router — 페이지 + API 라우트
    │   ├── (auth)/login/        # 로그인
    │   ├── auth/                # OAuth 콜백 · 로그아웃
    │   ├── api/                 # REST API 라우트
    │   ├── map/ rooms/ buildings/ zones/ transactions/   # 방보기
    │   ├── bangbwayo/           # 방봐요
    │   ├── roommate/ onboarding/                          # 룸메이트 · 온보딩
    │   ├── minwon/              # 민원
    │   ├── admin/ owner/ agent/ # 역할별 대시보드
    │   └── layout.tsx  page.tsx
    ├── components/              # UI 컴포넌트 (shared · map · bangbwayo · roommate · onboarding · review …)
    ├── lib/                     # 도메인 로직 · Supabase 클라이언트 · 테마 토큰 · 유틸
    ├── scripts/                 # 데이터 수집 · 보강 · 시드 스크립트
    ├── supabase/migrations/     # DB 마이그레이션 SQL (001 ~ 025)
    ├── docs/                    # 도메인별 상세 문서
    ├── public/                  # 폰트 · 이미지 · 3D 모델
    └── proxy.ts                 # 보안 헤더 · CSRF 검증 · 세션 리프레시
```

> 도메인별 상세 맥락은 `knuthe-map/docs/`를 참고하세요 — `auth` · `ui` · `map` · `api` · `database` · `admin` · `api-guide`.

<br />

## 시작하기

### 필요 환경

- Node.js 20 이상
- Supabase 프로젝트
- Mapbox 액세스 토큰
- (데이터 보강 시) V-World · 건축물대장 · Naver Maps API 키

### 설치 및 실행

```bash
git clone https://github.com/kanghea/KNUtheMAP.git
cd KNUtheMAP/knuthe-map
npm install
cp .env.example .env.local      # 아래 표를 참고해 값 채우기
npm run dev
```

`http://localhost:3000`에서 확인합니다.

### 데이터베이스 준비

1. Supabase SQL Editor에서 `supabase/migrations/`의 SQL을 **번호 순서대로** 실행
2. 교문·구역·건물 기본 데이터를 시드

```bash
npm run seed
```

<br />

## 환경 변수

`knuthe-map/.env.example`를 복사해 채웁니다.

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트용 익명 키 (RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버·스크립트용 서비스 키 (RLS 우회 — **클라이언트 노출 금지**) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox 지도 렌더링 토큰 |
| `NEXTAUTH_SECRET` | 역할·모드 쿠키 AES-256-GCM 암호화 키 |
| `NEXTAUTH_URL` | 콜백 기준 URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 |
| `VWORLD_KEY` | V-World — 도로명주소 건물 정보 (데이터 보강) |
| `BLDRGST_API_KEY` | 공공데이터포털 건축물대장 정보서비스 (URL-encoded 키 그대로 저장) |
| `NAVER_MAP_CLIENT_ID` / `NAVER_MAP_CLIENT_SECRET` | Naver Maps — 역지오코딩 (데이터 보강) |
| `JUSO_CONFIRM_KEY` · `KAKAO_REST_API_KEY` | 현재 미사용 (예약) |

> 외부 API 키 발급·사용법은 `knuthe-map/docs/api-guide.md`에 정리되어 있습니다.

<br />

## 데이터 파이프라인

경북대 주변 건물 데이터는 공공 API에서 수집·보강합니다. 모든 스크립트는 `knuthe-map/`에서 실행합니다.

| 명령 | 설명 |
|---|---|
| `npm run seed` | 교문·구역·건물 기본 데이터 적재 |
| `npm run collect:area` | V-World에서 지정 영역의 건물 수집 |
| `npm run diff:area` | 수집 결과와 DB를 비교해 신규·중복·충돌 분류 |
| `npm run import:area` | 분류된 신규 건물만 DB에 적재 |
| `npm run backfill:addresses` | 도로명주소 보강 |
| `npm run backfill:names` | 건물명 보강 |
| `npm run backfill:vworld` | V-World 건물 정보(층수·건물관리번호 등) 보강 |
| `npm run backfill:bldrgst` | 건축물대장 정보(사용승인일·면적·세대수 등) 보강 |
| `npm run backfill:use-apr-day` | 사용승인일 보강 |

> `scripts/slice_*.py`는 로딩 화면 러너 마스코트의 애니메이션 프레임을 분할하는 보조 스크립트입니다.

<br />

## 회원 권한

| 역할 | 설명 |
|---|---|
| `observer` | Google 로그인만 완료 — 지도·건물·호실 정보 열람 |
| `tenant` | 학생 인증 회원 — 리뷰·북마크·계약 관리·민원 접수 |
| `roommate` | 룸메이트 모드 사용자 |
| `bangbwayo` | 방봐요 모드 사용자 (익명 세션 포함) |
| `owner` | 건물주 — 자기 건물·호실·계약 관리 |
| `agent` | 공인중개사 — 담당 건물·매물 관리 |
| `admin` | 관리자 — 전체 데이터 CRUD, 역할 승인, 민원 처리 |

`roommate`·`bangbwayo`는 권한이라기보다 **현재 사용 중인 모드**를 나타냅니다. 인가 판단의 근거는 항상 DB이며, 쿠키는 빠른 렌더링을 위한 캐시일 뿐입니다.

<br />

## 데이터베이스

Supabase PostgreSQL에 25개 마이그레이션(`supabase/migrations/001 ~ 025`)으로 스키마를 관리합니다.

- **buildings** (약 3,078건) — 경북대 주변 건물 원본 데이터, 지도의 핵심
- **zones** (7건) — 구역 단위, 지도 클러스터링 기준
- **map_layers** (41건) — 교문·POI 등 지도 위 장소
- **users · reviews · transactions · rooms** — 사용자·리뷰·실거래·호실
- **roommate_profiles** — 룸메이트 매칭 프로필
- **bangbwayo_sets / tracks / responses / photos** — 방봐요 투어 데이터
- **minwons** — 민원 접수 내역
- **saved_filters · user_contracts** — 저장된 검색 필터·내 계약

데이터 접근은 Row Level Security로 제어합니다. 컬럼 정의 등 상세 스키마는 `knuthe-map/docs/database.md`를 참고하세요.

<br />

## 보안

모든 요청은 `proxy.ts`(Next.js 16 프록시 레이어)를 거칩니다.

- **보안 응답 헤더** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, 프로덕션 HSTS
- **CSRF 검증** — API 변경 요청(`POST`/`PATCH`/`PUT`/`DELETE`)의 Origin·Referer를 자기 origin과 대조
- **세션 리프레시** — Supabase 세션이 만료 임박일 때만 갱신
- 역할·모드 쿠키는 AES-256-GCM으로 암호화된 HttpOnly 쿠키이며, 서비스 키는 서버에서만 사용합니다

<br />

## 기여하기

> 경북대 학생이라면 누구나 기여를 환영합니다.

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
| `perf` | 성능 개선 |
| `refactor` | 리팩토링 |
| `data` | 자취방·건물 데이터 추가/수정 |
| `docs` | 문서 수정 |

작업 전 해당 도메인의 `knuthe-map/docs/` 문서를 먼저 읽어주세요. 더미 데이터는 넣지 않으며, 모든 수치는 실제 DB에서 가져옵니다.

<br />

## 만든 사람

경북대학교 학생이 직접 만들었습니다.
"방 구하면서 너무 고생해서 만들었다"가 전부인 프로젝트입니다.

<br />

---

<p align="center">
  <strong>KNUtheMAP</strong> · 경북대 자취방 커뮤니티 지도<br/>
  <sub>건물주 편 말고, 학생 편</sub>
</p>
