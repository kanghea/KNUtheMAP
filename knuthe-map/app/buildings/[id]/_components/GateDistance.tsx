// GateDistance — 가까운 출입문 거리 카드

type Tok = {
  border: string; borderSoft: string
  textPrimary: string; textTertiary: string
  accent: string; accentBg: string
  cardBgAlt: string
}

interface GateRow {
  name:    string
  distM:   number
  minutes: number
}

interface Props {
  gates: GateRow[]
  tok:   Tok
}

export default function GateDistance({ gates, tok }: Props) {
  if (gates.length === 0) return null

  return (
    <div style={{ border: `1px solid ${tok.border}`, borderRadius: 20, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{
        padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1px solid ${tok.borderSoft}`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 12,
          background: tok.accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tok.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>가까운 출입문</h3>
          <p style={{ fontSize: 12, color: tok.textTertiary, margin: '2px 0 0' }}>도보 속도 약 4.2km/h 기준</p>
        </div>
      </div>

      {/* 게이트 목록 */}
      <div>
        {gates.map((g, i) => {
          const isNearest = i === 0
          return (
            <div
              key={g.name}
              style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 14,
                borderBottom: i < gates.length - 1 ? `1px solid ${tok.borderSoft}` : 'none',
                background: isNearest ? tok.accentBg : 'transparent',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                ...(isNearest
                  ? { background: tok.accent, color: '#fff' }
                  : { background: tok.cardBgAlt, color: tok.textTertiary }),
              }}>
                {i + 1}
              </span>

              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isNearest ? tok.accent : tok.textPrimary }}>
                {g.name}
              </span>

              <span style={{ fontSize: 12, color: tok.textTertiary, flexShrink: 0 }}>
                {g.distM < 1000 ? `${Math.round(g.distM)}m` : `${(g.distM / 1000).toFixed(1)}km`}
              </span>

              <span style={{
                flexShrink: 0, fontSize: 12, fontWeight: 700,
                padding: '4px 10px', borderRadius: 999,
                ...(isNearest
                  ? { background: `${tok.accent}28`, color: tok.accent }
                  : { background: tok.cardBgAlt, color: tok.textTertiary }),
              }}>
                도보 {g.minutes}분
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
