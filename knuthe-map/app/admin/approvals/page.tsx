import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import ApprovalList from './_components/ApprovalList'

export default async function ApprovalsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const service = createServiceClient()

  const { data: requests } = await service
    .from('role_requests')
    .select(`
      id, requested_role, status, business_name, address, license_number, phone, memo,
      created_at, reviewed_at, reject_reason,
      users!role_requests_user_id_fkey ( id, email, nickname, role )
    `)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/admin" style={{
          width: 34, height: 34, borderRadius: 10, background: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>권한 신청 관리</h1>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            대기 중 {(requests ?? []).filter((r) => r.status === 'pending').length}건
          </p>
        </div>
      </header>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
        <ApprovalList requests={(requests ?? []) as any} />
      </div>
    </div>
  )
}
