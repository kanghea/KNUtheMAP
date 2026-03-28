// 랜딩 페이지 — 재방문 사용자용 (서버 컴포넌트)

import Link from 'next/link'
import Image from 'next/image'
import { UserPrefs, FACTOR_META } from '@/lib/prefs'
import RoomFilterCard from './_room-filter'
import MyContractsCard from '@/components/contracts/MyContractsCard'

// ── 구역 정보 ─────────────────────────────────────────────────────

const ZONES = [
  { name: '북문', emoji: '🎓', desc: '도보 최단거리' },
  { name: '정문', emoji: '📚', desc: '자취방 밀집' },
  { name: '서문', emoji: '🌿', desc: '조용한 주거' },
  { name: '쪽문', emoji: '☕', desc: '카페거리 인접' },
  { name: '동문', emoji: '🌲', desc: '한적한 주거지' },
  { name: '텍문', emoji: '🎯', desc: '공대·IT대 인접' },
]

// ── 유틸 ─────────────────────────────────────────────────────────

function buildMapUrl(prefs: UserPrefs): string {
  const p = new URLSearchParams()
  if (prefs.zone)              p.set('zone', prefs.zone)
  if (prefs.priorities.length) p.set('p',    prefs.priorities.join(','))
  if (prefs.gate)              p.set('gate', prefs.gate)
  return `/map?${p.toString()}`
}

// ── 컴포넌트 ──────────────────────────────────────────────────────

export default function LandingPage({ prefs }: { prefs: UserPrefs }) {
  const mapUrl      = buildMapUrl(prefs)
  const topPriority = prefs.priorities.slice(0, 3)
  const gradeLabel  = prefs.grade ? `${prefs.grade}` : null
  const heroLabel   = [gradeLabel, prefs.dept].filter(Boolean).join(' · ') || null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'inherit' }}>

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={32}
            height={32}
            style={{ objectFit: 'contain' }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            KNUtheMAP
          </span>
        </div>
        <Link
          href="/?reset=1"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: 999,
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          설정
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* ── 히어로 ───────────────────────────────────────────── */}
        <div style={{
          margin: '16px 0 14px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)',
          borderRadius: 22, padding: '24px 22px 20px', color: '#fff',
          boxShadow: '0 8px 32px rgba(37,99,235,0.22)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 4, letterSpacing: '0.06em' }}>
            다시 오셨군요 👋
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.03em', lineHeight: 1.3 }}>
            {heroLabel ?? '경북대 주변 방 찾기'}
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 18px' }}>
            {prefs.gate ? `${prefs.gate} 기준 · 맞춤 건물을 추천해드려요` : '경북대 주변 방을 찾아드릴게요'}
          </p>

          {/* CTA 버튼 2개 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/rooms" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#fff', color: '#2563eb',
              borderRadius: 12, padding: '11px 0',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/><path d="M9 21V9"/>
              </svg>
              방 보기
            </Link>
            <Link href={mapUrl} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              borderRadius: 12, padding: '11px 0',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              건물 지도
            </Link>
          </div>
        </div>

        {/* ── 구역 바로가기 (가로 스크롤) ─────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>구역 바로가기</span>
            <Link href={mapUrl} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}>
              전체 지도 →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none',
          }}>
            {ZONES.map((z) => {
              const isMyZone = prefs.zone === z.name
              return (
                <Link
                  key={z.name}
                  href={`/map?zone=${encodeURIComponent(z.name)}${prefs.priorities.length ? `&p=${prefs.priorities.join(',')}` : ''}${prefs.gate ? `&gate=${encodeURIComponent(prefs.gate)}` : ''}`}
                  style={{
                    flexShrink: 0,
                    background: isMyZone ? 'rgba(37,99,235,0.15)' : '#111111',
                    borderRadius: 14,
                    padding: '10px 14px',
                    border: isMyZone ? '1.5px solid #2563eb' : '1px solid rgba(255,255,255,0.07)',
                    textDecoration: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    minWidth: 64,
                    boxShadow: isMyZone ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{z.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isMyZone ? '#2563eb' : '#ffffff' }}>
                    {z.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{z.desc}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── 방 조건 필터 ─────────────────────────────────────── */}
        <RoomFilterCard />

        {/* ── 내 계약 관리 ─────────────────────────────────────── */}
        <div style={{
          background: '#111111', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          marginBottom: 14, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>내 계약 관리</span>
            <Link href="/me" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}>
              마이페이지 →
            </Link>
          </div>
          <MyContractsCard hideHeader />
        </div>

        {/* ── 내 우선순위 ──────────────────────────────────────── */}
        {topPriority.length > 0 && (
          <div style={{
            background: '#111111', borderRadius: 20, padding: '16px 20px',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>내 우선순위</span>
              <Link href="/?reset=1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}>
                변경
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topPriority.map((pid, i) => {
                const meta   = FACTOR_META[pid]
                if (!meta) return null
                const colors = ['#2563eb', '#7c3aed', '#0891b2']
                const bgs    = ['rgba(37,99,235,0.12)', 'rgba(124,58,237,0.12)', 'rgba(8,145,178,0.12)']
                return (
                  <div key={pid} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: bgs[i], borderRadius: 10, padding: '9px 12px',
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: colors[i], color: '#fff',
                      fontSize: 10, fontWeight: 800, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{meta.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {prefs.gate && (
              <div style={{
                marginTop: 8, padding: '9px 12px',
                background: 'rgba(255,255,255,0.05)', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🚪</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                  주로 쓰는 문: <strong style={{ color: '#ffffff' }}>{prefs.gate}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── 하단 링크 ────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '4px 0', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link href="/me" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}>
            마이페이지
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>·</span>
          <Link href="/?reset=1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500 }}>
            온보딩 다시 하기
          </Link>
        </div>

      </div>
    </div>
  )
}
