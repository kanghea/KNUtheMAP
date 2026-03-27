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
  S: { label: 'S', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', text: '완벽하게 잘 맞아요!' },
  A: { label: 'A', color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', text: '잘 맞는 건물이에요' },
  B: { label: 'B', color: '#059669', bg: '#d1fae5', border: '#a7f3d0', text: '대체로 괜찮아요' },
  C: { label: 'C', color: '#d97706', bg: '#fef3c7', border: '#fde68a', text: '아쉬운 점이 있어요' },
  D: { label: 'D', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', text: '잘 맞지 않을 수 있어요' },
}

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= n ? color : '#e5e7eb'}>
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
    <div className="border border-gray-200 rounded-2xl overflow-hidden">

      {/* 헤더 */}
      <div
        className="px-5 pt-5 pb-4 flex items-start justify-between gap-3"
        style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
      >
        <div>
          <h3 className="text-sm font-bold text-gray-900">내 기준 적합도</h3>
          <p className="text-xs mt-0.5" style={{ color: cfg.color }}>
            {grade && <>{grade} · </>}{dept && <>{dept} · </>}{cfg.text}
          </p>
        </div>
        <span
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
          style={{ background: cfg.color, color: '#fff' }}
        >
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
              className={`flex items-center gap-3 px-5 py-3.5 ${
                i < topPriorities.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 순위 뱃지 */}
              <span
                className="shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={isTop
                  ? { background: cfg.color, color: '#fff' }
                  : { background: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {i + 1}
              </span>

              {/* 이모지 + 라벨 */}
              <span className="text-base shrink-0">{meta.icon}</span>
              <span className="text-sm font-semibold text-gray-700 flex-1">{meta.label}</span>

              {/* 세부 텍스트 */}
              <span className="text-xs text-gray-400 shrink-0">{f.detail}</span>

              {/* 별점 */}
              <Stars n={f.stars} color={cfg.color} />
            </div>
          )
        })}
      </div>

      {/* 하단 */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          우선순위 기반 · 상위 {topPriorities.length}개 반영 · 지도에서 설정 변경 가능
        </span>
      </div>
    </div>
  )
}
