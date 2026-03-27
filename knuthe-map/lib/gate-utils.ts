import { GATES_GEOJSON } from './gates'

export interface Gate {
  id:   number
  name: string
  lat:  number
  lng:  number
}

export const GATES: Gate[] = GATES_GEOJSON.features.map((f) => ({
  id:   f.id as number,
  name: (f.properties as { name: string }).name,
  lat:  (f.geometry as GeoJSON.Point).coordinates[1],
  lng:  (f.geometry as GeoJSON.Point).coordinates[0],
}))

// 필터·온보딩에서 선택 가능한 주요 출입문
export const MAJOR_GATES: Gate[] = ['북문', '정문', '서문', '쪽문', '동문', '택문', '나리문', '누리문']
  .map((n) => GATES.find((g) => g.name === n))
  .filter((g): g is Gate => g !== null && g !== undefined)

// 도보 속도: 70m/분 (약 4.2km/h)
const WALK_M_PER_MIN = 70

/** 직선거리 미터 (Haversine) */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 직선거리 → 도보 분 (실제 경로 보정 ×1.3) */
export function toWalkMinutes(distM: number): number {
  return Math.round((distM * 1.3) / WALK_M_PER_MIN)
}

/** 도보 분 한도 → 최대 직선거리 미터 */
export function minutesToMaxDistM(minutes: number): number {
  return (minutes * WALK_M_PER_MIN) / 1.3
}

export interface GateDistance {
  gate:     Gate
  distM:    number
  minutes:  number
}

/** 특정 좌표에서 모든 문까지 거리, 가까운 순 */
export function gateDistances(lat: number, lng: number): GateDistance[] {
  return GATES
    .map((gate) => {
      const distM = haversineM(lat, lng, gate.lat, gate.lng)
      return { gate, distM, minutes: toWalkMinutes(distM) }
    })
    .sort((a, b) => a.distM - b.distM)
}

/** 가장 가까운 문 */
export function nearestGate(lat: number, lng: number): GateDistance {
  return gateDistances(lat, lng)[0]
}
