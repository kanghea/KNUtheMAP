# API 라우트

## 개요
Next.js App Router `route.ts` 기반 REST API. 역할(role) 기반 인가로 엔드포인트 보호.

## 엔드포인트 목록

### 공개 (인증 불필요)

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/buildings` | GET | 건물 목록 GeoJSON (1000건/페이지, 5분 캐시) |
| `/api/buildings/search` | GET | 건물 이름·주소 검색 |
| `/api/buildings/[id]/transactions` | GET | 건물 거래 내역 |
| `/api/rooms` | GET | 호실 목록 |
| `/api/layers` | GET | 지도 레이어 (교문, POI 등) |

### 인증 필요 (로그인 사용자)

| 경로 | 메서드 | 최소 역할 | 설명 |
|---|---|---|---|
| `/api/auth/me` | GET | 로그인 | 현재 사용자 프로필 (id, nickname, avatar_url, role) |
| `/api/buildings/[id]/reviews` | GET/POST | tenant | 리뷰 조회/작성 |
| `/api/bookmarks/[buildingId]` | GET/POST/DELETE | tenant | 북마크 관리 |
| `/api/user-contracts` | GET/POST | tenant | 임대 계약 관리 |
| `/api/saved-filters` | GET/PUT/DELETE | 로그인 | 사용자별 방 검색 필터 + 새 매물 알림 토글 (1행/유저) |

### 건물주 (owner)

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/owner/buildings` | GET | 소유 건물 목록 |
| `/api/owner/units` | GET/POST | 호실 관리 |
| `/api/owner/contracts` | GET | 계약 목록 |

### 공인중개사 (agent)

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/agent/*` | 다양 | 담당 건물·매물 관리, 통계 조회 |

### 관리자 (admin)

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/admin/users` | PATCH | 사용자 역할 변경 |
| `/api/admin/buildings` | GET/POST | 건물 CRUD |
| `/api/admin/buildings/[id]` | PATCH/DELETE | 건물 수정/비활성화 |
| `/api/admin/rooms` | GET/POST | 호실 관리 |
| `/api/admin/approvals` | GET/PATCH | 역할 승인 요청 처리 |
| `/api/admin/upload` | POST | 건물 이미지 업로드 |

## 인가 패턴

```ts
// 모든 보호된 API 라우트의 기본 패턴
export async function GET(req: NextRequest) {
  const { supabase, user } = await requireRole(supabase, 'admin');
  // ...
}
```

- `requireAuth()`: 로그인만 확인 (역할 무관)
- `requireRole(supabase, role)`: 특정 역할 필요 (DB에서 검증)
- `requireRole(supabase, [role1, role2])`: 복수 역할 중 하나

## 응답 규칙
- 성공: `NextResponse.json(data)` 또는 `NextResponse.json(data, { status: 201 })`
- 에러: `NextResponse.json({ error: '메시지' }, { status: 4xx })`
- DB 쓰기는 `createServiceClient()` (service role) 사용
