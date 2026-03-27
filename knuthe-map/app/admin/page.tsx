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

  const [{ count: pendingCount }, { count: userCount }] = await Promise.all([
    service.from('role_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('users').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        padding: '14px 20px',
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>관리자 대시보드</h1>
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '승인 대기', value: pendingCount ?? 0, icon: '⏳', color: '#d97706', bg: '#fffbeb', href: '/admin/approvals' },
            { label: '전체 사용자', value: userCount ?? 0,   icon: '👥', color: '#2563eb', bg: '#eff6ff', href: '/admin/users' },
          ].map((s) => (
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
          background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {[
            { href: '/admin/approvals', icon: '✅', label: '권한 신청 관리', desc: '건물주·중개사 승인/거절' },
            { href: '/admin/users',     icon: '👥', label: '사용자 관리',    desc: '전체 사용자 조회·역할 변경' },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              textDecoration: 'none', borderBottom: i < 1 ? '1px solid #f8fafc' : 'none',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1"
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
