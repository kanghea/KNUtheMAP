// PersonalScore — 내 기준 적합도 카드 (서버 컴포넌트)

import { FACTOR_META } from '@/lib/prefs'
import { FACTOR_ICONS } from '@/lib/factor-icons'

export interface FactorResult {
  id:     string
  stars:  number
  detail: string
}

type Tok = {
  border: string; borderSoft: string
  textPrimary: string; textTertiary: string
  cardBg: string; cardBgAlt: string
  starEmpty: string
}

interface Props {
  grade:      string | null
  dept:       string | null
  priorities: string[]
  factors:    FactorResult[]
  tok:        Tok
}

const GRADE_CONFIG = {
  S: { label: 'S', color: '#7c3aed', bgDark: 'rgba(124,58,237,0.12)', bgLight: '#ede9fe', borderDark: 'rgba(124,58,237,0.25)', borderLight: '#ddd6fe', text: '완벽하게 잘 맞아요!' },
  A: { label: 'A', color: '#2563eb', bgDark: 'rgba(37,99,235,0.12)',  bgLight: '#dbeafe', borderDark: 'rgba(37,99,235,0.25)',   borderLight: '#bfdbfe', text: '잘 맞는 건물이에요' },
  B: { label: 'B', color: '#059669', bgDark: 'rgba(5,150,105,0.12)',  bgLight: '#d1fae5', borderDark: 'rgba(5,150,105,0.25)',   borderLight: '#a7f3d0', text: '대체로 괜찮아요' },
  C: { label: 'C', color: '#d97706', bgDark: 'rgba(217,119,6,0.12)',  bgLight: '#fef3c7', borderDark: 'rgba(217,119,6,0.25)',   borderLight: '#fde68a', text: '아쉬운 점이 있어요' },
  D: { label: 'D', color: '#dc2626', bgDark: 'rgba(220,38,38,0.12)',  bgLight: '#fee2e2', borderDark: 'rgba(220,38,38,0.25)',   borderLight: '#fecaca', text: '잘 맞지 않을 수 있어요' },
}

function Stars({ n, color, empty }: { n: number; color: string; empty: string }) {
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= n ? color : empty}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export default function PersonalScore({ grade, dept, priorities, factors, tok }: Props) {
  if (priorities.length === 0 || factors.length === 0) return null

  const topPriorities = priorities.slice(0, 3)
  const WEIGHTS = [0.50, 0.30, 0.20]

  let weighted = 0, totalW = 0
  topPriorities.forEach((pid, i) => {
    const f = factors.find((f) => f.id === pid)
    if (f) { weighted += f.stars * WEIGHTS[i]; totalW += WEIGHTS[i] }
  })
  const avgStars = totalW > 0 ? weighted / totalW : 3

  const overallGrade =
    avgStars >= 4.5 ? 'S' : avgStars >= 3.5 ? 'A' : avgStars >= 2.5 ? 'B' : avgStars >= 1.5 ? 'C' : 'D'

  const cfg = GRADE_CONFIG[overallGrade]
  const isDark = tok.cardBg === '#111111'
  const hdBg   = isDark ? cfg.bgDark   : cfg.bgLight
  const hdBord = isDark ? cfg.borderDark : cfg.borderLight

  return (
    <div style={{ border: `1px solid ${tok.border}`, borderRadius: 20, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{
        padding: '18px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        background: hdBg, borderBottom: `1px solid ${hdBord}`,
      }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>내 기준 적합도</h3>
          <p style={{ fontSize: 12, color: cfg.color, margin: '3px 0 0' }}>
            {grade && <>{grade} · </>}{dept && <>{dept} · </>}{cfg.text}
          </p>
        </div>
        <span style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12,
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
            <div key={pid} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
              borderBottom: i < topPriorities.length - 1 ? `1px solid ${tok.borderSoft}` : 'none',
            }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...(isTop
                  ? { background: cfg.color, color: '#fff' }
                  : { background: tok.cardBgAlt, color: tok.textTertiary }),
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 16, flexShrink: 0, color: tok.textPrimary }}>{FACTOR_ICONS[pid] ?? meta.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: tok.textPrimary, flex: 1 }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: tok.textTertiary, flexShrink: 0 }}>{f.detail}</span>
              <Stars n={f.stars} color={cfg.color} empty={tok.starEmpty} />
            </div>
          )
        })}
      </div>

      {/* 하단 */}
      <div style={{
        padding: '10px 20px',
        background: isDark ? 'rgba(255,255,255,0.03)' : tok.cardBgAlt,
        borderTop: `1px solid ${tok.borderSoft}`,
      }}>
        <span style={{ fontSize: 12, color: tok.textTertiary }}>
          우선순위 기반 · 상위 {topPriorities.length}개 반영 · 지도에서 설정 변경 가능
        </span>
      </div>
    </div>
  )
}
