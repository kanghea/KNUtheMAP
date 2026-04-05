<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 프로젝트 컨텍스트

## 서비스 개요
경북대학교 주변 건물 정보 지도 서비스 (KNUtheMAP).
Mapbox 기반 지도에 건물 폴리곤·마커를 표시하고, 건물 세부 정보·월세 거래·리뷰를 제공한다.

## 상세 컨텍스트

도메인별 상세 내용은 아래 문서를 참조:

- **인증·인가**: `docs/auth.md`
- **UI·스타일링**: `docs/ui.md`
- **지도**: `docs/map.md`
- **API 라우트**: `docs/api.md`
- **데이터베이스 스키마**: `docs/database.md`
- **관리자 대시보드**: `docs/admin.md`
- **외부 API 가이드**: `docs/api-guide.md`

## 환경변수 & 외부 API 키

| 환경변수 | 서비스 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | DB URL (공개 가능) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | 클라이언트용 익명 키 (RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | 서버/스크립트용 서비스 키 (RLS 우회, **절대 클라이언트 노출 금지**) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox | 지도 렌더링 토큰 |
| `NAVER_MAP_CLIENT_ID` | Naver Cloud | Maps JS API — Road View, 역지오코딩 |
| `NAVER_MAP_CLIENT_SECRET` | Naver Cloud | Maps JS API 시크릿 |
| `VWORLD_KEY` | V-World (국토부) | 도로명주소 건물 정보 조회 |
| `BLDRGST_API_KEY` | 공공데이터포털 | 건축물대장 정보서비스 — **URL-encoded 상태로 저장**, 이중인코딩 주의 |
| `JUSO_CONFIRM_KEY` | 주소정보 누리집 | 주소 검색 API — 현재 미사용 |
| `KAKAO_REST_API_KEY` | Kakao | REST API 키 — 현재 미사용 |
| `NEXTAUTH_SECRET` | NextAuth.js | 세션 암호화 키 |
| `NEXTAUTH_URL` | NextAuth.js | 콜백 기준 URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | NextAuth Google 로그인 프로바이더 |

자세한 API 사용법은 `docs/api-guide.md` 참조.
