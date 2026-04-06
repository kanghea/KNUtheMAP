<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.
<!-- END:nextjs-agent-rules -->

## 커맨드

```
npm run dev        — 개발 서버 (localhost:3000)
npm run build      — 프로덕션 빌드
npm run lint       — ESLint
npm run seed       — DB 시드 데이터 삽입 (scripts/seed-full-data.ts)
```

상세 설치 과정(Node 버전, 환경변수 설정, Supabase 세팅 등)은 `README.md` 참조.
환경변수 목록은 `docs/api-guide.md` 참조.

## 절대 규칙

YOU MUST: 더미 데이터를 절대 넣지 마라. DB에 없으면 UI를 숨기거나 "준비 중" 표시해라.
YOU MUST: 새 페이지·컴포넌트는 다크/라이트 양쪽에서 정상 렌더되게 구현해라. 토큰은 `lib/theme-tokens.ts`의 `THEME_TOKENS` 사용.
NEVER: `SUPABASE_SERVICE_ROLE_KEY`를 클라이언트 코드에서 import하지 마라; 서버 전용 `createServiceClient()`만 사용해라.
NEVER: `getSession()`만으로 인가 판단하지 마라; API 라우트에서는 `requireRole()` 또는 `requireAuth()`를 사용해라.
NEVER: `createClient(url, serviceRoleKey)`를 직접 호출하지 마라; `lib/supabase-server.ts`의 `createSupabaseServer()` 또는 `lib/supabase.ts`의 `createServiceClient()`를 사용해라.

## 도메인 문서

아래 키워드에 해당하는 작업 시, 코드를 쓰기 전에 해당 문서를 Read 도구로 먼저 읽어라.

| 트리거 키워드 | 읽을 문서 |
|---|---|
| 로그인, 회원가입, 역할, 쿠키, 세션, OAuth, 권한, role | `docs/auth.md` |
| Tailwind, 테마 토큰, 컴포넌트 구조, 다크/라이트, ThemeTokens | `docs/ui.md` |
| Mapbox, GeoJSON, 레이어, 폴리곤, 마커, 3D, 지도, MapView | `docs/map.md` |
| API 라우트, 엔드포인트, 인가 패턴, REST, route.ts | `docs/api.md` |
| 테이블, 컬럼, RLS, 마이그레이션, 스키마, Supabase DB | `docs/database.md` |
| 관리자, 건물주, 중개사, 대시보드, admin, owner, agent | `docs/admin.md` |
| 외부 API, 환경변수, 키, Supabase/Mapbox/Naver/Kakao/V-World | `docs/api-guide.md` |

## 새 API 라우트 추가 시

1. `app/api/`에 `route.ts` 생성
2. 인가 가드 추가: `requireRole(supabase, 'admin')` 또는 `requireAuth(supabase)`
3. 응답 형식: 성공 `{ data }` 또는 직접 객체, 에러 `{ error: '메시지' }`
4. `docs/api.md` 엔드포인트 테이블에 행 추가

## 새 페이지 추가 시

1. `lib/theme-tokens.ts`의 다크/라이트 테마 토큰 적용 확인
2. 모바일 뷰포트(375px)에서 레이아웃 깨짐 없는지 확인
3. 로딩 상태(`loading.tsx`) · 에러 상태 처리
4. `<title>` 및 메타데이터 설정 (`metadata` export)

## 새 컴포넌트 추가 시

1. 다크/라이트 양쪽에서 정상 렌더 확인
2. 서버 컴포넌트 vs 클라이언트 컴포넌트 구분 (`'use client'` 필요 여부)
3. Supabase 클라이언트: 서버 → `createSupabaseServer()`, 브라우저 → `createBrowserSupabase()`
