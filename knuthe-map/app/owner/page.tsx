import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getServerThemeTokens } from '@/lib/theme-server'
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

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, paddingBottom: 100 }}>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" aria-label="홈으로" style={{
            width: 34, height: 34, borderRadius: 10, background: tok.inputBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={tok.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>건물주 대시보드</h1>
            {(() => {
              const b = ownerBuilding?.buildings as BuildingSummary | BuildingSummary[] | null | undefined
              const single = Array.isArray(b) ? b[0] : b
              if (!single) return null
              return (
                <p style={{ fontSize: 11, color: tok.textTertiary, margin: '2px 0 0' }}>
                  {single.name ?? single.address}
                </p>
              )
            })()}
          </div>
        </div>
        <Link href="/me" aria-label="마이페이지" style={{
          width: 34, height: 34, borderRadius: 10, background: tok.inputBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tok.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <OwnerDashboardClient
          // Supabase가 1:1 관계도 배열로 반환할 수 있어 형 단언이 필요함
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ownerBuilding={ownerBuilding as any}
          userId={user.id}
        />
      </div>
    </div>
  )
}
