# knuthe-map

KNUtheMAP의 Next.js 16 앱 루트. 프로젝트 전체 소개는 [상위 README](../README.md) 참고.

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 환경변수 채우기
npm run dev                   # http://localhost:3000
```

## 스크립트

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 실행 |
| `npm run lint` | ESLint |
| `npm run seed` | `full_data.json` 시드 |
| `npm run backfill:addresses` | 도로명 주소 보강 |
| `npm run backfill:vworld` | V-World 건물정보 보강 |
| `npm run backfill:bldrgst` | 건축물대장 보강 |
| `npm run backfill:names` | 건물명 보강 |
| `npm run backfill:use-apr-day` | 사용승인일 보강 |
| `npm run collect:area` | 면적 수집 |
| `npm run diff:area` | 면적 diff |
| `npm run import:area` | 면적 임포트 |

## 개발 컨텍스트

새 작업을 시작하기 전 아래 문서를 먼저 읽으세요.

| 문서 | 내용 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | 서비스 개요, 환경변수, 외부 API |
| [`CLAUDE.md`](./CLAUDE.md) | 개발 원칙 (더미 데이터 금지, 컴포넌트 재사용, 다크/라이트) |
| [`docs/auth.md`](./docs/auth.md) | 인증·인가 |
| [`docs/ui.md`](./docs/ui.md) | UI·스타일링 (Tailwind 4, 테마 토큰) |
| [`docs/map.md`](./docs/map.md) | 지도 (Mapbox GL) |
| [`docs/api.md`](./docs/api.md) | API 라우트 |
| [`docs/database.md`](./docs/database.md) | DB 스키마 |
| [`docs/admin.md`](./docs/admin.md) | 관리자·건물주·공인중개사 대시보드 |
| [`docs/api-guide.md`](./docs/api-guide.md) | 외부 API 키·사용법 |

> ⚠️ Next.js 16은 13/14 시절과 다릅니다. 코드 작성 전 `node_modules/next/dist/docs/` 가이드를 확인하세요.
