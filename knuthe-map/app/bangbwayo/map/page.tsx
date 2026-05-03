// 방봐요 — 투어 지도 (풀스크린).
//
// 방보기의 /map 과 동일한 풀스크린 캔버스 패턴:
//   · PageWrapper / DashboardHeader 미사용 — (tabs) 그룹 밖에서 자체 풀스크린
//   · 좌상단 뒤로가기 + 우상단 메타 chip 만 floating overlay
//   · PrefsIsland(하단 다이나믹 아일랜드)는 root layout 에서 자동 표시
//
// 데이터 흐름은 기존과 동일 — 트랙 → buildings/EXIF 좌표 → 마커.
// 좌표 부족 트랙은 마커 미노출 + floating 안내 chip 으로 알려줌.

import { getServerThemeTokens } from '@/lib/theme-server'
import { createSupabaseServer } from '@/lib/supabase-server'
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

  // 트랙 0개 → 빈 상태도 풀스크린 셸로 일관 (TourMapClient 가 처리)
  if (tracks.length === 0) {
    return <TourMapClient tok={tok} markers={[]} totalTracks={0} untrackedCount={0} />
  }

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

  return (
    <TourMapClient
      tok={tok}
      markers={markers}
      totalTracks={tracks.length}
      untrackedCount={untrackedCount}
    />
  )
}
