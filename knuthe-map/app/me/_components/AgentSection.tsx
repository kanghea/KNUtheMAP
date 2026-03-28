import Link from 'next/link'

interface Props {
  myRoomsCount: number
}

export default function AgentSection({ myRoomsCount }: Props) {
  const menuItems = [
    { href: '/agent',          label: '중개사 대시보드',  desc: '매물 등록 및 현황 관리',    icon: '📋' },
    { href: '/agent/listings', label: '내 매물 목록',    desc: '등록한 매물 수정·삭제',     icon: '🔑' },
    { href: '/agent/stats',    label: '통계',           desc: '조회 수·관심 건물 현황',    icon: '📊' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 요약 stat */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', fontWeight: 600 }}>
            등록된 매물
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-inverse)', margin: 0 }}>
            {myRoomsCount}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>개</span>
          </p>
        </div>
        <div style={{ fontSize: 36 }}>🏙️</div>
      </div>

      {/* 메뉴 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--bg-elevated)', border: '1.5px solid #f1f5f9',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#f0f9ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
