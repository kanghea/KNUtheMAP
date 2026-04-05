# 관리자·건물주·공인중개사 대시보드

## 개요
역할별 전용 대시보드. 각 역할은 자기 권한 범위 내에서만 데이터를 조회·수정할 수 있다.

---

## 관리자 (admin)

### 페이지 구조
| 경로 | 기능 |
|---|---|
| `/admin` | 대시보드 — 대기 승인 수, 전체 사용자 수, 활성 건물 수, 활성 호실 수 |
| `/admin/approvals` | 역할 승인 요청 처리 |
| `/admin/users` | 사용자 역할 변경 |
| `/admin/buildings` | 건물 CRUD |
| `/admin/rooms` | 호실 관리 |

### API
- `GET/POST /api/admin/buildings` — 건물 목록·생성
- `PATCH/DELETE /api/admin/buildings/[id]` — 건물 수정·비활성화
- `GET/POST /api/admin/rooms` — 호실 목록·생성
- `PATCH /api/admin/users` — 사용자 역할 변경
- `GET/PATCH /api/admin/approvals` — 승인 요청 조회·처리
- `POST /api/admin/upload` — 건물 이미지 업로드

### 인가
`requireRole(supabase, 'admin')` — admin 역할만 접근 가능.

---

## 건물주 (owner)

### 페이지 구조
| 경로 | 기능 |
|---|---|
| `/owner` | 대시보드 — 소유 건물 정보, 담당 중개사 표시 |
| `/owner/units` | 호실 관리 (등록·수정) |
| `/owner/contracts` | 계약 관리 |

### API
- `GET /api/owner/buildings` — 소유 건물 목록 (`owner_buildings` 테이블 조인)
- `GET/POST /api/owner/units` — 호실 관리
- `GET /api/owner/contracts` — 계약 목록

### 인가
`requireRole(supabase, ['owner', 'admin'])` — owner 또는 admin만 접근.

---

## 공인중개사 (agent)

### 페이지 구조
| 경로 | 기능 |
|---|---|
| `/agent` | 대시보드 — 관리 건물 수, 활성 매물 수, 최근 건물 목록 |
| `/agent/buildings` | 담당 건물 관리 |
| `/agent/listings` | 매물 목록 관리 |
| `/agent/stats` | 조회수·북마크 통계 |

### 데이터 관계
- `agent_buildings` 테이블로 공인중개사 ↔ 건물 N:N 연결
- 건물 하나를 여러 공인중개사가 담당 가능
- 건물주 직접 연락처(`owner_name`, `owner_phone`)와 병존 가능

### 인가
`requireRole(supabase, ['agent', 'admin'])` — agent 또는 admin만 접근.

---

## 공통 패턴

### 페이지 렌더링
서버 컴포넌트에서 인증 확인 + 데이터 패칭 (Promise.all 병렬) → 클라이언트 컴포넌트에서 인터랙션 처리.

### 통계 카드
대시보드마다 상단에 핵심 지표 카드 표시. 모든 수치는 DB에서 조회 (더미 데이터 금지).
