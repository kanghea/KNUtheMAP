// 방봐요 — 학과 주문(主門) ↔ 둘러본 건물 거리 표시 배지.
//
// 자동 계산:
//   1) prefs.dept → getGatesByDept(dept)[0] 로 학과별 주문 결정
//   2) gateDistances(lat, lng) 로 그 문에서의 직선 거리 + 도보 분 산출
//
// DB 변경 없이 서버 렌더 시점에 매번 계산. 학과·문 데이터가 바뀌면 자동 반영.
// 추후 6각형 비교 시각화의 거리 항목으로도 동일 함수에서 데이터를 가져온다.

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

  // 학과 미입력 → 거리 계산 기준이 없음. 가장 가까운 문을 fallback 으로 보여준다.
  const deptGates = dept ? getGatesByDept(dept) : []
  const targetName = deptGates[0] ?? null
  const target = targetName ? GATES.find((g) => g.name === targetName) ?? null : null

  // 주문이 없거나(학과 미설정 + 학과에 매핑 없음) 좌표 못 찾으면 가장 가까운 문 사용.
  const sorted = gateDistances(lat, lng)
  const used = target
    ? (sorted.find((s) => s.gate.name === target.name) ?? sorted[0])
    : sorted[0]
  if (!used) return null

  const isFallback = !target

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
        {isFallback
          ? <>가장 가까운 문 <strong style={{ color: tok.textPrimary }}>{used.gate.name}</strong>까지</>
          : <>내 학과 기준 <strong style={{ color: tok.textPrimary }}>{used.gate.name}</strong>에서</>
        }
        {' '}
        <strong style={{ color: tok.textPrimary }}>도보 {used.minutes}분</strong>
        <span style={{ color: tok.textTertiary, marginLeft: 4, fontSize: 11 }}>
          ({Math.round(used.distM)}m)
        </span>
      </span>
    </div>
  )
}
