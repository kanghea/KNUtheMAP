// 방 목록·지도 공용 필터 매처

import { MapFilters, DEFAULT_FILTERS } from '@/components/map/DynamicFilter'
import { MAJOR_GATES, haversineM, minutesToMaxDistM } from '@/lib/gate-utils'

// DynamicFilter 옵션 문자열 → rooms.options 키 매핑
const OPTION_KEY: Record<string, string> = {
  '에어컨':    'air_conditioner',
  '냉장고':    'refrigerator',
  '세탁기':    'washer',
  '전자레인지': 'microwave',
  '주차장':    'parking',
  '엘리베이터': 'elevator',
  '반려동물':  'pet_allowed',
  '옷장':     'closet',
}

const TYPE_MATCHERS: Record<string, (p: string) => boolean> = {
  '단독주택': (p) => p === '단독주택',
  '공동주택': (p) => p === '공동주택' || p.includes('다세대') || p.includes('연립'),
  '상가':     (p) => p.includes('근린생활') || p.includes('판매'),
  '기타':     (p) => !p.includes('주택') && !p.includes('근린생활') && p !== '',
}

function calcAge(useAprDay: string | null | undefined): number | null {
  if (!useAprDay || useAprDay.length < 4) return null
  const y = parseInt(useAprDay.slice(0, 4))
  return isNaN(y) ? null : new Date().getFullYear() - y
}

// ── GeoJSON Feature 용 (RoomsMapView) ────────────────────────────────

export function roomFeatureMatchesFilters(
  filters: MapFilters,
): (f: GeoJSON.Feature) => boolean {
  const defaultRent    = filters.rentRange[0]    === DEFAULT_FILTERS.rentRange[0]    && filters.rentRange[1]    === DEFAULT_FILTERS.rentRange[1]
  const defaultDeposit = filters.depositRange[0] === DEFAULT_FILTERS.depositRange[0] && filters.depositRange[1] === DEFAULT_FILTERS.depositRange[1]
  const defaultAge     = filters.ageRange[0]     === DEFAULT_FILTERS.ageRange[0]     && filters.ageRange[1]     === DEFAULT_FILTERS.ageRange[1]

  return (feature) => {
    const p = feature.properties ?? {}

    // 건물 종류
    if (filters.buildingType) {
      const matcher = TYPE_MATCHERS[filters.buildingType]
      if (matcher && !matcher(p.main_purps_nm ?? '')) return false
    }

    // 건물 연식
    if (!defaultAge) {
      const age = calcAge(p.use_apr_day)
      if (age === null || age < filters.ageRange[0] || age > filters.ageRange[1]) return false
    }

    // 월세 범위 (월세 매물만 필터링)
    if (!defaultRent && p.contract_type === '월세' && p.monthly_rent != null) {
      if (p.monthly_rent < filters.rentRange[0] || p.monthly_rent > filters.rentRange[1]) return false
    }

    // 보증금 범위
    if (!defaultDeposit) {
      if ((p.deposit ?? 0) < filters.depositRange[0] || (p.deposit ?? 0) > filters.depositRange[1]) return false
    }

    // 방 옵션
    if (filters.options.length > 0) {
      const opts: Record<string, boolean> = p.options ?? {}
      for (const label of filters.options) {
        const key = OPTION_KEY[label]
        if (key && !opts[key]) return false
      }
    }

    // 출입문 도보 거리
    if (filters.gate && filters.gateMinutes) {
      const coords = (feature.geometry as GeoJSON.Point)?.coordinates
      const lat = coords?.[1]
      const lng = coords?.[0]
      if (lat == null || lng == null) return false
      const gateObj = MAJOR_GATES.find((g) => g.name === filters.gate)
      if (!gateObj) return false
      if (haversineM(lat, lng, gateObj.lat, gateObj.lng) > minutesToMaxDistM(filters.gateMinutes)) return false
    }

    return true
  }
}

// ── Room 객체 용 (목록 필터) ──────────────────────────────────────────

export function roomMatchesFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  room: any,
  filters: MapFilters,
): boolean {
  const b = Array.isArray(room.buildings) ? room.buildings[0] : room.buildings

  // 건물 종류
  if (filters.buildingType && b?.main_purps_nm) {
    const matcher = TYPE_MATCHERS[filters.buildingType]
    if (matcher && !matcher(b.main_purps_nm)) return false
  }

  // 건물 연식
  const defaultAge = filters.ageRange[0] === DEFAULT_FILTERS.ageRange[0] && filters.ageRange[1] === DEFAULT_FILTERS.ageRange[1]
  if (!defaultAge && b?.use_apr_day) {
    const age = calcAge(b.use_apr_day)
    if (age === null || age < filters.ageRange[0] || age > filters.ageRange[1]) return false
  }

  // 월세
  const defaultRent = filters.rentRange[0] === DEFAULT_FILTERS.rentRange[0] && filters.rentRange[1] === DEFAULT_FILTERS.rentRange[1]
  if (!defaultRent && room.contract_type === '월세' && room.monthly_rent != null) {
    if (room.monthly_rent < filters.rentRange[0] || room.monthly_rent > filters.rentRange[1]) return false
  }

  // 보증금
  const defaultDeposit = filters.depositRange[0] === DEFAULT_FILTERS.depositRange[0] && filters.depositRange[1] === DEFAULT_FILTERS.depositRange[1]
  if (!defaultDeposit) {
    if ((room.deposit ?? 0) < filters.depositRange[0] || (room.deposit ?? 0) > filters.depositRange[1]) return false
  }

  // 방 옵션
  if (filters.options.length > 0) {
    const opts: Record<string, boolean> = room.options ?? {}
    for (const label of filters.options) {
      const key = OPTION_KEY[label]
      if (key && !opts[key]) return false
    }
  }

  // 출입문 도보 거리
  if (filters.gate && filters.gateMinutes && b?.lat && b?.lng) {
    const gateObj = MAJOR_GATES.find((g) => g.name === filters.gate)
    if (gateObj && haversineM(b.lat, b.lng, gateObj.lat, gateObj.lng) > minutesToMaxDistM(filters.gateMinutes)) return false
  }

  return true
}
