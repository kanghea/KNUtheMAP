import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ZONE_DATA } from '@/lib/zone-data'

export default async function ZonePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const zoneName = decodeURIComponent(name)
  const zone = ZONE_DATA[zoneName]

  if (!zone) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', fontFamily: 'inherit' }}>

      {/* ── 히어로 ────────────────────────────────────────────────────── */}
      <div style={{ height: 240, background: zone.imageColor, position: 'relative' }}>
        <Link href="/map" style={{
          position: 'absolute', top: 16, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '60px 20px 20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
        }}>
          <p style={{ margin: '0 0 2px', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
            {zone.area}
          </p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text-inverse)', letterSpacing: '-0.03em' }}>
            {zone.shortName} 구역
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* ── 설명 카드 ─────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 20, padding: '20px',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-xs)',
          margin: '16px 0',
        }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>
            {zone.description}
          </p>
        </div>

        {/* ── 이 동네는 이런 점이 좋아요 ──────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 4px' }}>
            이 동네는 이런 점이 좋아요!
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {zone.highlights.map((h) => (
              <div key={h.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--color-primary-bg)', borderRadius: 999,
                padding: '8px 14px',
              }}>
                <span style={{ fontSize: 16 }}>{h.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary-hover)' }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 장단점 ────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 20, padding: '20px',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                장점
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {zone.pros.map((p) => (
                  <li key={p} style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', gap: 5 }}>
                    <span style={{ color: 'var(--color-green)', flexShrink: 0 }}>•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                단점
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {zone.cons.map((c) => (
                  <li key={c} style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', gap: 5 }}>
                    <span style={{ color: '#dc2626', flexShrink: 0 }}>•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── 주변 시설 ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 4px' }}>
            주변 시설
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {zone.nearbyFacilities.map((f) => (
              <span key={f} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                borderRadius: 8, padding: '6px 12px',
                fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500,
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <Link
          href={`/map?zone=${encodeURIComponent(zone.name)}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--color-primary)', color: 'var(--text-inverse)',
            borderRadius: 16, padding: '16px',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          {zone.shortName} 구역 건물 보기
        </Link>
      </div>
    </div>
  )
}
