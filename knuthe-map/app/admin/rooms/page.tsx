import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import RoomList from './_components/RoomList'

export default async function AdminRoomsPage() {
  const [user, role, themed] = await Promise.all([
    getServerUser(),
    getServerRole(),
    getServerThemeTokens(),
  ])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const { tok } = themed
  const service = createServiceClient()
  const { data: rooms } = await service
    .from('rooms')
    .select(`
      id, contract_type, deposit, monthly_rent,
      area_m2, floor, room_type, is_active, created_at, images,
      buildings ( name, address, zone ),
      users!rooms_listed_by_fkey ( email, nickname )
    `)
    .order('created_at', { ascending: false })

  const list = rooms ?? []

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="방(매물) 관리"
        subtitle={`전체 ${list.length}개`}
        backHref="/admin"
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RoomList rooms={list as any} />
      </div>
    </PageWrapper>
  )
}
