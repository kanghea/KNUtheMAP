import Link from 'next/link'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { parsePrefs } from '@/lib/prefs'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import { unsealViewMode, VIEW_MODE_COOKIE_NAME } from '@/lib/view-mode-cookie'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { MenuItem } from '@/components/shared/MenuItem'
import ProfileEditor      from './_components/ProfileEditor'
import LogoutButton       from './_components/LogoutButton'
import ModeToggle         from './_components/ModeToggle'
import MyContractsManager from './_components/MyContractsManager'
import BangbwayoSection   from './_components/BangbwayoSection'
import OwnerSection       from './_components/OwnerSection'
import AgentSection       from './_components/AgentSection'
import AdminSection       from './_components/AdminSection'
import AnonymousNotice    from '@/components/bangbwayo/AnonymousNotice'

const ROLE_LABELS: Record<string, string> = {
  tenant:   '학생',
  roommate: '학생',
  owner:    '건물주',
  agent:    '공인중개사',
  admin:    '관리자',
}

function readTheme(prefsRaw: string | undefined): ThemeMode {
  return prefsRaw ? (parsePrefs(prefsRaw)?.theme ?? 'light') : 'light'
}

export default async function MePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const jar      = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const theme    = readTheme(prefsRaw)
  const tok      = THEME_TOKENS[theme]

  // 비로그인 사용자도 마이페이지 진입 허용 — 로그인 권유 화면을 보여준다.
  // 종전엔 redirect('/login') 으로 화면이 갑자기 점프했지만, 하단 nav 의 "마이"
  // 탭이 항상 같은 페이지로 이어지도록 일관성 확보 + ?next=/me 로 로그인 후
  // 자연스럽게 복귀.
  if (!user) {
    return (
      <PageWrapper tok={tok}>
        <DashboardHeader tok={tok} title="마이페이지" backHref="/" backLabel="홈으로" />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
          <Card tok={tok} padding={28} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 999,
              background: tok.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              👤
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: tok.textPrimary, margin: '0 0 6px' }}>
                로그인하고 내 정보를 관리해요
              </h2>
              <p style={{ fontSize: 12, color: tok.textTertiary, margin: 0, lineHeight: 1.6 }}>
                계약·룸메이트·방봐요 기록을 한 곳에서 보고
                <br />
                다른 기기에서도 같은 데이터를 이어 쓸 수 있어요.
              </p>
            </div>
            <Link
              href={`/login?next=${encodeURIComponent('/me')}`}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: tok.accentColor, color: '#fff',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}
            >
              로그인
            </Link>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  // 익명 사용자도 /me 진입 허용 — 자기 방봐요 데이터 + 로그인 권유 표시.
  const isAnonymous = user.is_anonymous === true

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

  const sealedView = jar.get(VIEW_MODE_COOKIE_NAME)?.value
  const viewMode   = (sealedView ? unsealViewMode(sealedView) : null)
    ?? (role === 'roommate' ? 'roommate' : 'rooms')

  const roleLabel = isAnonymous ? '비로그인' : (ROLE_LABELS[role] ?? role)

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

        {/* ── 익명 사용자 안내 — 자기 방봐요 데이터만 보임 ──────── */}
        {isAnonymous && <AnonymousNotice tok={tok} redirectAfter="/me" />}

        {/* ── 프로필 카드 — 정식 로그인만 ─────────────────────── */}
        {!isAnonymous && (
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
        )}

        {/* ── 보기 모드 토글 (정식 학생만) ──────────────────────── */}
        {!isAnonymous && (role === 'tenant' || role === 'roommate') && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <ModeToggle
              initialViewMode={viewMode}
              theme={theme}
              hasRoommateProfile={hasRoommateProfile}
            />
          </Card>
        )}

        {/* ── 내 계약 관리 (정식 학생만) ──────────────────────── */}
        {!isAnonymous && (role === 'tenant' || role === 'roommate') && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <MyContractsManager theme={theme} />
          </Card>
        )}

        {/* ── 방봐요로 본 방들 (익명 포함 학생) ────────────────── */}
        {(isAnonymous || role === 'tenant' || role === 'roommate') && (
          <BangbwayoSection tok={tok} />
        )}

        {/* ── role별 섹션 ────────────────────────────────────────── */}

        {!isAnonymous && role === 'owner' && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              건물주 메뉴
            </h2>
            <OwnerSection myRoomsCount={myRoomsCount} theme={theme} />
          </Card>
        )}

        {!isAnonymous && role === 'agent' && (
          <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              중개사 메뉴
            </h2>
            <AgentSection myRoomsCount={myRoomsCount} theme={theme} />
          </Card>
        )}

        {!isAnonymous && role === 'admin' && (
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

        {/* ── 설정 메뉴 ─────────────────────────────────────────── */}
        <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 16 }}>
          <MenuItem
            tok={tok}
            href="/settings/theme"
            icon="🎨"
            label="테마 설정"
            description="다크 / 라이트 전환"
            divider={false}
          />
        </Card>

        {/* ── 로그아웃 ──────────────────────────────────────────── */}
        <LogoutButton theme={theme} />
      </div>
    </PageWrapper>
  )
}
