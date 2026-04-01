'use client'

interface OptionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  selected: boolean
  onClick: () => void
  tok: {
    cardBg: string
    cardBorder: string
    cardActiveBg: string
    cardActiveBorder: string
    cardActiveGlow: string
    textPrimary: string
    textSecondary: string
    accent: string
    badgeBg?: string
    badgeColor?: string
  }
  /** 우측 체크/뱃지 영역 커스텀 */
  trailing?: React.ReactNode
}

export default function OptionCard({
  icon, title, description, badge, selected, onClick, tok, trailing,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      data-selected={selected ? 'true' : 'false'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 16,
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        border: `1.5px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
        background: selected ? tok.cardActiveBg : tok.cardBg,
        boxShadow: selected ? tok.cardActiveGlow : 'none',
        transition: 'border .2s ease, background .2s ease, box-shadow .2s ease',
      }}
    >
      <span
        className="option-icon"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: selected ? tok.cardActiveBg : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
          transition: 'background .2s ease, border-color .2s ease',
        }}
      >
        {icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: selected ? tok.accent : tok.textPrimary,
            transition: 'color .2s ease',
          }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 999,
              background: tok.badgeBg ?? 'rgba(245,158,11,0.12)',
              color: tok.badgeColor ?? '#F59E0B',
            }}>
              {badge}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 12,
          color: tok.textSecondary,
          lineHeight: 1.5,
          whiteSpace: 'pre-line',
        }}>
          {description}
        </span>
      </div>

      {trailing ?? (
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          flexShrink: 0,
          border: selected ? `2px solid ${tok.accent}` : `2px solid ${tok.cardBorder}`,
          background: selected ? tok.accent : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color .2s ease, background .2s ease',
        }}>
          {selected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
    </button>
  )
}
