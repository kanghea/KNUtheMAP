// PersonalScore — 내 기준 적합도 카드 (서버 컴포넌트)

import { FACTOR_META } from '@/lib/prefs'

export interface FactorResult {
  id:     string
  stars:  number   // 1-5
  detail: string   // e.g. '도보 4분', '준공 12년'
}

interface Props {
  grade:      string | null   // 학번
  dept:       string | null   // 학과
  priorities: string[]        // 우선순위 순서
  factors:    FactorResult[]  // 계산된 각 차원 점수
}

const GRADE_CONFIG = {
  S: { label: 'S', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', text: '완벽하게 잘 맞아요!' },
  A: { label: 'A', color: '#60a5fa', bg: 'rgba(37,99,235,0.12)',  border: 'rgba(37,99,235,0.25)',  text: '잘 맞는 건물이에요' },
  B: { label: 'B', color: '#4ade80', bg: 'rgba(5,150,105,0.12)',  border: 'rgba(5,150,105,0.25)',  text: '대체로 괜찮아요' },
  C: { label: 'C', color: '#fbbf24', bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.25)',  text: '아쉬운 점이 있어요' },
  D: { label: 'D', color: '#f87171', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.25)',  text: '잘 맞지 않을 수 있어요' },
}

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= n ? color : 'rgba(255,255,255,0.12)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export default function PersonalScore({ grade, dept, priorities, factors }: Props) {
  if (priorities.length === 0 || factors.length === 0) return null

  // 상위 3개 우선순위만 표시
  const topPriorities = priorities.slice(0, 3)
  const WEIGHTS = [0.50, 0.30, 0.20]

  let weighted = 0
  let totalW   = 0
  topPriorities.forEach((pid, i) => {
    const f = factors.find((f) => f.id === pid)
    if (f) { weighted += f.stars * WEIGHTS[i]; totalW += WEIGHTS[i] }
  })
  const avgStars = totalW > 0 ? weighted / totalW : 3

  const overallGrade =
    avgStars >= 4.5 ? 'S' :
    avgStars >= 3.5 ? 'A' :
    avgStars >= 2.5 ? 'B' :
    avgStars >= 1.5 ? 'C' : 'D'

  const cfg = GRADE_CONFIG[overallGrade]

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 16px', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 12,
        background: cfg.bg, borderBottom: `1px solid ${cfg.border}`,
      }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>내 기준 적합도</h3>
          <p style={{ fontSize: 11, marginTop: 2, color: cfg.color }}>
            {grade && <>{grade} · </>}{dept && <>{dept} · </>}{cfg.text}
          </p>
        </div>
        <span style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900,
          background: cfg.color, color: '#fff',
        }}>
          {cfg.label}
        </span>
      </div>

      {/* 우선순위별 점수 */}
      <div>
        {topPriorities.map((pid, i) => {
          const meta = FACTOR_META[pid]
          const f    = factors.find((f) => f.id === pid)
          if (!meta || !f) return null
          const isTop = i === 0
          return (
            <div
              key={pid}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px',
                borderBottom: i < topPriorities.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* 순위 뱃지 */}
              <span style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...(isTop
                  ? { background: cfg.color, color: '#fff' }
                  : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }),
              }}>
                {i + 1}
              </span>

              {/* 이모지 + 라벨 */}
              <span style={{ fontSize: 16, flexShrink: 0 }}>{meta.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{meta.label}</span>

              {/* 세부 텍스트 */}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{f.detail}</span>

              {/* 별점 */}
              <Stars n={f.stars} color={cfg.color} />
            </div>
          )
        })}
      </div>

      {/* 하단 */}
      <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          우선순위 기반 · 상위 {topPriorities.length}개 반영 · 지도에서 설정 변경 가능
        </span>
      </div>
    </div>
  )
}
