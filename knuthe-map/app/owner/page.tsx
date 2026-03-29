import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import OwnerDashboardClient from './_components/OwnerDashboardClient'

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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>건물주 대시보드</h1>
          {ownerBuilding?.buildings && (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
              {(ownerBuilding.buildings as any).name ?? (ownerBuilding.buildings as any).address}
            </p>
          )}
        </div>
        <Link href="/me" style={{
          width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <OwnerDashboardClient
          ownerBuilding={ownerBuilding as any}
          userId={user.id}
        />
      </div>
    </div>
  )
}
