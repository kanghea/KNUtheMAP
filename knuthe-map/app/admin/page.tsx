import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'

export default async function AdminPage() {
  const [user, role, themed] = await Promise.all([
    getServerUser(),
    getServerRole(),
    getServerThemeTokens(),
  ])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const { tok } = themed
  const service = createServiceClient()

  const [
    { count: pendingCount },
    { count: userCount },
    { count: buildingCount },
    { count: roomCount },
  ] = await Promise.all([
    service.from('role_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('buildings').select('*', { count: 'exact', head: true }).eq('is_active', true),
    service.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const stats = [
    { label: '승인 대기',   value: pendingCount  ?? 0, icon: '⏳', color: '#d97706', bg: 'rgba(217,119,6,0.15)', href: '/admin/approvals' },
    { label: '전체 사용자', value: userCount      ?? 0, icon: '👥', color: tok.accentColor, bg: tok.accentBg,   href: '/admin/users' },
    { label: '활성 건물',   value: buildingCount  ?? 0, icon: '🏢', color: '#0891b2', bg: 'rgba(8,145,178,0.15)', href: '/admin/buildings' },
    { label: '활성 방',     value: roomCount      ?? 0, icon: '🚪', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', href: '/admin/rooms' },
  ]

  const menus = [
    { href: '/admin/approvals', icon: '✅', label: '권한 신청 관리', desc: '건물주·중개사 승인/거절' },
    { href: '/admin/users',     icon: '👥', label: '사용자 관리',    desc: '전체 사용자 조회·역할 변경' },
    { href: '/admin/buildings', icon: '🏢', label: '건물 관리',      desc: '건물 정보 수정·노출 설정' },
    { href: '/admin/rooms',     icon: '🚪', label: '방(매물) 관리',  desc: '매물 활성화·삭제' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/" aria-label="홈으로" style={{
          width: 34, height: 34, borderRadius: 10, background: tok.inputBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tok.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>관리자 대시보드</h1>
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {stats.map((s) => (
            <Link key={s.href} href={s.href} style={{
              background: s.bg, borderRadius: 16, padding: '18px 16px',
              border: `1px solid ${s.color}40`, textDecoration: 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </Link>
          ))}
        </div>

        <div style={{
          background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow, overflow: 'hidden',
        }}>
          {menus.map((item, i) => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              textDecoration: 'none', borderBottom: i < menus.length - 1 ? `1px solid ${tok.cardBorder}` : 'none',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, background: tok.inputBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>{item.label}</div>
                <div style={{ fontSize: 11, color: tok.textTertiary, marginTop: 1 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tok.textTertiary}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
