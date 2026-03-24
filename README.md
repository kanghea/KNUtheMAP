# KNUtheMAP 🗺️

> **경북대학교 학생이 만든, 경북대학교 학생을 위한 자취방 커뮤니티 지도**  
> *직방·다방이 건물주 편이라면, KNUtheMAP은 학생 편이다.*

<br />

## 프로젝트 소개

경북대 주변 자취방 정보는 흩어져 있고, 공인중개사·건물주의 관점으로만 정보를 찾을 수 있습니다. 
신입생은 어느 문(동문·북문·쪽문)이 어디 있는지도 모른 채 방을 구한다.  
야간에 가로등이 없다는 것도, 사잇길이 있다는 것도, 방을 계약하고 나서야 알 수 있습니다. 

**KNUtheMAP**은 이 문제를 해결하기 위해 만들었습니다. 

- 직접 살아본 학생의 리뷰를 중심으로 한 **신뢰할 수 있는 자취방 정보**
- 네이버 지도에 없는 **경북대 실생활 레이어** (교문, 사잇길, 가로등, 짭냥이 출몰지 등)
- 선배가 후배에게 자취 꿀팁을 공유하는 **멘토 커뮤니티**
- 조건을 등록하면 매물을 추천받는 **역경매 시스템** (예정)

<br />

## 스크린샷

> 개발 중 — 스크린샷은 MVP 배포 후 업데이트 예정

<br />

## 기술 스택

| 구분 | 기술 | 선택 이유 |
|---|---|---|
| Frontend | **Next.js 14** (App Router) | SSR·ISR로 지도 초기 로딩 성능 확보 |
| 지도 렌더링 | **Mapbox GL JS** | 3D 빌딩·커스텀 레이어·클러스터링 지원 |
| 스타일링 | **Tailwind CSS** | 빠른 UI 반복 개발 |
| Backend | **Next.js API Routes** | 풀스택 단일 레포 구성 |
| Database | **Supabase** (PostgreSQL) | 실시간 구독·Auth·Storage 통합 |
| 인증 | **NextAuth.js** + Google OAuth | 옵저버/인증 회원 2단계 권한 분리 |
| 이미지 저장 | **Supabase Storage** | 로컬 저장 + DB에 파일 경로만 기록 |
| 배포 | **Vercel** | Next.js 공식 권장, 자동 CI/CD |
| 언어 | **TypeScript** | 타입 안전성 |

<br />

## 주요 기능

### ✅ Phase 1 — MVP (2주 이내)
- [ ] **3D 자취방 지도** — Mapbox 위에 방 정보 마커 클러스터링
- [ ] **방 정보 카드** — 월세·보증금·평수·사진·거리 표시
- [ ] **필터** — 월세 범위, 방 종류, 교문까지 거리
- [ ] **경북대 실생활 레이어** — 동문·북문·쪽문·사잇길·가로등 오버레이
- [ ] **Google 로그인** — 옵저버(열람) / 인증 회원(작성) 권한 분리
- [ ] **리뷰 시스템** / **멘토링 시스템** — 인증 회원만 작성, 누구나 열람 

### 🔜 Phase 2 — 확장
- [ ] 선배 멘토 커뮤니티 (학과별 자취 꿀팁)
- [ ] 룸메이트 구하기 게시판
- [ ] 적정가 분석 ("이 방, 가격이 적당한가?")
- [ ] 짬냥이 출몰지 등 경대 로컬 콘텐츠
- [ ] 역경매 시스템 (조건 등록 → 공인중개사 입찰)

<br />

## 데이터베이스 스키마

```sql
-- 자취방
create table rooms (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  lat         float8 not null,
  lng         float8 not null,
  rent        int not null,         -- 월세 (만원)
  deposit     int not null,         -- 보증금 (만원)
  size_m2     float4,               -- 평수
  room_type   text,                 -- 원룸 / 투룸 / 오피스텔
  images      text[],               -- Supabase Storage 경로 배열
  description text,
  created_at  timestamptz default now()
);

-- 사용자
create table users (
  id          uuid primary key references auth.users,
  role        text default 'observer',   -- observer / verified
  department  text,                       -- 학과
  grade       int,                        -- 학번
  created_at  timestamptz default now()
);

-- 리뷰
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references rooms(id) on delete cascade,
  user_id     uuid references users(id) on delete cascade,
  rating      int check (rating between 1 and 5),
  content     text not null,
  lived_from  date,
  lived_to    date,
  created_at  timestamptz default now()
);

-- 경북대 교문·레이어 포인트
create table map_layers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,         -- 동문 / 북문 / 짬냥이 출몰지 등
  layer_type  text not null,         -- gate / alley / streetlight / mascot
  lat         float8 not null,
  lng         float8 not null,
  description text,
  is_active   boolean default true
);

-- 멘토 게시글 (Phase 2)
create table mentor_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  department  text,
  title       text not null,
  content     text not null,
  created_at  timestamptz default now()
);
```

<br />

## 프로젝트 구조

```
KNUtheMAP/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/                # Google OAuth 로그인 페이지
│   ├── api/
│   │   ├── rooms/                # 자취방 CRUD API
│   │   ├── reviews/              # 리뷰 API
│   │   └── layers/               # 지도 레이어 API
│   ├── map/                      # 메인 지도 페이지
│   └── admin/                    # 관리자 데이터 입력 패널
├── components/
│   ├── map/
│   │   ├── MapView.tsx           # Mapbox 메인 컴포넌트
│   │   ├── RoomMarker.tsx        # 자취방 마커
│   │   ├── RoomCard.tsx          # 방 정보 팝업 카드
│   │   ├── FilterPanel.tsx       # 필터 UI
│   │   └── LayerToggle.tsx       # 레이어 on/off 토글
│   ├── review/
│   │   ├── ReviewList.tsx
│   │   └── ReviewForm.tsx
│   └── ui/                       # 공통 UI 컴포넌트
├── lib/
│   ├── supabase.ts               # Supabase 클라이언트
│   ├── mapbox.ts                 # Mapbox 설정
│   └── auth.ts                   # NextAuth 설정
├── types/
│   └── index.ts                  # 전역 타입 정의
└── scripts/
    └── seed.py                   # 초기 데이터 시딩 스크립트 (Python)
```

<br />

## 시작하기

### 필요 환경
- Node.js 18+
- Python 3.10+ (시딩 스크립트용)
- Supabase 계정
- Mapbox 계정
- Google Cloud Console (OAuth)

### 설치

```bash
git clone https://github.com/your-username/KNUtheMAP.git
cd KNUtheMAP
npm install
```

### 환경 변수 설정

`.env.local` 파일을 루트에 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인

### DB 마이그레이션

Supabase 대시보드 SQL Editor에서 `/supabase/migrations/` 내 SQL 파일을 순서대로 실행

### 초기 데이터 시딩

```bash
cd scripts
pip install -r requirements.txt
python seed.py
```

<br />

## 회원 권한

| 구분 | 가입 방법 | 가능한 기능 |
|---|---|---|
| **옵저버** | Google 로그인 | 지도 열람, 방 정보 조회, 리뷰 열람 |
| **인증 회원** | Google 로그인 + 학교 이메일 인증 | 옵저버 기능 + 리뷰 작성, 룸메이트 게시글, 멘토 게시글 |
| **관리자** | 내부 지정 | 전체 기능 + 방 데이터 직접 입력/수정 |

<br />

## 기여하기

> 경북대 학생이라면 누구나 기여를 환영합니다.

```bash
# 1. 레포 포크
# 2. 브랜치 생성
git checkout -b feat/your-feature-name

# 3. 커밋
git commit -m "feat: 기능 설명"

# 4. PR 생성
```

**커밋 컨벤션**

| 타입 | 설명 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `data` | 자취방 데이터 추가/수정 |
| `docs` | 문서 수정 |
| `refactor` | 리팩토링 |

<br />

## 로드맵

| 단계 | 기간 | 상태 |
|---|---|---|
| Phase 0 — 환경 세팅 + DB 구축 | Day 1 | 🔲 대기 |
| Phase 1 — 지도 + 필터 + 리뷰 MVP | Day 2 ~ 11 | 🔲 대기 |
| Phase 2 — QA + 배포 + 에타 런칭 | Day 12 ~ 14 | 🔲 대기 |
| Phase 3 — 멘토 커뮤니티 + 룸메이트 | TBD | 🔲 대기 |
| Phase 4 — 적정가 분석 + 역경매 | TBD | 🔲 대기 |

<br />

## 만든 사람

경북대학교 학생이 직접 만들었습니다.  
"방 구하면서 너무 고생해서 만들었다" 가 전부인 프로젝트입니다.

- 제보·피드백: [GitHub Issues](https://github.com/your-username/KNUtheMAP/issues)
- 경북대 에브리타임 게시판에서도 찾을 수 있습니다

<br />

---

<p align="center">
  <strong>KNUtheMAP</strong> · 경북대 자취방 커뮤니티 지도<br/>
  <sub>건물주 편 말고, 학생 편</sub>
</p>