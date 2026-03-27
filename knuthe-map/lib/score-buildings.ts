import { haversineM, GATES } from './gate-utils'

export interface ScoreParams {
  priorities: string[]   // e.g. ['dist', 'age', 'size', 'security', 'nearby'] — 중요한 순서
  gate:       string | null
}

// 1~5순위 가중치 (합 = 1.0)
const PRIORITY_WEIGHTS = [0.35, 0.25, 0.18, 0.13, 0.09]

// 우선순위에 없는 차원의 기본 가중치 (균등 분배)
const ALL_DIMS = ['dist', 'age', 'size', 'security', 'nearby'] as const

function getAgeYears(useAprDay: string | null | undefined): number | null {
  if (!useAprDay || useAprDay.length < 4) return null
  const y = parseInt(useAprDay.slice(0, 4))
  return isNaN(y) ? null : new Date().getFullYear() - y
}

function normalize(arr: number[]): number[] {
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  if (max === min) return arr.map(() => 50)
  return arr.map((v) => (100 * (v - min)) / (max - min))
}

export function scoreBuildings(
  features: GeoJSON.Feature[],
  params: ScoreParams,
): GeoJSON.Feature[] {
  if (features.length === 0) return features

  const gateObj = params.gate
    ? (GATES.find((g) => g.name === params.gate) ?? null)
    : null

  // ── 1. 거리 (gate까지 직선 거리, 낮을수록 좋음) ──────────────
  const rawDist = features.map((f) => {
    const coords = (f.geometry as GeoJSON.Point)?.coordinates
    if (!gateObj || !coords) return 0
    return haversineM(coords[1], coords[0], gateObj.lat, gateObj.lng)
  })

  // ── 2. 연식 (낮을수록 좋음) ──────────────────────────────────
  const rawAge = features.map((f) => getAgeYears(f.properties?.use_apr_day) ?? 25)

  // ── 3. 방 크기 (연면적 ÷ 세대수, 높을수록 좋음) ──────────────
  const rawSize = features.map((f) => {
    const p    = f.properties ?? {}
    const area = (p.tot_area as number)  ?? 0
    const hhld = Math.max((p.hhld_cnt as number) ?? 1, 1)
    return area > 0 ? area / hhld : 30  // 데이터 없으면 30㎡ 추정
  })

  // ── 4. 보안 (엘리베이터·세대수·연식 기반 프록시) ─────────────
  const rawSecurity = features.map((f) => {
    const p   = f.properties ?? {}
    let   s   = 0
    if (p.has_elevator)                                  s += 35
    if ((p.ride_use_elvt_cnt as number) >= 2)            s += 15
    if ((p.hhld_cnt as number) >= 5)                     s += 25  // 관리 건물 = 인터폰·CCTV 가능성↑
    const age = getAgeYears(p.use_apr_day)
    if (age !== null && age <= 10)       s += 25
    else if (age !== null && age <= 20)  s += 12
    return Math.min(100, s)
  })

  // ── 5. 주변 편의시설 (300m 내 근린생활 건물 수) ───────────────
  const coords3k = features.map((f) => (f.geometry as GeoJSON.Point)?.coordinates ?? [0, 0])
  const isCommercial = (f: GeoJSON.Feature) => {
    const nm = (f.properties?.main_purps_nm as string) ?? ''
    return nm.includes('근린생활') || nm.includes('판매') ||
           nm.includes('숙박')    || nm.includes('음식')
  }
  const commercialIdx = features.reduce<number[]>((acc, f, i) => {
    if (isCommercial(f)) acc.push(i)
    return acc
  }, [])
  const rawNearby = features.map((_, i) => {
    const [lng, lat] = coords3k[i]
    let cnt = 0
    for (const ci of commercialIdx) {
      const [clng, clat] = coords3k[ci]
      if (Math.abs(clng - lng) > 0.003 || Math.abs(clat - lat) > 0.003) continue
      if (haversineM(lat, lng, clat, clng) <= 300) cnt++
    }
    return cnt
  })

  // ── 정규화 ────────────────────────────────────────────────────
  const dimMap: Record<string, number[]> = {
    dist:     normalize(rawDist.map((d) => -d)),   // 낮을수록 좋음 → 반전
    age:      normalize(rawAge.map((a) => -a)),    // 낮을수록 좋음 → 반전
    size:     normalize(rawSize),
    security: normalize(rawSecurity),
    nearby:   normalize(rawNearby),
  }

  // ── 가중치 계산 ───────────────────────────────────────────────
  const priorities = params.priorities.length > 0 ? params.priorities : [...ALL_DIMS]
  const weights: Record<string, number> = {}
  priorities.forEach((p, i) => { weights[p] = PRIORITY_WEIGHTS[i] ?? 0.05 })
  // 선택 안 된 차원은 균등 잔여 가중치
  const used   = Object.values(weights).reduce((s, w) => s + w, 0)
  const unseen = ALL_DIMS.filter((k) => !(k in weights))
  const each   = unseen.length > 0 ? Math.max(0, (1 - used) / unseen.length) : 0
  unseen.forEach((k) => { weights[k] = each })

  // ── 가중 합산 점수 ───────────────────────────────────────────
  const scores = features.map((_, i) =>
    ALL_DIMS.reduce((sum, k) => sum + (weights[k] ?? 0) * (dimMap[k]?.[i] ?? 0), 0),
  )

  // ── 순위 (1 = 최고) ───────────────────────────────────────────
  const sorted = [...scores.keys()].sort((a, b) => scores[b] - scores[a])
  const ranks  = new Array<number>(features.length)
  sorted.forEach((fi, rank) => { ranks[fi] = rank + 1 })
  const n = features.length

  return features.map((f, i) => ({
    ...f,
    properties: {
      ...f.properties,
      score:    Math.round(scores[i]),
      rank:     ranks[i],
      rank_pct: n > 1 ? Math.round((1 - (ranks[i] - 1) / (n - 1)) * 100) : 100,
    },
  }))
}
