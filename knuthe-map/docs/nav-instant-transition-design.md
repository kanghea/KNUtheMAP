# 네비게이션 즉시 전환 설계서

## 문제 정의

네비게이션 바(PrefsIsland)에서 다른 페이지로 이동할 때 **체감 딜레이 200ms~800ms+** 발생.
사용자가 탭을 누르면 현재 페이지에 "멈춘 것처럼" 보이다가, 서버 데이터 패칭이 끝나야 비로소 전환됨.

## 근본 원인

### Next.js App Router의 서버 컴포넌트 네비게이션 동작

```
[사용자 탭 클릭] → [RSC 요청 → 서버 await] → [응답 수신 → 화면 전환]
                   ^^^^^^^^^^^^^^^^^^^^^^^^
                   이 구간이 "딜레이"로 체감됨
```

현재 프로젝트의 주요 페이지가 **전부 서버 컴포넌트**로 구현되어 있고,
`page.tsx`에서 `await supabase.xxx()` 호출이 완료될 때까지 React가 페이지를 렌더링하지 않음.

### 라우트별 서버 패칭 병목 분석

| 라우트 | 체감 딜레이 | 병목 |
|--------|-----------|------|
| `/` (홈) | 100-300ms | `getServerUser()` + `getServerRole()` + cookies |
| `/map` | 50-150ms | 쿠키 파싱 + redirect (비교적 빠름) |
| `/rooms` | 100-300ms | 클라이언트 컴포넌트이나 `dynamic()` 코드 스플릿 로딩 |
| `/buildings/[id]` | **400-800ms** | 건물 조회 → 주변 건물 → 리뷰+거래 (순차+병렬 혼합) |
| `/me` | 200-400ms | auth → profile → role별 count 쿼리 |
| `/admin` | 200-400ms | auth + profile + 4개 count 병렬 쿼리 |
| `/admin/buildings` | **300-800ms** | 전체 3,078건 buildings fetch (무페이지네이션) |
| `/admin/users` | 200-500ms | 전체 users 테이블 fetch |
| `/owner` | 200-400ms | auth + profile + owner_buildings 중첩 조회 |

---

## 해결 전략

### Phase 1: `loading.tsx` 추가 (즉시 적용 — 이미 완료)

**효과**: 탭 클릭 즉시 로딩 스켈레톤이 표시되어 "멈춤" 느낌 제거
**한계**: 실제 콘텐츠가 아닌 스켈레톤이 보임 (100-800ms간)

이미 모든 라우트에 `loading.tsx` 파일이 추가되어 있음.
공용 스켈레톤 컴포넌트: `components/ui/LoadingSkeleton.tsx`

### Phase 2: 클라이언트 사이드 데이터 패칭 + SWR 캐싱 (핵심)

**목표**: 페이지 셸이 즉시 렌더되고, 데이터는 클라이언트에서 가져오되 캐시를 통해 재방문 시 즉시 표시

#### 2-1. SWR 설치

```bash
npm install swr
```

#### 2-2. 패턴: 서버 컴포넌트 → 클라이언트 컴포넌트 전환

**변환 전** (`/me/page.tsx` — 서버 컴포넌트):
```tsx
// 서버에서 모든 데이터를 await 한 후 렌더
export default async function MePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('...').eq('id', user.id).single()

  // 여기서 200-400ms 대기...
  return <div>...</div>
}
```

**변환 후** (클라이언트 컴포넌트 + API Route + SWR):

**Step A: API Route 생성** (`/app/api/me/route.ts`):
```tsx
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, nickname, avatar_url, grade, dept, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'tenant'
  const service = createServiceClient()

  let extra = {}
  if (role === 'owner' || role === 'agent') {
    const { count } = await service
      .from('rooms').select('id', { count: 'exact', head: true })
      .eq('listed_by', user.id)
    extra = { myRoomsCount: count ?? 0 }
  }
  if (role === 'admin') {
    const [b, r, u] = await Promise.all([
      service.from('buildings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      service.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
      service.from('users').select('id', { count: 'exact', head: true }),
    ])
    extra = { buildingsCount: b.count ?? 0, roomsCount: r.count ?? 0, usersCount: u.count ?? 0 }
  }

  return NextResponse.json({ profile, role, ...extra })
}
```

**Step B: 클라이언트 페이지** (`/app/me/page.tsx`):
```tsx
'use client'

import useSWR from 'swr'
import { useRouter } from 'next/navigation'
// ... 기존 컴포넌트 import

const fetcher = (url: string) => fetch(url).then(r => {
  if (r.status === 401) throw new Error('unauthorized')
  return r.json()
})

export default function MePage() {
  const router = useRouter()
  const { data, error, isLoading } = useSWR('/api/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,  // 30초 동안 중복 요청 방지
  })

  if (error?.message === 'unauthorized') {
    router.replace('/login')
    return null
  }

  // 첫 로딩 시에만 스켈레톤, 이후 캐시에서 즉시 렌더
  if (isLoading && !data) return <MePageSkeleton />

  const { profile, role, myRoomsCount, buildingsCount, roomsCount, usersCount } = data

  return (
    <div>
      {/* 기존 UI 그대로 — profile, role 등 사용 */}
    </div>
  )
}
```

**핵심 포인트**: SWR은 캐시된 데이터를 즉시 반환하고 백그라운드에서 재검증함.
→ 두 번째 방문부터는 **딜레이 0ms**로 이전 데이터가 즉시 표시됨.

#### 2-3. 전환 대상 페이지 우선순위

| 우선순위 | 라우트 | 사유 |
|---------|--------|------|
| 🔴 P0 | `/me` | 네비바에서 가장 자주 접근, 200-400ms 딜레이 |
| 🔴 P0 | `/buildings/[id]` | 가장 긴 딜레이 (400-800ms), 핵심 UX |
| 🟡 P1 | `/admin` | 관리자 대시보드, 4개 count 쿼리 |
| 🟡 P1 | `/owner` | 건물주 대시보드, 중첩 쿼리 |
| 🟢 P2 | `/` (홈) | redirect 로직이 있어 서버 필수 — 부분 전환만 가능 |
| ⚪ Skip | `/map` | 이미 거의 클라이언트 컴포넌트, 딜레이 최소 |
| ⚪ Skip | `/rooms` | 이미 클라이언트 컴포넌트 |

#### 2-4. API Route 목록 (생성 필요)

```
/app/api/me/route.ts              — 프로필 + role별 count
/app/api/buildings/[id]/route.ts  — 건물 상세 + 주변 + 리뷰 + 거래
/app/api/admin/stats/route.ts     — 관리자 대시보드 통계
/app/api/admin/users/route.ts     — 사용자 목록
/app/api/admin/approvals/route.ts — 승인 목록
/app/api/owner/dashboard/route.ts — 건물주 대시보드
```

### Phase 3: 프리페칭으로 딜레이 완전 제거

네비바 탭에 **호버/터치스타트 시 데이터를 미리 로드**하여,
탭을 누를 때 이미 캐시에 데이터가 있는 상태를 만듦.

**PrefsIsland 수정 예시**:
```tsx
import { mutate } from 'swr'

// 네비 아이템에 프리페치 추가
const prefetchMap: Record<string, string> = {
  '/me':    '/api/me',
  '/admin': '/api/admin/stats',
  '/owner': '/api/owner/dashboard',
}

// Link에 onMouseEnter / onTouchStart 추가
<Link
  href={item.href}
  onMouseEnter={() => {
    const api = prefetchMap[item.href]
    if (api) mutate(api, fetch(api).then(r => r.json()))
  }}
  onTouchStart={() => {
    const api = prefetchMap[item.href]
    if (api) mutate(api, fetch(api).then(r => r.json()))
  }}
>
```

이렇게 하면:
1. **탭 호버/터치 시점**에 API 호출 시작 (~200ms 절약)
2. **탭 클릭 시점**에 SWR 캐시에 이미 데이터 있음
3. **페이지 즉시 렌더** (딜레이 0ms)

---

## 전환 시 주의사항

### 인증/권한 체크

서버 컴포넌트의 `redirect('/login')`, `redirect('/')` 등의 인증 로직은
API Route에서 HTTP 상태 코드로 대체해야 함:

```tsx
// API Route
if (!user) return NextResponse.json(null, { status: 401 })
if (role !== 'admin') return NextResponse.json(null, { status: 403 })

// 클라이언트
if (error?.status === 401) router.replace('/login')
if (error?.status === 403) router.replace('/')
```

### SEO 영향

- `/buildings/[id]`는 SEO가 중요할 수 있음
- 필요 시 `generateMetadata()`를 서버에서 유지하되, 페이지 본문만 클라이언트로 전환
- 또는 서버 컴포넌트 유지 + loading.tsx 스켈레톤 조합

### 보안

- API Route에서 반드시 인증 확인 (`supabase.auth.getUser()`)
- 서비스 키는 API Route 서버에서만 사용
- RLS가 적용된 쿼리는 사용자 세션 기반 supabase 클라이언트 사용

---

## 체크리스트

### 즉시 적용 (Phase 1) ✅
- [x] 모든 라우트에 `loading.tsx` 추가
- [x] 공용 스켈레톤 컴포넌트 생성 (`components/ui/LoadingSkeleton.tsx`)

### 단기 (Phase 2) — 예상 작업량: 각 페이지당 1-2시간
- [ ] `swr` 패키지 설치
- [ ] `/api/me` API Route 생성 → `/me` 클라이언트 전환
- [ ] `/api/buildings/[id]` API Route 생성 → `/buildings/[id]` 클라이언트 전환
- [ ] `/api/admin/stats` API Route 생성 → `/admin` 클라이언트 전환
- [ ] `/api/owner/dashboard` API Route 생성 → `/owner` 클라이언트 전환
- [ ] 인증 실패 시 클라이언트 redirect 처리

### 중기 (Phase 3) — 예상 작업량: 2-3시간
- [ ] PrefsIsland에 호버/터치 프리페칭 추가
- [ ] 관리자 하위 페이지 (`/admin/users`, `/admin/buildings` 등) 전환
- [ ] `/admin/buildings` 페이지네이션 추가 (3,078건 전체 로드 해소)

---

## 예상 결과

| 상태 | 첫 방문 | 재방문 |
|------|---------|--------|
| 현재 | 200-800ms 빈 화면 | 200-800ms 빈 화면 |
| Phase 1 (loading.tsx) | 즉시 스켈레톤 → 콘텐츠 | 즉시 스켈레톤 → 콘텐츠 |
| Phase 2 (SWR) | 즉시 스켈레톤 → 콘텐츠 | **즉시 캐시 콘텐츠** (0ms) |
| Phase 3 (프리페치) | **즉시 콘텐츠** (0ms) | **즉시 콘텐츠** (0ms) |
