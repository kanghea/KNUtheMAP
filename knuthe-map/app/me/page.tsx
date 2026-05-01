import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { parsePrefs } from '@/lib/prefs'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import { unsealViewMode, VIEW_MODE_COOKIE_NAME } from '@/lib/view-mode-cookie'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import ProfileEditor      from './_components/ProfileEditor'
import LogoutButton       from './_components/LogoutButton'
import ModeToggle         from './_components/ModeToggle'
import MyContractsManager from './_components/MyContractsManager'
import BangbwayoSection   from './_components/BangbwayoSection'
import OwnerSection       from './_components/OwnerSection'
import AgentSection       from './_components/AgentSection'
import AdminSection       from './_components/AdminSection'

const ROLE_LABELS: Record<string, string> = {
  tenant:   '학생',
  roommate: '학생',
  owner:    '건물주',
  agent:    '공인중개사',
  admin:    '관리자',
}

export default async function MePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, nickname, avatar_url, grade, dept, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'tenant'
  const service = createServiceClient()

  // role별 추가 데이터 — 모든 쿼리를 한번에 병렬 실행
  const [roomsRes, bldgRes, rRes, uRes, rmProfileRes] = await Promise.all([
    (role === 'owner' || role === 'agent')
      ? service.from('rooms').select('id', { count: 'estimated', head: true }).eq('listed_by', user.id)
      : Promise.resolve({ count: 0 }),
    role === 'admin'
      ? service.from('buildings').select('id', { count: 'estimated', head: true }).eq('is_active', true)
      : Promise.resolve({ count: 0 }),
    role === 'admin'
      ? service.from('rooms').select('id', { count: 'estimated', head: true }).eq('is_active', true)
      : Promise.resolve({ count: 0 }),
    role === 'admin'
      ? service.from('users').select('id', { count: 'estimated', head: true })
      : Promise.resolve({ count: 0 }),
    (role === 'tenant' || role === 'roommate')
      ? service.from('roommate_profiles').select('user_id', { head: true, count: 'exact' }).eq('user_id', user.id)
      : Promise.resolve({ count: 0 }),
  ])
  const myRoomsCount       = roomsRes.count ?? 0
  const buildingsCount     = bldgRes.count ?? 0
  const roomsCount         = rRes.count ?? 0
  const usersCount         = uRes.count ?? 0
  const hasRoommateProfile = (rmProfileRes.count ?? 0) > 0

  // 테마·viewMode 쿠키 읽기
  const jar      = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const theme: ThemeMode = prefsRaw ? (parsePrefs(prefsRaw)?.theme ?? 'dark') : 'dark'
  const tok = THEME_TOKENS[theme]

  const sealedView = jar.get(VIEW_MODE_COOKIE_NAME)?.value
  const viewMode   = (sealedView ? unsealViewMode(sealedView) : null)
    ?? (role === 'roommate' ? 'roommate' : 'rooms')

  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="마이페이지"
        subtitle={roleLabel}
        backHref="/"
        backLabel="홈으로"
      />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 프로필 카드 ────────────────────────────────────────── */}
        <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 18px' }}>
            내 정보
          </h2>
          {profile ? (
            <ProfileEditor
              profile={profile}
              showStudentFields={role === 'tenant' || role === 'roommate'}
              theme={theme}
            />
          ) : (
            <p style={{ fontSize: 13, color: tok.textTertiary }}>프로필 정보를 불러올 수 없어요.</p>
          )}
        </Card>

        {/* ── 보기 모드 토글 (학생만) ───────────────────────────── */}
        {(role === 'tenant' || role === 'roommate') && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <ModeToggle
              initialViewMode={viewMode}
              theme={theme}
              hasRoommateProfile={hasRoommateProfile}
            />
          </Card>
        )}

        {/* ── 내 계약 관리 (학생만) ─────────────────────────────── */}
        {(role === 'tenant' || role === 'roommate') && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <MyContractsManager theme={theme} />
          </Card>
        )}

        {/* ── 방봐요로 본 방들 (학생만) ────────────────────────── */}
        {(role === 'tenant' || role === 'roommate') && (
          <BangbwayoSection tok={tok} />
        )}

        {/* ── role별 섹션 ────────────────────────────────────────── */}

        {role === 'owner' && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              건물주 메뉴
            </h2>
            <OwnerSection myRoomsCount={myRoomsCount} theme={theme} />
          </Card>
        )}

        {role === 'agent' && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              중개사 메뉴
            </h2>
            <AgentSection myRoomsCount={myRoomsCount} theme={theme} />
          </Card>
        )}

        {role === 'admin' && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              관리자 메뉴
            </h2>
            <AdminSection
              buildingsCount={buildingsCount}
              roomsCount={roomsCount}
              usersCount={usersCount}
              theme={theme}
            />
          </Card>
        )}

        {/* ── 로그아웃 ──────────────────────────────────────────── */}
        <LogoutButton theme={theme} />
      </div>
    </PageWrapper>
  )
}
