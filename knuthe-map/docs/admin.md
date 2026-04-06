<!-- 트리거: 관리자, 건물주, 중개사, 대시보드, admin, owner, agent -->
# 관리자·건물주·공인중개사 대시보드

## 역할별 대시보드

### 관리자 (admin)

경로: `/admin`

| 페이지 | 경로 | 기능 |
|---|---|---|
| 대시보드 홈 | `/admin` | 관리 개요 |
| 건물 관리 | `/admin/buildings` | 건물 CRUD, 이미지 관리, 좌표 설정 |
| 호실 관리 | `/admin/rooms` | 호실 CRUD, 공실 상태 관리 |
| 사용자 관리 | `/admin/users` | 사용자 목록, 역할 변경 |
| 역할 승인 | `/admin/approvals` | 건물주/중개사 역할 승인 |

### 건물주 (owner)

경로: `/me` (OwnerSection 컴포넌트)

- 자기 건물 호실 관리 (`/api/owner/units`)
- 계약 정보 관리

### 공인중개사 (agent)

경로: `/agent`

- 담당 건물 관리

## 핵심 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|---|---|---|
| `BuildingList` | `app/admin/buildings/_components/` | 건물 목록·편집 |
| `BuildingAddModal` | `app/admin/buildings/_components/` | 건물 신규 등록 모달 |
| `RoomList` | `app/admin/rooms/_components/` | 호실 목록·편집 |
| `RoomAddModal` | `app/admin/rooms/_components/` | 호실 신규 등록 모달 |
| `UserList` | `app/admin/users/_components/` | 사용자 목록 |
| `ApprovalList` | `app/admin/approvals/_components/` | 역할 승인 목록 |
| `ImageManager` | `app/admin/_components/` | 이미지 업로드·관리 |
| `OwnerSection` | `app/me/_components/` | 건물주 전용 섹션 |
| `AgentSection` | `app/me/_components/` | 중개사 전용 섹션 |

## 마이페이지 (`/me`)

모든 로그인 사용자가 접근 가능. 역할에 따라 다른 섹션이 표시된다:

- **공통**: 프로필 편집(`ProfileEditor`), 로그아웃(`LogoutButton`), 내 계약(`MyContractsManager`)
- **admin**: `AdminSection` — 관리자 패널 링크
- **owner**: `OwnerSection` — 자기 건물 호실 관리
- **agent**: `AgentSection` — 담당 건물 관리

## 역할 승인 흐름

1. 사용자가 온보딩(`StepRoleRequest`)에서 건물주/중개사 역할 신청
2. 관리자가 `/admin/approvals`에서 승인/거부
3. 승인 시 `users.role` 업데이트 → 다음 로그인부터 적용

## 흔한 실수

- ❌ 관리자 페이지에 `requireRole` 없이 접근 허용 → 일반 사용자가 데이터 수정
  ✅ 관리자 API는 모두 `requireRole(supabase, 'admin')` 적용

- ❌ 건물주가 다른 사람의 건물 호실을 수정 → 데이터 무결성 파괴
  ✅ owner API에서 `user.id === building.owner_id` 검증

- ❌ 역할 승인 없이 직접 `users.role` UPDATE → 보안 우회
  ✅ 역할 변경은 반드시 `/api/admin/approvals` 경유
