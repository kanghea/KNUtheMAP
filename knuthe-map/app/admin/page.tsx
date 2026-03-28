import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export default async function AdminPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

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
    { label: '승인 대기',   value: pendingCount  ?? 0, icon: '⏳', color: 'var(--color-amber)', bg: '#fffbeb', href: '/admin/approvals' },
    { label: '전체 사용자', value: userCount      ?? 0, icon: '👥', color: 'var(--color-primary)', bg: '#eff6ff', href: '/admin/users' },
    { label: '활성 건물',   value: buildingCount  ?? 0, icon: '🏢', color: '#0891b2', bg: '#ecfeff', href: '/admin/buildings' },
    { label: '활성 방',     value: roomCount      ?? 0, icon: '🚪', color: 'var(--color-purple)', bg: '#f5f3ff', href: '/admin/rooms' },
  ]

  const menus = [
    { href: '/admin/approvals', icon: '✅', label: '권한 신청 관리', desc: '건물주·중개사 승인/거절' },
    { href: '/admin/users',     icon: '👥', label: '사용자 관리',    desc: '전체 사용자 조회·역할 변경' },
    { href: '/admin/buildings', icon: '🏢', label: '건물 관리',      desc: '건물 정보 수정·노출 설정' },
    { href: '/admin/rooms',     icon: '🚪', label: '방(매물) 관리',  desc: '매물 활성화·삭제' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-overlay)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '14px 20px',
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>관리자 대시보드</h1>
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {stats.map((s) => (
            <Link key={s.href} href={s.href} style={{
              background: s.bg, borderRadius: 16, padding: '18px 16px',
              border: `1px solid ${s.color}20`, textDecoration: 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </Link>
          ))}
        </div>

        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-xs)', overflow: 'hidden',
        }}>
          {menus.map((item, i) => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              textDecoration: 'none', borderBottom: i < menus.length - 1 ? '1px solid #f8fafc' : 'none',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
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
