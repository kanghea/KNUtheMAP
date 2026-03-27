import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import ContractsClient from './_components/ContractsClient'

export default async function OwnerContractsPage() {
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

  const [{ data: contracts }, { data: unitOptions }] = await Promise.all([
    supabase
      .from('owner_contracts')
      .select(`
        id, unit_id, contract_type, deposit, monthly_rent, maintenance,
        contract_start, contract_end, status, tenant_name, tenant_phone,
        memo, is_auto_renew, created_at,
        building_units ( floor, unit_number, room_type )
      `)
      .eq('building_id', building.id)
      .order('contract_start', { ascending: false }),

    supabase
      .from('building_units')
      .select('id, floor, unit_number')
      .eq('building_id', building.id)
      .order('floor', { ascending: false })
      .order('unit_number'),
  ])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <Link href="/owner" style={{
          width: 34, height: 34, borderRadius: 10, background: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>계약 관리</h1>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            {building.name ?? building.address}
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <ContractsClient
          buildingId={building.id}
          initialContracts={contracts ?? []}
          units={unitOptions ?? []}
        />
      </div>
    </div>
  )
}
