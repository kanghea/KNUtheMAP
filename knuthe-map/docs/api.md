<!-- 트리거: API 라우트, 엔드포인트, 인가 패턴, REST, route.ts -->
# API 라우트

## 인가 패턴

모든 보호된 API 라우트는 `lib/auth-guard.ts`의 헬퍼를 사용한다:

```typescript
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireRole } from '@/lib/auth-guard'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response
  // guard.user, guard.role 사용 가능
}
```

- `requireRole(supabase, role)` — 로그인 + 역할 검증 (DB 직접 조회)
- `requireAuth(supabase)` — 로그인만 확인 (역할 무관)

## 응답 형식

- 성공: `NextResponse.json(data)` 또는 `NextResponse.json(data, { status: 201 })`
- 에러: `NextResponse.json({ error: '메시지' }, { status: 4xx/5xx })`

## 엔드포인트 목록

### 공개 API

| Method | 경로 | 설명 |
|---|---|---|
| GET | `/api/buildings` | 건물 목록 조회 |
| GET | `/api/buildings/search` | 건물 검색 |
| GET | `/api/buildings/[id]/transactions` | 건물별 거래 내역 |
| GET | `/api/buildings/[id]/reviews` | 건물별 리뷰 |
| GET | `/api/rooms` | 호실 목록 조회 |
| GET | `/api/layers` | 지도 레이어 (GeoJSON) |

### 인증 필요 API

| Method | 경로 | 필요 역할 | 설명 |
|---|---|---|---|
| GET | `/api/auth/me` | 로그인 | 현재 사용자 정보 |
| POST | `/api/auth/logout` | 로그인 | 로그아웃 |
| GET/POST | `/api/bookmarks/[buildingId]` | 로그인 | 북마크 토글 |
| GET/POST | `/api/user-contracts` | 로그인 | 내 계약 관리 |
| PATCH/DELETE | `/api/user-contracts/[id]` | 로그인 | 계약 수정/삭제 |
| POST | `/api/buildings/[id]/reviews` | 로그인 | 리뷰 작성 |

### 관리자 API (`/api/admin/*`)

| Method | 경로 | 필요 역할 | 설명 |
|---|---|---|---|
| GET | `/api/admin/users` | admin | 사용자 목록 |
| POST | `/api/admin/buildings` | admin | 건물 등록 |
| PATCH/DELETE | `/api/admin/buildings/[id]` | admin | 건물 수정/삭제 |
| POST | `/api/admin/rooms` | admin | 호실 등록 |
| PATCH/DELETE | `/api/admin/rooms/[id]` | admin | 호실 수정/삭제 |
| POST | `/api/admin/upload` | admin | 이미지 업로드 |
| GET/POST | `/api/admin/approvals` | admin | 역할 승인 |
| POST | `/api/admin/geocode` | admin | 주소 → 좌표 변환 |

### 건물주 API

| Method | 경로 | 필요 역할 | 설명 |
|---|---|---|---|
| GET/POST | `/api/owner/units` | owner | 자기 건물 호실 관리 |

## 흔한 실수

- ❌ `requireRole` 없이 API 라우트 생성 → 누구나 접근 가능
  ✅ 보호가 필요한 엔드포인트에는 반드시 `requireRole()` 또는 `requireAuth()` 추가

- ❌ Service Role 키로 클라이언트 요청 처리 → RLS 우회
  ✅ 사용자 요청은 `createSupabaseServer()` (anon key + 쿠키), 관리 작업만 `createServiceClient()`

- ❌ 에러 응답에 DB 에러 메시지를 그대로 노출 → 내부 정보 유출
  ✅ 사용자에게는 일반적 에러 메시지, 서버 로그에만 상세 에러

- ❌ 이 문서에 엔드포인트를 추가하지 않음 → 다음 작업 시 혼란
  ✅ 새 API 라우트 생성 시 반드시 이 테이블에 행 추가
