import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader, HeaderAvatarLink } from '@/components/shared/DashboardHeader'
import { IconUser } from '@/components/shared/icons'
import OwnerDashboardClient from './_components/OwnerDashboardClient'

type BuildingSummary = { id?: string; name?: string | null; address?: string | null; total_floors?: number | null }

export default async function OwnerPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 권한 확인
  const { data: profile } = await supabase
    .from('users')
    .select('role, nickname')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  const { tok } = await getServerThemeTokens()

  // 건물 조회
  const { data: ownerBuilding } = await supabase
    .from('owner_buildings')
    .select(`
      id, dedicated_agent_id,
      buildings ( id, name, address, total_floors ),
      dedicated_agent:users!owner_buildings_dedicated_agent_id_fkey ( id, nickname, email )
    `)
    .eq('owner_id', user.id)
    .single()

  // Supabase가 1:1 관계도 배열로 반환할 수 있어 단일 값으로 정규화
  const rawBldg = ownerBuilding?.buildings as BuildingSummary | BuildingSummary[] | null | undefined
  const bldg    = Array.isArray(rawBldg) ? rawBldg[0] : rawBldg
  const subtitle = bldg?.name ?? bldg?.address ?? null

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="건물주 대시보드"
        subtitle={subtitle}
        backHref="/"
        backLabel="홈으로"
        right={
          <HeaderAvatarLink tok={tok} href="/me">
            <IconUser size={16} color={tok.textSecondary} />
          </HeaderAvatarLink>
        }
      />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <OwnerDashboardClient
          // Supabase가 1:1 관계도 배열로 반환할 수 있어 형 단언이 필요함
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ownerBuilding={ownerBuilding as any}
          userId={user.id}
        />
      </div>
    </PageWrapper>
  )
}
