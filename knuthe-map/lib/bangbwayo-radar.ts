// 방봐요 — 레이더 차트 보조 함수.
//
// rating → 0~1 점수 매핑, 트랙별 색상 팔레트, 응답 배열을 axes 순서대로
// 정렬해 RadarSeries.values 로 변환. 거리(학과 주문 ↔ 건물 도보분)를
// 추가 축으로 노출 가능 (8각형).

import type { Rating, ChecklistItem } from './bangbwayo-checklist'
import { gateDistances, GATES, type Gate } from './gate-utils'
import type { RadarAxis, RadarSeries } from '@/components/bangbwayo/RadarChart'

/** rating → 0~1 정규화 (good=1, fair=0.66, bad=0.33, unknown/null=0) */
export function ratingScore(rating: Rating | null | undefined): number {
  switch (rating) {
    case 'good': return 1
    case 'fair': return 2 / 3
    case 'bad':  return 1 / 3
    case 'unknown':
    default:     return 0
  }
}

/**
 * 트랙 N 개에 색을 균등하게 분배. HSL hue 를 360/N 간격으로 돌리되 위상을
 * 살짝 비틀어 단조로움 회피. 채도/명도는 다크/라이트 모두에서 가독성 OK.
 */
export function colorForTrack(index: number, total: number): string {
  if (total <= 0) return '#2563eb'
  // 시작 hue 220° (블루) — 첫 번째가 시그니처 컬러와 가깝게
  const hue = (220 + (360 * index) / total) % 360
  return `hsl(${hue.toFixed(0)}, 70%, 52%)`
}

/**
 * 도보 분 → 0~1 정규화 (가까울수록 1).
 * 0분 = 1.0, 30분 이상 = 0. 5분 ≈ 0.83, 15분 = 0.5.
 *
 * 30분을 컷오프로 둔 이유: 경북대 주변 자취권은 도보 30분이 사실상 한계 —
 * 그 너머는 거리 비교 의미가 약해진다 (대중교통이 더 적절).
 */
export function walkMinutesToScore(minutes: number | null | undefined): number {
  if (minutes == null || !Number.isFinite(minutes)) return 0
  return Math.max(0, Math.min(1, 1 - minutes / 30))
}

/**
 * 학과 주문(主門) 까지의 도보 분.
 *
 * 정책: targetGateName 이 정의돼 있을 때만 계산. 없으면 null 반환 (호출자가
 * 거리 축 자체를 비표시 처리). 이전 버전의 "가장 가까운 문" 폴백은 제거 —
 * 사용자 학과 정보를 신뢰하는 단일 정책.
 */
export function gateWalkMinutes(
  lat: number,
  lng: number,
  targetGateName: string | null,
): { minutes: number; gate: Gate } | null {
  if (!targetGateName) return null
  const target = GATES.find((g) => g.name === targetGateName)
  if (!target) return null
  const sorted = gateDistances(lat, lng)
  const used = sorted.find((s) => s.gate.name === target.name)
  if (!used) return null
  return { minutes: used.minutes, gate: used.gate }
}

/**
 * 체크리스트 항목 + 트랙 응답을 받아 RadarChart 의 axes / series 로 변환.
 * 응답이 없는 항목은 0 (unknown) 로 채워 차원 수가 항상 axes.length 와 같다.
 *
 * `withDistance` 옵션을 켜면 마지막 축에 "거리" 가 추가된다 (8각형).
 * 트랙마다 좌표를 받아 학과 주문(또는 가장 가까운 문) 까지의 도보 분 → 0~1 점수.
 * 좌표 없는 트랙은 unknown(0) 처리.
 */
export interface BuildRadarInput {
  checklist: readonly ChecklistItem[]
  tracks: ReadonlyArray<{
    label:     string
    color?:    string
    responses: ReadonlyArray<{ checklist_item_key: string; rating: Rating | null }>
    /** withDistance 가 true 일 때만 사용. 둘 다 없으면 거리 축은 0. */
    lat?: number | null
    lng?: number | null
  }>
  /** 거리 축 추가 여부. 기본 false (기존 7각형 동작 유지) */
  withDistance?: boolean
  /** 거리 계산 기준 문 이름 (학과 주문). null 이면 트랙별 가장 가까운 문. */
  targetGateName?: string | null
}

export function buildRadarData({
  checklist, tracks, withDistance = false, targetGateName = null,
}: BuildRadarInput): {
  axes:   RadarAxis[]
  series: RadarSeries[]
} {
  const baseAxes: RadarAxis[] = checklist.map((c) => ({ key: c.key, label: c.label }))
  const axes: RadarAxis[] = withDistance
    ? [...baseAxes, { key: '__distance', label: '거리' }]
    : baseAxes

  const series: RadarSeries[] = tracks.map((t, i) => {
    const respMap = new Map(t.responses.map((r) => [r.checklist_item_key, r.rating] as const))
    const baseValues = checklist.map((c) => ratingScore(respMap.get(c.key)))

    if (!withDistance) {
      return {
        label:  t.label,
        color:  t.color ?? colorForTrack(i, tracks.length),
        values: baseValues,
      }
    }

    // 거리 축 — 좌표 없는 트랙은 0 (중심) 으로 처리해 N차원 일관성 유지
    let distScore = 0
    if (t.lat != null && t.lng != null) {
      const w = gateWalkMinutes(t.lat, t.lng, targetGateName)
      if (w) distScore = walkMinutesToScore(w.minutes)
    }

    return {
      label:  t.label,
      color:  t.color ?? colorForTrack(i, tracks.length),
      values: [...baseValues, distScore],
    }
  })

  return { axes, series }
}
