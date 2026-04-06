<!-- 트리거: Mapbox, GeoJSON, 레이어, 폴리곤, 마커, 3D, 지도, MapView -->
# 지도 렌더링 (Map)

## 기술 스택

- **Mapbox GL JS** (`mapbox-gl` v3) — 3D 빌딩, 커스텀 레이어, 클러스터링 지원
- **Three.js** — 3D 효과 보조

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `lib/mapbox.ts` | Mapbox 토큰, 스타일 URL, 초기 좌표, 기본값 |
| `components/map/MapView.tsx` | Mapbox 메인 컴포넌트 |
| `components/map/RoomsMapView.tsx` | 호실 기반 지도 뷰 |
| `components/map/FilterBar.tsx` | 필터 바 UI |
| `components/map/SearchAndFilter.tsx` | 검색 + 필터 통합 |
| `components/map/DynamicFilter.tsx` | 동적 필터 |
| `components/map/PrefsIsland.tsx` | 사용자 설정 아일랜드 (역할 기반 네비게이션 포함) |
| `lib/filter-context.tsx` | 필터 상태 컨텍스트 |
| `lib/gates.ts` / `lib/gate-utils.ts` | 경북대 교문 좌표·거리 계산 |
| `lib/zone-data.ts` | 구역(zone) 데이터 |
| `lib/score-buildings.ts` | 건물 점수 계산 |
| `app/api/layers/route.ts` | 지도 레이어 API |

## 지도 기본값 (`lib/mapbox.ts`)

```typescript
MAPBOX_TOKEN  // process.env.NEXT_PUBLIC_MAPBOX_TOKEN
MAPBOX_STYLE  // 'mapbox://styles/kanghae/cmn4en33v00nc01skhcdsahel'
KNU_CENTER    // [128.6076, 35.8892] — 경북대 북문 기준
MAP_DEFAULTS  // { center, zoom: 15, pitch: 45, bearing: 0 }
```

## 레이어 시스템

`map_layers` 테이블에 경북대 실생활 레이어를 저장한다:
- 교문 (동문, 북문, 쪽문 등)
- 사잇길
- 가로등
- 기타 로컬 콘텐츠

API: `GET /api/layers` → GeoJSON 형태로 반환

## 교문 거리 계산

`lib/gates.ts`에 교문 좌표가 정의되어 있고, `lib/gate-utils.ts`에서 건물과 교문 간 거리를 계산한다.

## 흔한 실수

- ❌ Mapbox 토큰을 하드코딩 → 토큰 노출·갱신 시 깨짐
  ✅ `lib/mapbox.ts`의 `MAPBOX_TOKEN` 상수 사용

- ❌ 지도 초기화 시 좌표를 직접 입력 → KNU_CENTER와 불일치
  ✅ `MAP_DEFAULTS` 객체를 스프레드해서 사용

- ❌ GeoJSON을 클라이언트에서 직접 생성 → DB 데이터와 불일치
  ✅ `/api/layers` 또는 `/api/buildings` API를 통해 서버에서 생성

- ❌ `map.remove()` 호출 누락 → 메모리 누수
  ✅ `useEffect` cleanup에서 반드시 `map.remove()` 호출
