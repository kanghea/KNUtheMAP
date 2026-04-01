'use client'

// StepPriority — 중요한 순서대로 탭해서 우선순위 정하기

// ── 인라인 SVG 아이콘 (pathLength="100" 필수) ──

const MapPinIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" pathLength="100" />
    <circle cx="12" cy="10" r="3" pathLength="100" />
  </svg>
)

const ClockIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <circle cx="12" cy="12" r="10" pathLength="100" />
    <polyline points="12 6 12 12 16 14" pathLength="100" />
  </svg>
)

const Maximize2Icon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <polyline points="15 3 21 3 21 9" pathLength="100" />
    <polyline points="9 21 3 21 3 15" pathLength="100" />
    <line x1="21" y1="3" x2="14" y2="10" pathLength="100" />
    <line x1="3" y1="21" x2="10" y2="14" pathLength="100" />
  </svg>
)

const ShieldCheckIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" pathLength="100" />
    <path d="m9 12 2 2 4-4" pathLength="100" />
  </svg>
)

const StoreIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" pathLength="100" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" pathLength="100" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" pathLength="100" />
    <path d="M2 7h20" pathLength="100" />
  </svg>
)

const FACTORS = [
  { id: 'dist',     label: '학교랑 가까울수록',      sub: '출입문까지 도보 거리',            icon: MapPinIcon },
  { id: 'age',      label: '새 건물일수록',           sub: '준공된 지 얼마 안 된 곳',        icon: ClockIcon },
  { id: 'size',     label: '방이 넓을수록',           sub: '세대당 전용면적 기준',            icon: Maximize2Icon },
  { id: 'security', label: '보안이 좋을수록',         sub: '엘리베이터·인터폰·관리 여부',    icon: ShieldCheckIcon },
  { id: 'nearby',   label: '주변 편의시설 많을수록',  sub: '편의점·음식점·카페 등 300m 내',  icon: StoreIcon },
]

interface Props {
  value:    string[]
  onChange: (v: string[]) => void
  tok: {
    cardBg: string
    cardBorder: string
    cardActiveBg: string
    cardActiveBorder: string
    cardActiveGlow: string
    textPrimary: string
    textSecondary: string
    textTertiary: string
    accent: string
  }
}

export default function StepPriority({ value, onChange, tok }: Props) {
  const handleTap = (id: string) => {
    if (value.includes(id)) {
      onChange(value.slice(0, value.indexOf(id)))
    } else {
      onChange([...value, id])
    }
  }

  const allSelected = value.length === FACTORS.length

  const guide =
    value.length === 0              ? '가장 중요한 것부터 순서대로 탭해 주세요' :
    value.length < FACTORS.length   ? `${value.length + 1}순위는 뭐예요?` :
                                      '완료! 아래 버튼을 눌러 계속하세요'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ textAlign: 'center', fontSize: 13, color: tok.textSecondary, marginBottom: 4 }}>
        {guide}
      </p>

      {FACTORS.map((f) => {
        const rank = value.indexOf(f.id)
        const selected = rank >= 0

        return (
          <button
            key={f.id}
            onClick={() => handleTap(f.id)}
            data-selected={selected ? 'true' : 'false'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 16,
              textAlign: 'left',
              width: '100%',
              cursor: allSelected && !selected ? 'default' : 'pointer',
              border: `1.5px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
              background: selected ? tok.cardActiveBg : tok.cardBg,
              boxShadow: selected ? tok.cardActiveGlow : 'none',
              opacity: allSelected && !selected ? 0.35 : 1,
              transition: 'border .2s ease, background .2s ease, box-shadow .2s ease, opacity .2s ease',
            }}
          >
            {/* 아이콘 */}
            <span
              className="option-icon"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selected ? tok.cardActiveBg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
                transition: 'background .2s ease, border-color .2s ease',
              }}
            >
              {f.icon}
            </span>

            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 14,
                fontWeight: 700,
                color: selected ? tok.accent : tok.textPrimary,
                margin: 0,
                transition: 'color .2s ease',
              }}>
                {f.label}
              </p>
              <p style={{ fontSize: 12, color: tok.textSecondary, margin: '2px 0 0', }}>
                {f.sub}
              </p>
            </div>

            {/* 순위 뱃지 */}
            {selected ? (
              <span style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                background: tok.accent,
                color: '#fff',
              }}>
                {rank + 1}
              </span>
            ) : (
              <span style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px dashed rgba(255,255,255,0.2)',
              }} />
            )}
          </button>
        )
      })}

      {value.length > 0 && (
        <button
          onClick={() => onChange([])}
          style={{
            width: '100%',
            fontSize: 12,
            color: tok.textSecondary,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          다시 고르기
        </button>
      )}
    </div>
  )
}
