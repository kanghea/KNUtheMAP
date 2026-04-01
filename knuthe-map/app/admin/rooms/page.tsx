import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import RoomList from './_components/RoomList'

export default async function AdminRoomsPage() {
  const [user, role] = await Promise.all([getServerUser(), getServerRole()])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const service = createServiceClient()
  const { data: rooms } = await service
    .from('rooms')
    .select(`
      id, contract_type, deposit, monthly_rent,
      area_m2, floor, room_type, is_active, created_at, images,
      buildings ( name, address, zone ),
      users!rooms_listed_by_fkey ( email, nickname )
    `)
    .order('created_at', { ascending: false })

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
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>방(매물) 관리</h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
            전체 {(rooms ?? []).length}개
          </p>
        </div>
      </header>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
        <RoomList rooms={(rooms ?? []) as any} />
      </div>
    </div>
  )
}
