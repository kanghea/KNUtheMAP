import Link from 'next/link'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'

interface Props {
  myRoomsCount: number
  theme?:       ThemeMode
}

export default function OwnerSection({ myRoomsCount, theme = 'light' }: Props) {
  const tok = THEME_TOKENS[theme]

  const menuItems = [
    { href: '/owner',       label: '건물주 대시보드',  desc: '내 건물 현황 및 관리',    icon: '🏢' },
    { href: '/owner/units', label: '내 매물 관리',     desc: '등록 매물 수정·삭제·추가', icon: '🔑' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 요약 stat */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', fontWeight: 600 }}>
            등록된 매물
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>
            {myRoomsCount}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>개</span>
          </p>
        </div>
        <div style={{ fontSize: 36 }}>🏠</div>
      </div>

      {/* 메뉴 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: tok.cardBg, border: `1.5px solid ${tok.cardBorder}`,
              cursor: 'pointer',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: tok.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>{item.label}</div>
                <div style={{ fontSize: 11, color: tok.textTertiary, marginTop: 2 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={tok.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
