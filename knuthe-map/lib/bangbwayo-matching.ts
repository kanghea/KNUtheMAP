/**
 * 방봐요 — 좌표 → 건물 매칭 헬퍼
 *
 * 사진 EXIF GPS 좌표를 받아 가장 가까운 `buildings` row 를 찾는다.
 * 매칭은 단방향(좌표 → 후보 N개) 이며, 호수는 매칭하지 않는다(기획서 §4.2).
 *
 * `lib/gate-utils.ts` 의 `haversineM` 을 재사용해 추가 의존성을 만들지 않는다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { haversineM } from './gate-utils'

/** 매칭 신뢰 반경 — 이보다 멀면 자동 매칭 실패로 처리 */
const MATCH_RADIUS_M = 60

/** 좌표 후보 검색용 박스 폭 — 위·경도 ±0.001 ≈ 약 100m */
const LOOKUP_BOX_DEG = 0.001

export interface MatchedBuilding {
  buildingId: string
  name:       string | null
  address:    string | null
  distanceM:  number
}

/**
 * 좌표 한 쌍에서 가장 가까운 건물 1개를 반환.
 * 반경 밖이거나 후보가 없으면 `null`.
 *
 * 구현 메모: PostGIS 가 없으므로 bounding box 로 1차 거른 뒤 haversine 으로
 * 정확 거리 정렬. `buildings` 가 ~3,000건이라 bounding box 만으로 충분히 빠르다.
 */
export async function matchBuildingByCoord(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
): Promise<MatchedBuilding | null> {
  const { data, error } = await supabase
    .from('buildings')
    .select('id, name, address, lat, lng')
    .gte('lat', lat - LOOKUP_BOX_DEG).lte('lat', lat + LOOKUP_BOX_DEG)
    .gte('lng', lng - LOOKUP_BOX_DEG).lte('lng', lng + LOOKUP_BOX_DEG)
    .eq('is_active', true)
    .limit(20)

  if (error || !data || data.length === 0) return null

  const candidates = data
    .filter((b) => typeof b.lat === 'number' && typeof b.lng === 'number')
    .map((b) => ({
      buildingId: b.id as string,
      name:       (b.name    ?? null) as string | null,
      address:    (b.address ?? null) as string | null,
      distanceM:  haversineM(lat, lng, b.lat as number, b.lng as number),
    }))
    .sort((a, b) => a.distanceM - b.distanceM)

  const closest = candidates[0]
  if (!closest || closest.distanceM > MATCH_RADIUS_M) return null
  return closest
}
