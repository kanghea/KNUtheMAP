<!-- 트리거: 로그인, 회원가입, 역할, 쿠키, 세션, OAuth, 권한, role -->
# 인증·인가 (Auth)

## 인증 방식

Supabase Auth + Google OAuth를 사용한다. NextAuth.js는 세션 암호화 키(`NEXTAUTH_SECRET`)를 role 쿠키 암호화에 재사용하지만, 인증 자체는 Supabase Auth가 담당한다.

## 역할 (Role)

| Role | 설명 | 가능한 기능 |
|---|---|---|
| `tenant` | 기본 사용자 (학생) | 지도 열람, 건물·호실 조회, 리뷰 열람 |
| `owner` | 건물주 | tenant 기능 + 자기 건물 호실 관리 |
| `agent` | 공인중개사 | tenant 기능 + 담당 건물 관리 |
| `admin` | 관리자 | 모든 기능 + 데이터 직접 CRUD |
| `roommate` | 룸메이트 | tenant 기능 + 룸메이트 매칭 |

역할은 DB `users.role` 컬럼이 유일한 정식 출처다.

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `lib/auth-guard.ts` | API Route용 인가 헬퍼 (`requireRole`, `requireAuth`) |
| `lib/auth-server.ts` | RSC용 사용자/역할 조회 (`getServerUser`, `getServerRole`) — `cache()`로 중복 호출 제거 |
| `lib/useRole.ts` | 클라이언트 훅 — DB에서 role 직접 조회, `'use client'` |
| `lib/role-cookie.ts` | AES-256-GCM 암호화 role 쿠키 (`sealRole`, `unsealRole`) — 서버 전용 |
| `lib/supabase-server.ts` | 서버 전용 Supabase 클라이언트 (쿠키 기반) |
| `lib/supabase-browser.ts` | 브라우저 전용 Supabase 클라이언트 (`createBrowserClient`) |
| `lib/supabase.ts` | 범용 클라이언트 + `createServiceClient()` (Service Role 키 사용, 서버 전용) |
| `app/auth/callback/route.ts` | OAuth 콜백 처리 |
| `app/auth/logout/route.ts` | 로그아웃 |
| `app/api/auth/me/route.ts` | 현재 사용자 정보 API |

## 인가 패턴

### API Route에서

```typescript
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireRole } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')    // 또는 ['owner', 'admin']
  if (!guard.ok) return guard.response

  const { user, role } = guard  // 타입 narrowing 완료
  // ...
}
```

### RSC(서버 컴포넌트)에서

```typescript
import { getServerUser, getServerRole } from '@/lib/auth-server'

export default async function Page() {
  const user = await getServerUser()
  const role = await getServerRole()
  // cache()로 layout.tsx + page.tsx 호출 시 네트워크 왕복 1회만
}
```

### 클라이언트 컴포넌트에서

```typescript
import { useRole } from '@/lib/useRole'

function MyComponent() {
  const role = useRole()  // DB에서 직접 조회, HttpOnly 쿠키 → XSS 안전
}
```

## Role 쿠키 흐름

1. 로그인 시 `sealRole(role)` → AES-256-GCM 암호화 → `knu_role` 쿠키 설정
2. 레이아웃 렌더 시 `unsealRole(cookie)` → 복호화 성공 시 즉시 반환 (DB 조회 없음, ~0ms)
3. 복호화 실패(변조·만료·없음) 시 `getServerRole()` 폴백 (DB 조회)
4. 쿠키 옵션: `HttpOnly`, `Secure(production)`, `SameSite=Lax`, `maxAge=24h`

## 흔한 실수

- ❌ `createClient(url, serviceRoleKey)`를 클라이언트 컴포넌트에서 호출 → 키 노출
  ✅ 클라이언트에서는 `createBrowserSupabase()` 사용 (anon key만 사용)

- ❌ `requireRole` 없이 `getSession()`만으로 인가 판단 → 역할 우회 가능
  ✅ API 라우트에서는 항상 `requireRole()` 또는 `requireAuth()` 사용

- ❌ `document.cookie`에서 `knu_role` 읽기 시도 → HttpOnly라 불가능
  ✅ 클라이언트에서 role이 필요하면 `useRole()` 훅 사용

- ❌ `supabase.auth.getSession()`으로 사용자 검증 → JWT 위조 가능
  ✅ `supabase.auth.getUser()`로 서버 검증 (auth-guard.ts가 이미 사용)

- ❌ role을 쿠키/헤더 값으로 신뢰 → 클라이언트가 조작 가능
  ✅ `requireRole()`은 항상 DB에서 role을 직접 조회
