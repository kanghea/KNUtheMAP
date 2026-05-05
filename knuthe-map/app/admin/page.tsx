import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { StatCard } from '@/components/shared/StatCard'
import { MenuItem } from '@/components/shared/MenuItem'
import { IconAlert, IconChevronRight } from '@/components/shared/icons'

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

  // 대시보드 통계 — 표시용이므로 count='estimated' 사용:
  //   - 작은 테이블(~수천행): 결과적으로 exact 와 동일
  //   - 큰 테이블: planner 통계 기반 추정값 (O(N) 풀스캔 회피)
  // 정확한 카운트가 필요한 곳은 별도로 'exact' 사용할 것.
  const [
    { count: pendingCount },
    { count: userCount },
    { count: buildingCount },
    { count: roomCount },
    { count: minwonPendingCount },
  ] = await Promise.all([
    service.from('role_requests').select('*', { count: 'estimated', head: true }).eq('status', 'pending'),
    service.from('users').select('*', { count: 'estimated', head: true }),
    service.from('buildings').select('*', { count: 'estimated', head: true }).eq('is_active', true),
    service.from('rooms').select('*', { count: 'estimated', head: true }).eq('is_active', true),
    service.from('minwons').select('*', { count: 'estimated', head: true }).eq('status', 'pending'),
  ])

  // 4-card 2x2 그리드 유지 — 민원은 별도 풀폭 배너로 분리해 시각적 우선순위 부여.
  const stats = [
    { label: '승인 대기',   value: pendingCount  ?? 0, icon: '⏳', color: '#d97706',         bg: 'rgba(217,119,6,0.15)',  href: '/admin/approvals' },
    { label: '전체 사용자', value: userCount     ?? 0, icon: '👥', color: tok.accentColor,   bg: tok.accentBg,            href: '/admin/users' },
    { label: '활성 건물',   value: buildingCount ?? 0, icon: '🏢', color: '#0891b2',         bg: 'rgba(8,145,178,0.15)',  href: '/admin/buildings' },
    { label: '활성 방',     value: roomCount     ?? 0, icon: '🚪', color: '#7c3aed',         bg: 'rgba(124,58,237,0.15)', href: '/admin/rooms' },
  ]

  const menus = [
    { href: '/admin/approvals', icon: '✅',                                                      label: '권한 신청 관리', description: '건물주·중개사 승인/거절' },
    { href: '/admin/minwon',    icon: <IconAlert size={20} color={tok.dangerColor} />,            label: '민원 관리',      description: '대신 처리 민원 접수·처리' },
    { href: '/admin/users',     icon: '👥',                                                      label: '사용자 관리',    description: '전체 사용자 조회·역할 변경' },
    { href: '/admin/buildings', icon: '🏢',                                                      label: '건물 관리',      description: '건물 정보 수정·노출 설정' },
    { href: '/admin/rooms',     icon: '🚪',                                                      label: '방(매물) 관리',  description: '매물 활성화·삭제' },
  ]

  const minwonPending = minwonPendingCount ?? 0

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader tok={tok} title="관리자 대시보드" backHref="/" backLabel="홈으로" />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14 }}>

        {minwonPending > 0 && (
          <Link
            href="/admin/minwon"
            aria-label={`처리 대기 민원 ${minwonPending}건 보기`}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              borderRadius: 16,
              background: tok.dangerBg,
              border: `1px solid ${tok.dangerColor}40`,
              textDecoration: 'none',
            }}
          >
            <span style={{
              width: 38, height: 38, borderRadius: 12,
              background: tok.cardBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconAlert size={20} color={tok.dangerColor} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tok.dangerColor, lineHeight: 1.3 }}>
                처리 대기 민원 {minwonPending}건
              </div>
              <div style={{ fontSize: 11, color: tok.textSecondary, marginTop: 2 }}>
                탭해서 민원 관리로 이동
              </div>
            </div>
            <IconChevronRight color={tok.dangerColor} />
          </Link>
        )}

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
      </div>
    </PageWrapper>
  )
}
