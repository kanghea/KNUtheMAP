import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { parsePrefs } from '@/lib/prefs'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import ProfileEditor      from './_components/ProfileEditor'
import LogoutButton       from './_components/LogoutButton'
import MyContractsManager from './_components/MyContractsManager'
import OwnerSection       from './_components/OwnerSection'
import AgentSection       from './_components/AgentSection'
import AdminSection       from './_components/AdminSection'

const ROLE_LABELS: Record<string, string> = {
  tenant: '학생',
  owner:  '건물주',
  agent:  '공인중개사',
  admin:  '관리자',
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
  const [roomsRes, bldgRes, rRes, uRes] = await Promise.all([
    (role === 'owner' || role === 'agent')
      ? service.from('rooms').select('id', { count: 'exact', head: true }).eq('listed_by', user.id)
      : Promise.resolve({ count: 0 }),
    role === 'admin'
      ? service.from('buildings').select('id', { count: 'exact', head: true }).eq('is_active', true)
      : Promise.resolve({ count: 0 }),
    role === 'admin'
      ? service.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true)
      : Promise.resolve({ count: 0 }),
    role === 'admin'
      ? service.from('users').select('id', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
  ])
  const myRoomsCount   = roomsRes.count ?? 0
  const buildingsCount = bldgRes.count ?? 0
  const roomsCount     = rRes.count ?? 0
  const usersCount     = uRes.count ?? 0

  // 테마 읽기
  const jar      = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const theme: ThemeMode = prefsRaw ? (parsePrefs(prefsRaw)?.theme ?? 'dark') : 'dark'
  const tok = THEME_TOKENS[theme]

  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, paddingBottom: 100 }}>

      {/* ── 헤더 ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/" style={{
          width: 34, height: 34, borderRadius: 10, background: tok.inputBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tok.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>마이페이지</h1>
          <p style={{ fontSize: 11, color: tok.textTertiary, margin: '1px 0 0' }}>{roleLabel}</p>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 프로필 카드 ────────────────────────────────────────── */}
        <div style={{
          background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow, padding: '20px', marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 18px' }}>
            내 정보
          </h2>
          {profile ? (
            <ProfileEditor
              profile={profile}
              showStudentFields={role === 'tenant'}
              theme={theme}
            />
          ) : (
            <p style={{ fontSize: 13, color: tok.textTertiary }}>프로필 정보를 불러올 수 없어요.</p>
          )}
        </div>

        {/* ── role별 섹션 ────────────────────────────────────────── */}
        {role === 'tenant' && (
          <div style={{
            background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow, padding: '20px', marginBottom: 16,
          }}>
            <MyContractsManager theme={theme} />
          </div>
        )}

        {role === 'owner' && (
          <div style={{
            background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow, padding: '20px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              건물주 메뉴
            </h2>
            <OwnerSection myRoomsCount={myRoomsCount} theme={theme} />
          </div>
        )}

        {role === 'agent' && (
          <div style={{
            background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow, padding: '20px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              중개사 메뉴
            </h2>
            <AgentSection myRoomsCount={myRoomsCount} theme={theme} />
          </div>
        )}

        {role === 'admin' && (
          <div style={{
            background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow, padding: '20px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 16px' }}>
              관리자 메뉴
            </h2>
            <AdminSection
              buildingsCount={buildingsCount}
              roomsCount={roomsCount}
              usersCount={usersCount}
              theme={theme}
            />
          </div>
        )}

        {/* ── 로그아웃 ──────────────────────────────────────────── */}
        <LogoutButton theme={theme} />
      </div>
    </div>
  )
}
