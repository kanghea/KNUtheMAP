import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import BuildingList from './_components/BuildingList'

export default async function AdminBuildingsPage() {
  const [user, role, themed] = await Promise.all([
    getServerUser(),
    getServerRole(),
    getServerThemeTokens(),
  ])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const { tok } = themed
  const service = createServiceClient()
  const { data: buildings } = await service
    .from('buildings')
    .select('id, name, address, zone, total_floors, main_purps_nm, is_active, images')
    .order('is_active', { ascending: false })
    .order('name')

  const list = buildings ?? []

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="건물 관리"
        subtitle={`전체 ${list.length}개`}
        backHref="/admin"
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <BuildingList buildings={list as any} />
      </div>
    </PageWrapper>
  )
}
