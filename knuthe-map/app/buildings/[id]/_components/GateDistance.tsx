// GateDistance — 가까운 출입문 거리 카드

interface GateRow {
  name:    string
  distM:   number
  minutes: number
}

interface Props {
  gates: GateRow[]
}

export default function GateDistance({ gates }: Props) {
  if (gates.length === 0) return null

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(59,130,246,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>가까운 출입문</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>도보 속도 약 4.2km/h 기준</p>
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
                display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16,
                borderBottom: i < gates.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                background: isNearest ? 'rgba(59,130,246,0.06)' : 'transparent',
              }}
            >
              {/* 순위 */}
              <span
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  ...(isNearest
                    ? { background: '#3b82f6', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }),
                }}
              >
                {i + 1}
              </span>

              {/* 문 이름 */}
              <span style={{
                flex: 1, fontSize: 14, fontWeight: 600,
                color: isNearest ? '#60a5fa' : 'rgba(255,255,255,0.7)',
              }}>
                {g.name}
              </span>

              {/* 거리 */}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                {g.distM < 1000 ? `${Math.round(g.distM)}m` : `${(g.distM / 1000).toFixed(1)}km`}
              </span>

              {/* 도보 시간 */}
              <span style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700,
                padding: '4px 10px', borderRadius: 999,
                ...(isNearest
                  ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }),
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
