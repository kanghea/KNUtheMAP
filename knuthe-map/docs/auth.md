# 인증·인가 (Auth)

## 개요
Supabase Auth (Google OAuth) 기반 인증. 역할(role) 기반 인가 시스템.

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `lib/auth-guard.ts` | API 라우트용 인가 헬퍼 (`requireRole`, `requireAuth`) — DB에서 역할 검증 |
| `lib/auth-server.ts` | 서버 컴포넌트용 인증 헬퍼 — React `cache()`로 RSC 렌더 패스 중 Supabase 호출 중복 방지 |
| `lib/role-cookie.ts` | AES-256-GCM 암호화된 HttpOnly 역할 쿠키 — scrypt(N=16384) 키 유도, NEXTAUTH_SECRET 사용 |
| `lib/useRole.ts` | 클라이언트 훅 — DB에서 역할 조회 (HttpOnly 쿠키를 클라이언트에서 신뢰하지 않음) |
| `lib/supabase-server.ts` | SSR용 Supabase 클라이언트 (쿠키 기반 세션 유지) |
| `lib/supabase-browser.ts` | 클라이언트용 Supabase 싱글턴 (Lazy Proxy) |
| `app/auth/callback/route.ts` | OAuth 콜백 — 코드 교환, 온보딩 설정 DB 동기화, 역할 쿠키 암호화 |
| `app/auth/logout/route.ts` | POST — 역할 쿠키 삭제 + Supabase 로그아웃 |
| `app/(auth)/login/page.tsx` | 로그인 플로우 페이지 |
| `components/auth/LoginButton.tsx` | 인증 상태 UI + Supabase 리스너 |

## 인가 패턴

### 역할 체계
| 역할 | 설명 |
|---|---|
| `observer` | Google 로그인만 완료 — 지도 열람, 건물·호실 조회, 리뷰 열람 |
| `tenant` | 학교 이메일 인증 완료 — 리뷰 작성, 북마크, 룸메이트 게시글 |
| `roommate` | 룸메이트 모드 사용자 — 룸메이트 매칭 흐름 |
| `bangbwayo` | 방봐요 모드 사용자 (익명 + 정식) — 방 보러 갈 때 도구 |
| `owner` | 건물주 — 자기 건물 호실·계약 관리 |
| `agent` | 공인중개사 — 담당 건물 매물 관리 |
| `admin` | 내부 관리자 — 전체 데이터 CRUD |

`roommate` / `bangbwayo` 는 권한 의미보다는 **현재 어느 모드를 쓰는가** 를 반영.
같은 컬럼(`users.role`)을 공유하지만 OAuth callback 의 `next` 경로 또는 익명 사인업
시점에 자동 부여된다 (룸메이트 → `next=/roommate`, 방봐요 → `next=/bangbwayo` 또는
`EnsureAnonymousSession`).

### 역할 검증 흐름
1. **쿠키 캐시**: 로그인 시 역할을 AES-256-GCM 암호화해 HttpOnly 쿠키에 저장 → 페이지 로드 시 빠른 UI 렌더링
2. **DB 검증**: API 라우트에서는 항상 `requireRole(supabase, 'admin')` 등으로 DB에서 실제 역할 확인 (쿠키를 신뢰하지 않음)
3. **클라이언트**: `useRole()` 훅이 DB에서 역할을 직접 조회

### API 라우트 인가 예시
```ts
// admin 전용
const { supabase, user } = await requireRole(supabase, 'admin');

// owner 또는 admin
const { supabase, user } = await requireRole(supabase, ['owner', 'admin']);

// 로그인만 확인 (역할 무관)
const { supabase, user } = await requireAuth(supabase);
```

## 주의사항
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 않는다
- 역할 쿠키는 편의를 위한 캐시일 뿐, 인가 판단의 근거는 항상 DB
- OAuth 콜백에서 온보딩 프리퍼런스(학과, 학년 등)를 DB에 동기화
