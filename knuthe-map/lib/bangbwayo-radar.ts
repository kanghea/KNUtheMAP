// 방봐요 — 레이더 차트 보조 함수.
//
// rating → 0~1 점수 매핑, 트랙별 색상 팔레트, 응답 배열을 axes 순서대로
// 정렬해 RadarSeries.values 로 변환.

import type { Rating, ChecklistItem } from './bangbwayo-checklist'
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
 * 체크리스트 항목 + 트랙 응답을 받아 RadarChart 의 axes / series 로 변환.
 * 응답이 없는 항목은 0 (unknown) 로 채워 차원 수가 항상 axes.length 와 같다.
 */
export interface BuildRadarInput {
  checklist: readonly ChecklistItem[]
  tracks: ReadonlyArray<{
    label:     string
    color?:    string
    responses: ReadonlyArray<{ checklist_item_key: string; rating: Rating | null }>
  }>
}

export function buildRadarData({ checklist, tracks }: BuildRadarInput): {
  axes:   RadarAxis[]
  series: RadarSeries[]
} {
  const axes: RadarAxis[] = checklist.map((c) => ({ key: c.key, label: c.label }))

  const series: RadarSeries[] = tracks.map((t, i) => {
    const respMap = new Map(t.responses.map((r) => [r.checklist_item_key, r.rating] as const))
    return {
      label:  t.label,
      color:  t.color ?? colorForTrack(i, tracks.length),
      values: checklist.map((c) => ratingScore(respMap.get(c.key))),
    }
  })

  return { axes, series }
}
