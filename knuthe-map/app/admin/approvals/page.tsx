import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import ApprovalList from './_components/ApprovalList'

export default async function ApprovalsPage() {
  const [user, role, themed] = await Promise.all([
    getServerUser(),
    getServerRole(),
    getServerThemeTokens(),
  ])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const { tok } = themed
  const service = createServiceClient()

  const { data: requests } = await service
    .from('role_requests')
    .select(`
      id, requested_role, status, business_name, address, license_number, phone, memo,
      created_at, reviewed_at, reject_reason,
      users!role_requests_user_id_fkey ( id, email, nickname, role )
    `)
    .order('created_at', { ascending: false })

  const list = requests ?? []
  const pendingCount = list.filter(r => r.status === 'pending').length

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="권한 신청 관리"
        subtitle={`대기 중 ${pendingCount}건`}
        backHref="/admin"
      />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ApprovalList requests={list as any} />
      </div>
    </PageWrapper>
  )
}
