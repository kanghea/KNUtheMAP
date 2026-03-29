import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'

export default async function AgentPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role, nickname').eq('id', user.id).single()
  if (!profile || !['agent', 'admin'].includes(profile.role)) redirect('/')

  // 관리 건물 수
  const { count: buildingCount } = await supabase
    .from('agent_buildings')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', user.id)

  // 활성 매물 수
  const { count: listingCount } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('listed_by', user.id)
    .eq('is_active', true)

  // 최근 관리 건물
  const { data: buildings } = await supabase
    .from('agent_buildings')
    .select('buildings ( id, name, address, zone )')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>중개사 대시보드</h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
            {profile.nickname ?? user.email}
          </p>
        </div>
        <Link href="/me" style={{
          width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 통계 요약 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '관리 건물', value: buildingCount ?? 0, icon: '🏢', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', href: '/agent/buildings' },
            { label: '활성 매물', value: listingCount ?? 0,  icon: '📋', color: '#60a5fa', bg: 'rgba(37,99,235,0.12)',  href: '/agent/listings' },
          ].map((s) => (
            <Link key={s.href} href={s.href} style={{
              background: s.bg, borderRadius: 16, padding: '18px 16px',
              border: `1px solid ${s.color}30`, textDecoration: 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </Link>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <div style={{
          background: '#111111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)', overflow: 'hidden',
        }}>
          {[
            { href: '/agent/buildings', icon: '🏢', label: '건물 관리', desc: '관리 건물 추가·확인' },
            { href: '/agent/listings',  icon: '📝', label: '매물 등록·관리', desc: '방 매물 올리기' },
            { href: '/agent/stats',     icon: '📊', label: '통계', desc: '조회수·찜 현황 확인' },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', textDecoration: 'none',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: 'transparent',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{item.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>

        {/* 최근 관리 건물 */}
        {(buildings ?? []).length > 0 && (
          <div style={{
            background: '#111111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>관리 건물</h2>
              <Link href="/agent/buildings" style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none' }}>
                전체 보기
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(buildings ?? []).map((ab, i) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const b = (ab.buildings as any)
                if (!b) return null
                return (
                  <Link key={i} href={`/buildings/${b.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                    textDecoration: 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.name ?? '이름 없는 건물'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.address}
                      </div>
                    </div>
                    {b.zone && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', flexShrink: 0,
                      }}>{b.zone}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
