// 랜딩 페이지 — 재방문 사용자용 (서버 컴포넌트)

import Link from 'next/link'
import Image from 'next/image'
import { UserPrefs, FACTOR_META } from '@/lib/prefs'
import RoomFilterCard from './_room-filter'
import MyContractsCard from '@/components/contracts/MyContractsCard'
import ThemeToggle from './_theme-toggle'

// ── 구역 정보 ─────────────────────────────────────────────────────

const ZONES = [
  { name: '북문', emoji: '🎓', desc: '도보 최단거리' },
  { name: '정문', emoji: '📚', desc: '자취방 밀집' },
  { name: '서문', emoji: '🌿', desc: '조용한 주거' },
  { name: '쪽문', emoji: '☕', desc: '카페거리 인접' },
  { name: '동문', emoji: '🌲', desc: '한적한 주거지' },
  { name: '텍문', emoji: '🎯', desc: '공대·IT대 인접' },
]

// ── 구역별 히어로 테마 ─────────────────────────────────────────

const ZONE_THEME: Record<string, { grad: string; shadow: string; accent: string; cta: string }> = {
  '북문': { grad: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)', shadow: 'rgba(37,99,235,0.35)',  accent: '#93c5fd', cta: '#2563eb' },
  '정문': { grad: 'linear-gradient(135deg, #052e16 0%, #059669 60%, #10b981 100%)', shadow: 'rgba(5,150,105,0.35)',  accent: '#6ee7b7', cta: '#059669' },
  '서문': { grad: 'linear-gradient(135deg, #2e1065 0%, #7c3aed 60%, #8b5cf6 100%)', shadow: 'rgba(124,58,237,0.35)', accent: '#c4b5fd', cta: '#7c3aed' },
  '쪽문': { grad: 'linear-gradient(135deg, #431407 0%, #c2410c 60%, #f97316 100%)', shadow: 'rgba(194,65,12,0.35)',  accent: '#fdba74', cta: '#c2410c' },
  '동문': { grad: 'linear-gradient(135deg, #042f2e 0%, #0d9488 60%, #14b8a6 100%)', shadow: 'rgba(13,148,136,0.35)', accent: '#5eead4', cta: '#0d9488' },
  '텍문': { grad: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6366f1 100%)', shadow: 'rgba(67,56,202,0.35)',  accent: '#a5b4fc', cta: '#4338ca' },
}
const DEFAULT_HERO = { grad: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)', shadow: 'rgba(37,99,235,0.35)', accent: '#93c5fd', cta: '#2563eb' }

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
  const hero        = (prefs.zone && ZONE_THEME[prefs.zone]) ?? DEFAULT_HERO
  const isDark      = (prefs.theme ?? 'dark') === 'dark'

  // ── 테마 변수 ────────────────────────────────────────────────
  const T = isDark ? {
    pageBg:        '#0a0a0a',
    cardBg:        '#111111',
    border:        'rgba(255,255,255,0.08)',
    headerBg:      'rgba(10,10,10,0.92)',
    headerBorder:  'rgba(255,255,255,0.07)',
    settingsBg:    'rgba(255,255,255,0.06)',
    settingsColor: 'rgba(255,255,255,0.5)',
    settingsBorder:'rgba(255,255,255,0.12)',
    sectionTitle:  '#ffffff',
    sectionLink:   'rgba(255,255,255,0.35)',
    zoneBg:        '#111111',
    zoneActive:    { bg: 'rgba(37,99,235,0.18)', border: 'rgba(37,99,235,0.5)', text: '#60a5fa', shadow: 'rgba(37,99,235,0.12)' },
    zoneInactive:  { bg: '#111111', border: 'rgba(255,255,255,0.08)', text: '#ffffff', shadow: 'none' },
    zoneDesc:      'rgba(255,255,255,0.35)',
    priorityBgs:   ['rgba(37,99,235,0.12)', 'rgba(124,58,237,0.12)', 'rgba(5,150,105,0.12)'] as string[],
    priorityColors:['#60a5fa', '#a78bfa', '#34d399'] as string[],
    priorityLabel: '#ffffff',
    prioritySub:   'rgba(255,255,255,0.4)',
    gateBg:        'rgba(255,255,255,0.05)',
    gateText:      'rgba(255,255,255,0.5)',
    footerColor:   'rgba(255,255,255,0.2)',
    footerDivider: 'rgba(255,255,255,0.15)',
    contractBorder:'rgba(255,255,255,0.08)',
    contractTitle: '#ffffff',
    contractLink:  'rgba(255,255,255,0.35)',
    logoFilter:    'none' as string | undefined,
  } : {
    pageBg:        '#f8fafc',
    cardBg:        '#ffffff',
    border:        '#f1f5f9',
    headerBg:      'rgba(248,250,252,0.92)',
    headerBorder:  '#f1f5f9',
    settingsBg:    '#f1f5f9',
    settingsColor: '#64748b',
    settingsBorder:'#e2e8f0',
    sectionTitle:  '#0f172a',
    sectionLink:   '#94a3b8',
    zoneBg:        '#ffffff',
    zoneActive:    { bg: '#eff6ff', border: '#2563eb', text: '#2563eb', shadow: 'rgba(37,99,235,0.08)' },
    zoneInactive:  { bg: '#ffffff', border: '#f1f5f9', text: '#0f172a', shadow: 'rgba(0,0,0,0.04)' },
    zoneDesc:      '#94a3b8',
    priorityBgs:   ['#eff6ff', '#f5f3ff', '#ecfeff'] as string[],
    priorityColors:['#2563eb', '#7c3aed', '#0891b2'] as string[],
    priorityLabel: '#0f172a',
    prioritySub:   '#94a3b8',
    gateBg:        '#f8fafc',
    gateText:      '#475569',
    footerColor:   '#cbd5e1',
    footerDivider: '#e2e8f0',
    contractBorder:'#f1f5f9',
    contractTitle: '#0f172a',
    contractLink:  '#94a3b8',
    logoFilter:    undefined,
  }

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: 'inherit' }}>

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: T.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={32} height={32}
            style={{ objectFit: 'contain', filter: T.logoFilter }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: T.sectionTitle, letterSpacing: '-0.02em' }}>
            KNUtheMAP
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle currentTheme={isDark ? 'dark' : 'light'} />
          <Link
            href="/?reset=1"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, color: T.settingsColor, textDecoration: 'none',
              padding: '6px 12px', borderRadius: 999,
              background: T.settingsBg, border: `1px solid ${T.settingsBorder}`,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
            설정
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* ── 히어로 ───────────────────────────────────────────── */}
        <div style={{
          margin: '16px 0 14px',
          background: hero.grad,
          borderRadius: 22,
          padding: '24px 22px 20px',
          color: '#fff',
          boxShadow: `0 8px 32px ${hero.shadow}`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 구 로고 워터마크 */}
          <div style={{
            position: 'absolute', right: -10, top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.13, pointerEvents: 'none', userSelect: 'none',
          }}>
            <Image
              src="/images/경북대 로고(구).webp"
              alt=""
              width={160} height={160}
              style={{ objectFit: 'contain', filter: 'brightness(10)' }}
            />
          </div>

          {/* 장식 원 */}
          <div style={{
            position: 'absolute', top: -30, right: 60,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />

          {/* 텍스트 */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: hero.accent, margin: 0, letterSpacing: '0.06em' }}>
                다시 오셨군요 👋
              </p>
              {prefs.zone && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: 'rgba(255,255,255,0.18)',
                  padding: '2px 8px', borderRadius: 999, color: '#fff',
                }}>
                  {prefs.zone}구역
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
              {heroLabel ?? '경북대 주변 방 찾기'}
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '0 0 20px' }}>
              {prefs.gate ? `${prefs.gate} 기준 · 맞춤 건물을 추천해드려요` : '경북대 주변 방을 찾아드릴게요'}
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/rooms" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#fff', color: hero.cta,
                borderRadius: 12, padding: '11px 0',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
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
        </div>

        {/* ── 구역 바로가기 ─────────────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.sectionTitle }}>구역 바로가기</span>
            <Link href={mapUrl} style={{ fontSize: 11, color: T.sectionLink, textDecoration: 'none', fontWeight: 500 }}>
              전체 지도 →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {ZONES.map((z) => {
              const isMyZone = prefs.zone === z.name
              const zs = isMyZone ? T.zoneActive : T.zoneInactive
              return (
                <Link
                  key={z.name}
                  href={`/map?zone=${encodeURIComponent(z.name)}${prefs.priorities.length ? `&p=${prefs.priorities.join(',')}` : ''}${prefs.gate ? `&gate=${encodeURIComponent(prefs.gate)}` : ''}`}
                  style={{
                    flexShrink: 0,
                    background: zs.bg, borderRadius: 14, padding: '10px 14px',
                    border: `${isMyZone ? '1.5px' : '1px'} solid ${zs.border}`,
                    textDecoration: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    minWidth: 64,
                    boxShadow: isMyZone ? `0 0 0 3px ${zs.shadow}` : (isDark ? 'none' : `0 1px 4px ${zs.shadow}`),
                  }}
                >
                  <span style={{ fontSize: 20 }}>{z.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: zs.text }}>{z.name}</span>
                  <span style={{ fontSize: 10, color: T.zoneDesc, whiteSpace: 'nowrap' }}>{z.desc}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── 방 조건 필터 ─────────────────────────────────────── */}
        <RoomFilterCard theme={isDark ? 'dark' : 'light'} />

        {/* ── 내 계약 관리 ─────────────────────────────────────── */}
        <div style={{
          background: T.cardBg, borderRadius: 20,
          border: `1px solid ${T.contractBorder}`,
          boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.04)',
          marginBottom: 14, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.contractTitle }}>내 계약 관리</span>
            <Link href="/me" style={{ fontSize: 11, color: T.contractLink, textDecoration: 'none', fontWeight: 500 }}>
              마이페이지 →
            </Link>
          </div>
          <MyContractsCard hideHeader theme={isDark ? 'dark' : 'light'} />
        </div>

        {/* ── 내 우선순위 ──────────────────────────────────────── */}
        {topPriority.length > 0 && (
          <div style={{
            background: T.cardBg, borderRadius: 20, padding: '16px 20px',
            border: `1px solid ${T.border}`,
            boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.04)',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.sectionTitle }}>내 우선순위</span>
              <Link href="/?reset=1" style={{ fontSize: 11, color: T.sectionLink, textDecoration: 'none', fontWeight: 500 }}>
                변경
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topPriority.map((pid, i) => {
                const meta = FACTOR_META[pid]
                if (!meta) return null
                return (
                  <div key={pid} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: T.priorityBgs[i], borderRadius: 10, padding: '9px 12px',
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: T.priorityColors[i],
                      color: isDark ? '#000' : '#fff',
                      fontSize: 10, fontWeight: 800, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.priorityLabel }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: T.prioritySub }}>{meta.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {prefs.gate && (
              <div style={{
                marginTop: 8, padding: '9px 12px',
                background: T.gateBg, borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🚪</span>
                <span style={{ fontSize: 12, color: T.gateText, fontWeight: 500 }}>
                  주로 쓰는 문: <strong style={{ color: T.sectionTitle }}>{prefs.gate}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── 하단 링크 ────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '4px 0', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link href="/me" style={{ fontSize: 11, color: T.footerColor, textDecoration: 'none', fontWeight: 500 }}>
            마이페이지
          </Link>
          <span style={{ color: T.footerDivider, fontSize: 11 }}>·</span>
          <Link href="/?reset=1" style={{ fontSize: 11, color: T.footerColor, textDecoration: 'none', fontWeight: 500 }}>
            온보딩 다시 하기
          </Link>
        </div>

      </div>
    </div>
  )
}
