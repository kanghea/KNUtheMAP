import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import ProfileEditor      from './_components/ProfileEditor'
import LogoutButton       from './_components/LogoutButton'
import ThemeToggle        from './_components/ThemeToggle'
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

  // role별 추가 데이터
  let myRoomsCount   = 0
  let buildingsCount = 0
  let roomsCount     = 0
  let usersCount     = 0

  if (role === 'owner' || role === 'agent') {
    const { count } = await service
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('listed_by', user.id)
    myRoomsCount = count ?? 0
  }

  if (role === 'admin') {
    const [b, r, u] = await Promise.all([
      service.from('buildings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      service.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
      service.from('users').select('id', { count: 'exact', head: true }),
    ])
    buildingsCount = b.count ?? 0
    roomsCount     = r.count ?? 0
    usersCount     = u.count ?? 0
  }

  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', paddingBottom: 100 }}>

      {/* ── 헤더 ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-overlay)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/" style={{
          width: 34, height: 34, borderRadius: 10, background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>마이페이지</h1>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '1px 0 0' }}>{roleLabel}</p>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 프로필 카드 ────────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-xs)', padding: '20px', marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 18px' }}>
            내 정보
          </h2>
          {profile ? (
            <ProfileEditor
              profile={profile}
              showStudentFields={role === 'tenant'}
            />
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>프로필 정보를 불러올 수 없어요.</p>
          )}
        </div>

        {/* ── role별 섹션 ────────────────────────────────────────── */}
        {role === 'tenant' && (
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xs)', padding: '20px', marginBottom: 16,
          }}>
            <MyContractsManager />
          </div>
        )}

        {role === 'owner' && (
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xs)', padding: '20px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              건물주 메뉴
            </h2>
            <OwnerSection myRoomsCount={myRoomsCount} />
          </div>
        )}

        {role === 'agent' && (
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xs)', padding: '20px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              중개사 메뉴
            </h2>
            <AgentSection myRoomsCount={myRoomsCount} />
          </div>
        )}

        {role === 'admin' && (
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xs)', padding: '20px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              관리자 메뉴
            </h2>
            <AdminSection
              buildingsCount={buildingsCount}
              roomsCount={roomsCount}
              usersCount={usersCount}
            />
          </div>
        )}

        {/* ── 테마 설정 ──────────────────────────────────────────── */}
        <ThemeToggle />

        {/* ── 로그아웃 ──────────────────────────────────────────── */}
        <LogoutButton />
      </div>
    </div>
  )
}
