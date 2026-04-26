import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import UserList from './_components/UserList'

export default async function AdminUsersPage() {
  const [user, role, themed] = await Promise.all([
    getServerUser(),
    getServerRole(),
    getServerThemeTokens(),
  ])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const { tok } = themed
  const service = createServiceClient()

  const { data: users } = await service
    .from('users')
    .select('id, email, nickname, role, created_at')
    .order('created_at', { ascending: false })

  const list = users ?? []

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="사용자 관리"
        subtitle={`전체 ${list.length}명`}
        backHref="/admin"
      />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <UserList users={list as any} />
      </div>
    </PageWrapper>
  )
}
