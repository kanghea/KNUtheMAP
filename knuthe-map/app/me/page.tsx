import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import ProfileEditor from './_components/ProfileEditor'
import LogoutButton from './_components/LogoutButton'
import MyContractsManager from './_components/MyContractsManager'

export default async function MePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, nickname, avatar_url, grade, dept')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>

      {/* ── 헤더 ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/" style={{
          width: 34, height: 34, borderRadius: 10, background: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>마이페이지</h1>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 프로필 편집 카드 ──────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 18px' }}>
            내 정보
          </h2>
          {profile ? (
            <ProfileEditor profile={profile} />
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>프로필 정보를 불러올 수 없어요.</p>
          )}
        </div>

        {/* ── 계약 관리 ─────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', marginBottom: 16,
        }}>
          <MyContractsManager />
        </div>

        {/* ── 로그아웃 ──────────────────────────────────────────── */}
        <LogoutButton />
      </div>
    </div>
  )
}
