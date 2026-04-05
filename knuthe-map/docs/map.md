# 지도 (Map)

## 개요
Mapbox GL JS v3 기반 3D 건물 지도. GeoJSON 소스로 건물 폴리곤·마커 표시, 실시간 필터링.

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `lib/mapbox.ts` | Mapbox 토큰, 커스텀 스타일 URL, KNU_CENTER 좌표 [128.6076, 35.8892], MAP_DEFAULTS (zoom 15, pitch 45°) |
| `components/map/MapView.tsx` | 메인 Mapbox GL 컴포넌트 — 지도 초기화, 건물 GeoJSON 소스, 게이트 레이어, 건물 클릭 핸들러, 구역 마커 |
| `components/map/DynamicFilter.tsx` | 필터 매칭 로직 (월세 범위, 건물 연식, 엘리베이터, 교문 거리 등) |
| `components/map/FilterBar.tsx` | 필터 UI 컴포넌트 |
| `components/map/PrefsIsland.tsx` | 하단 내비게이션 아일랜드 (역할별 메뉴 + 테마 토글) |
| `lib/filter-context.tsx` | 필터 상태 Context |
| `lib/gate-utils.ts` | 교문 거리 계산 유틸 |
| `lib/gates.ts` | 교문 좌표 데이터 |
| `lib/zone-data.ts` | 구역 데이터 |
| `lib/department-zones.ts` | 학과별 구역 매핑 |
| `app/map/` | 지도 메인 페이지 |

## 데이터 흐름

```
[Supabase] buildings 테이블
    ↓ GET /api/buildings (1000건/페이지, 5분 캐시)
[GeoJSON FeatureCollection]
    ↓ MapView.tsx
[Mapbox GL Source] → setData() on filter change
    ↓
[건물 폴리곤 + 마커 렌더링]
    ↓ 클릭
[건물 상세 카드 / 호실 목록]
```

## 지도 설정
- **중심 좌표**: [128.6076, 35.8892] (경북대학교)
- **기본 줌**: 15
- **기본 피치**: 45° (3D 뷰)
- **커스텀 스타일**: Mapbox Studio 커스텀 스타일 사용

## 레이어 구조
1. **건물 폴리곤**: footprint 데이터 기반 3D 빌딩
2. **건물 마커**: footprint 없는 건물용 포인트 마커
3. **게이트 레이어**: 교문 위치 (파란 원 + 라벨)
4. **구역 마커**: 7개 구역 라벨

## 필터 시스템
- 월세 범위
- 방 종류
- 건물 연식
- 엘리베이터 유무
- 교문까지 거리
- 필터 변경 시 `source.setData()`로 GeoJSON 업데이트
