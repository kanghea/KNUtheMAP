// 방봐요 — 학과 주문(主門) ↔ 둘러본 건물 거리 표시 배지.
//
// 학과 주문 결정 정책 (단일 출처):
//   prefs.dept → getGatesByDept(dept)[0]
//
// 학과가 설정되어 있고 그 학과의 주문이 정의된 경우에만 배지 노출. 학과 미설정·
// 주문 미정의(예: 의대 칠곡) 트랙에 대해서는 "가장 가까운 문" 폴백을 사용하지
// 않는다 — 사용자 학과 정보를 신뢰해 의미 있는 비교만 보여주는 게 정책.
//
// 추후 사용자가 다른 문 기준을 원하면 마이페이지에서 오버라이드 (TODO).

import { cookies } from 'next/headers'
import { parsePrefs } from '@/lib/prefs'
import { getGatesByDept } from '@/lib/department-zones'
import { GATES, gateDistances } from '@/lib/gate-utils'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface Props {
  tok:    ThemeTokens
  /** 측정 대상 건물의 좌표. null 이면 컴포넌트 자체를 노출하지 않음. */
  lat:    number | null
  lng:    number | null
  /** 인라인용 컴팩트 표시 (헤더 우측 슬롯 등). 기본 false → 기본 카드형 박스 */
  compact?: boolean
}

export default async function GateDistanceBadge({ tok, lat, lng, compact }: Props) {
  if (lat == null || lng == null) return null

  const jar   = await cookies()
  const raw   = jar.get('knu_prefs')?.value
  const prefs = raw ? parsePrefs(raw) : null
  const dept  = prefs?.dept ?? null
  if (!dept) return null  // 학과 미설정 → 노출 안 함

  const targetName = getGatesByDept(dept)[0] ?? null
  if (!targetName) return null  // 학과의 주문 미정의 → 노출 안 함

  const target = GATES.find((g) => g.name === targetName)
  if (!target) return null

  const sorted = gateDistances(lat, lng)
  const used = sorted.find((s) => s.gate.name === target.name)
  if (!used) return null

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, color: tok.textSecondary, fontWeight: 600,
        padding: '4px 8px', borderRadius: 999,
        background: tok.inputBg, border: `1px solid ${tok.inputBorder}`,
      }}>
        🚶 {used.gate.name} {used.minutes}분
      </span>
    )
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontSize: 12, color: tok.textSecondary,
      padding: '8px 12px', borderRadius: 12,
      background: tok.inputBg, border: `1px solid ${tok.inputBorder}`,
    }}>
      <span aria-hidden style={{ fontSize: 14 }}>🚶</span>
      <span>
        내 학과 기준 <strong style={{ color: tok.textPrimary }}>{used.gate.name}</strong>에서{' '}
        <strong style={{ color: tok.textPrimary }}>도보 {used.minutes}분</strong>
        <span style={{ color: tok.textTertiary, marginLeft: 4, fontSize: 11 }}>
          ({Math.round(used.distM)}m)
        </span>
      </span>
    </div>
  )
}
