@AGENTS.md

## 하위 컨텍스트 문서

도메인별 상세 맥락은 `docs/` 디렉토리의 개별 문서를 참조한다.

**작업 전 반드시 해당 도메인의 문서를 Read 도구로 읽은 뒤 작업할 것.**
예) 로그인 관련 작업 → `docs/auth.md` 읽기, 지도 기능 → `docs/map.md` 읽기

| 문서 | 내용 |
|---|---|
| `docs/auth.md` | 인증·인가 구조 (Supabase Auth, 역할 쿠키, 권한 가드) |
| `docs/ui.md` | UI·스타일링 원칙 (Tailwind 4, 다크/라이트 테마, 컴포넌트 구조) |
| `docs/map.md` | 지도 렌더링 (Mapbox GL, GeoJSON, 필터, 레이어) |
| `docs/api.md` | API 라우트 목록 및 인가 패턴 |
| `docs/database.md` | 데이터베이스 스키마 (Supabase PostgreSQL, 테이블·컬럼 정의) |
| `docs/admin.md` | 관리자·건물주·공인중개사 대시보드 구조 |
| `docs/api-guide.md` | 외부 API 키·사용법 가이드 |

## 다크/라이트 모드

이 프로젝트는 다크 모드와 라이트 모드를 모두 지원한다. 새 페이지나 컴포넌트를 만들 때 반드시 양쪽 테마에서 정상 표시되도록 구현한다.

## 코딩 원칙

### 더미 데이터 금지
임의로 만든 숫자·텍스트·데이터를 코드에 절대 넣지 않는다.
- 별점, 리뷰 수, 통계 등은 실제 DB 데이터에서만 가져온다.
- DB 테이블이 아직 없으면 해당 UI 요소를 숨기거나 "준비 중" 상태로 표시한다.
- "일단 임시로" 넣는 더미값도 허용하지 않는다.

### 컴포넌트 재사용 우선
새 페이지나 UI를 만들기 전에 **반드시 `components/shared/` 와 `lib/hooks/` 를 먼저 확인**하고
기존 컴포넌트로 조립할 수 있는지 점검한다.
- 카드/헤더/스켈레톤/메뉴/뱃지/아이콘을 인라인으로 다시 구현하지 않는다.
- 같은 패턴이 2곳 이상에서 반복되면 즉시 `components/shared/` 로 추출한다.
- 새 페이지의 외곽은 항상 `<PageWrapper tok={tok}>` + `<DashboardHeader tok={tok}>` 로 시작.
- 색·여백·radius 등 시각 토큰은 인라인 hex/rgba 가 아니라 `THEME_TOKENS` (서버: `getServerThemeTokens()`, 클라이언트: `useTheme()`) 에서만 가져온다.

상세 인벤토리·prop 시그니처는 `docs/ui.md` 의 "공유 컴포넌트" 섹션 참조.
