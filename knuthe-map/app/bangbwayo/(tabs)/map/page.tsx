// 방봐요 — "투어 지도" 탭.
//
// 사용자가 지금까지 본 모든 트랙(방)의 건물 위치를 마커로 시각화한다. 활성 셋은
// 강조 색, 종료된 셋은 회색 톤으로 색을 구분. 마커 클릭 시 트랙 페이지로 이동.
//
// 좌표 출처:
//   1) 우선  : tracks.building_id → buildings.lat/lng (정확)
//   2) 폴백  : 매칭된 건물 없는 트랙은 첫 번째 사진의 EXIF 좌표(있으면)
// 둘 다 없는 트랙은 지도에 표시할 좌표가 없어 노출에서 제외 — "지도에 표시할 수
// 없는 트랙 N개" 안내 문구로 보강.

import { getServerThemeTokens } from '@/lib/theme-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import TourMapClient, { type TourMarker } from './_client'

interface TrackRow {
  id:                    string
  set_id:                string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
}

interface SetRow {
  id:     string
  status: 'active' | 'ended' | 'results_generated'
  title:  string | null
}

interface BuildingRow {
  id:   string
  name: string | null
  lat:  number
  lng:  number
}

interface PhotoRow {
  track_id: string
  exif_lat: number | null
  exif_lng: number | null
}

export default async function BangbwayoMapPage() {
  const [themeRes, supabase] = await Promise.all([
    getServerThemeTokens(),
    createSupabaseServer(),
  ])
  const { tok } = themeRes

  // 셋 + 트랙 동시 페치
  const [{ data: setsData }, { data: tracksData }] = await Promise.all([
    supabase
      .from('bangbwayo_sets')
      .select('id, status, title'),
    supabase
      .from('bangbwayo_tracks')
      .select('id, set_id, order_index, building_id, building_address_text, unit_number'),
  ])
  const sets   = (setsData   ?? []) as SetRow[]
  const tracks = (tracksData ?? []) as TrackRow[]

  if (tracks.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title="아직 본 방이 없어요"
            description="투어를 시작하고 트랙을 추가하면 여기 지도에 표시돼요."
          />
        </Card>
      </div>
    )
  }

  // 좌표 풀: buildings 의 정확 좌표 + 매칭 안 된 트랙은 사진 EXIF 좌표
  const setMap = new Map(sets.map((s) => [s.id, s] as const))
  const buildingIds = Array.from(new Set(
    tracks.map((t) => t.building_id).filter((id): id is string => !!id),
  ))
  const trackIdsWithoutBuilding = tracks
    .filter((t) => !t.building_id)
    .map((t) => t.id)

  const [bRes, pRes] = await Promise.all([
    buildingIds.length > 0
      ? supabase.from('buildings').select('id, name, lat, lng').in('id', buildingIds)
      : Promise.resolve({ data: [] }),
    trackIdsWithoutBuilding.length > 0
      ? supabase.from('bangbwayo_photos')
          .select('track_id, exif_lat, exif_lng')
          .in('track_id', trackIdsWithoutBuilding)
          .not('exif_lat', 'is', null)
          .not('exif_lng', 'is', null)
      : Promise.resolve({ data: [] }),
  ])
  const buildings = (bRes.data ?? []) as BuildingRow[]
  const photos    = (pRes.data ?? []) as PhotoRow[]
  const buildingMap = new Map(buildings.map((b) => [b.id, b] as const))
  // 트랙별 첫 EXIF — 한 트랙에 여러 사진이 있으면 첫 번째.
  const photoByTrack = new Map<string, { lat: number; lng: number }>()
  for (const p of photos) {
    if (!photoByTrack.has(p.track_id) && p.exif_lat != null && p.exif_lng != null) {
      photoByTrack.set(p.track_id, { lat: p.exif_lat, lng: p.exif_lng })
    }
  }

  const markers: TourMarker[] = []
  let untrackedCount = 0
  for (const t of tracks) {
    let lat: number | null = null
    let lng: number | null = null
    let label: string = `${t.order_index + 1}번째 방`
    if (t.building_id) {
      const b = buildingMap.get(t.building_id) ?? null
      if (b) { lat = b.lat; lng = b.lng; label = b.name ?? label }
    }
    if (lat == null) {
      const p = photoByTrack.get(t.id)
      if (p) { lat = p.lat; lng = p.lng }
    }
    if (lat == null || lng == null) { untrackedCount++; continue }

    const set = setMap.get(t.set_id)
    markers.push({
      trackId: t.id,
      setId:   t.set_id,
      label,
      address: t.building_address_text ?? null,
      unit:    t.unit_number ?? null,
      lat, lng,
      setStatus: set?.status ?? 'ended',
      orderIndex: t.order_index,
    })
  }

  if (markers.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title="지도에 표시할 좌표가 없어요"
            description={`트랙 ${tracks.length}개가 있지만 건물·사진 좌표가 없어 지도 표시가 어려워요. 새 트랙은 주소나 사진 EXIF 가 있으면 자동으로 표시돼요.`}
          />
        </Card>
      </div>
    )
  }

  return (
    <TourMapClient
      tok={tok}
      markers={markers}
      untrackedCount={untrackedCount}
    />
  )
}
