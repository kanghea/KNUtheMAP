import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader, HeaderAvatarLink } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { StatCard } from '@/components/shared/StatCard'
import { MenuItem } from '@/components/shared/MenuItem'
import { Badge } from '@/components/shared/Badge'
import { IconUser } from '@/components/shared/icons'

export default async function AgentPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role, nickname').eq('id', user.id).single()
  if (!profile || !['agent', 'admin'].includes(profile.role)) redirect('/')

  const { tok } = await getServerThemeTokens()

  // 관리 건물 수 + 활성 매물 수 + 최근 관리 건물을 병렬 실행
  const [{ count: buildingCount }, { count: listingCount }, { data: buildings }] = await Promise.all([
    supabase
      .from('agent_buildings')
      .select('*', { count: 'estimated', head: true })
      .eq('agent_id', user.id),
    supabase
      .from('rooms')
      .select('*', { count: 'estimated', head: true })
      .eq('listed_by', user.id)
      .eq('is_active', true),
    supabase
      .from('agent_buildings')
      .select('buildings ( id, name, address, zone )')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: '관리 건물', value: buildingCount ?? 0, icon: '🏢', color: '#7c3aed',       bg: 'rgba(124,58,237,0.12)', href: '/agent/buildings' },
    { label: '활성 매물', value: listingCount  ?? 0, icon: '📋', color: tok.accentColor, bg: tok.accentBg,            href: '/agent/listings' },
  ]

  const menus = [
    { href: '/agent/buildings', icon: '🏢', label: '건물 관리',     description: '관리 건물 추가·확인' },
    { href: '/agent/listings',  icon: '📝', label: '매물 등록·관리', description: '방 매물 올리기' },
    { href: '/agent/stats',     icon: '📊', label: '통계',           description: '조회수·찜 현황 확인' },
  ]

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="중개사 대시보드"
        subtitle={profile.nickname ?? user.email}
        backHref="/"
        backLabel="홈으로"
        right={
          <HeaderAvatarLink tok={tok} href="/me">
            <IconUser size={16} color={tok.textSecondary} />
          </HeaderAvatarLink>
        }
      />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 통계 요약 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {stats.map(s => (
            <StatCard
              key={s.href}
              href={s.href}
              icon={s.icon}
              value={s.value}
              label={s.label}
              color={s.color}
              background={s.bg}
            />
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <Card tok={tok} overflow="hidden" padding={0}>
          {menus.map((m, i) => (
            <MenuItem
              key={m.href}
              tok={tok}
              href={m.href}
              icon={m.icon}
              label={m.label}
              description={m.description}
              divider={i < menus.length - 1}
            />
          ))}
        </Card>

        {/* 최근 관리 건물 */}
        {(buildings ?? []).length > 0 && (
          <Card tok={tok} padding="18px 20px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>관리 건물</h2>
              <Link href="/agent/buildings" style={{ fontSize: 12, color: tok.accentColor, textDecoration: 'none' }}>
                전체 보기
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(buildings ?? []).map((ab, i) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const b = (ab.buildings as any)
                if (!b) return null
                return (
                  <Link key={i} href={`/buildings/${b.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    border: `1px solid ${tok.cardBorder}`, background: tok.inputBg,
                    textDecoration: 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tok.textPrimary,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.name ?? '이름 없는 건물'}
                      </div>
                      <div style={{ fontSize: 11, color: tok.textTertiary, marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.address}
                      </div>
                    </div>
                    {b.zone && <Badge label={b.zone} color={tok.textSecondary} background={tok.cardBorder} />}
                  </Link>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}
