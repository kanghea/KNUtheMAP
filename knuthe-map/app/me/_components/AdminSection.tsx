import Link from 'next/link'

interface Props {
  buildingsCount: number
  roomsCount:     number
  usersCount:     number
}

export default function AdminSection({ buildingsCount, roomsCount, usersCount }: Props) {
  const stats = [
    { label: '건물',  value: buildingsCount, unit: '개' },
    { label: '매물',  value: roomsCount,     unit: '개' },
    { label: '사용자', value: usersCount,     unit: '명' },
  ]

  const menuItems = [
    { href: '/admin',           label: '관리자 대시보드', desc: '전체 현황 한눈에 보기',  icon: '⚙️' },
    { href: '/admin/buildings', label: '건물 관리',      desc: '건물 추가·수정·삭제',    icon: '🏢' },
    { href: '/admin/rooms',     label: '매물 관리',      desc: '매물 등록·활성화·삭제',  icon: '🔑' },
    { href: '/admin/users',     label: '사용자 관리',    desc: '권한 변경 및 계정 관리',  icon: '👥' },
    { href: '/admin/approvals', label: '신청 승인',      desc: '건물주·중개사 가입 승인', icon: '✅' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 14, padding: '14px 12px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontWeight: 600 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
              {s.value.toLocaleString()}
              <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 메뉴 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: '#fff', border: '1.5px solid #f1f5f9',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
