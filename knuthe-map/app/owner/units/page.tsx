import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import UnitsClient from './_components/UnitsClient'

export default async function OwnerUnitsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  const { data: ownerBuilding } = await supabase
    .from('owner_buildings')
    .select('building_id, buildings ( id, name, address, total_floors )')
    .eq('owner_id', user.id)
    .single()

  if (!ownerBuilding) redirect('/owner')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const building = ownerBuilding.buildings as any

  const { data: units } = await supabase
    .from('building_units')
    .select('id, floor, unit_number, area_m2, room_type, status, base_deposit, base_rent, images, main_image_idx')
    .eq('building_id', building.id)
    .order('floor', { ascending: false })
    .order('unit_number')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', paddingBottom: 100 }}>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-overlay)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/owner" style={{
          width: 34, height: 34, borderRadius: 10, background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>호실 관리</h1>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
            {building.name ?? building.address}
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <UnitsClient
          buildingId={building.id}
          totalFloors={building.total_floors ?? null}
          initialUnits={units ?? []}
        />
      </div>
    </div>
  )
}
