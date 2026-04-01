import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import BuildingList from './_components/BuildingList'

export default async function AdminBuildingsPage() {
  const [user, role] = await Promise.all([getServerUser(), getServerRole()])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const service = createServiceClient()
  const { data: buildings } = await service
    .from('buildings')
    .select('id, name, address, zone, total_floors, main_purps_nm, is_active, images')
    .order('is_active', { ascending: false })
    .order('name')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/admin" style={{
          width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>건물 관리</h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
            전체 {(buildings ?? []).length}개
          </p>
        </div>
      </header>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
        <BuildingList buildings={(buildings ?? []) as any} />
      </div>
    </div>
  )
}
