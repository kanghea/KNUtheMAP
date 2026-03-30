// 랜딩 페이지 — 재방문 사용자용 (서버 컴포넌트)

import Link from 'next/link'
import Image from 'next/image'
import { UserPrefs, FACTOR_META } from '@/lib/prefs'
import { DEPARTMENTS } from '@/lib/department-zones'
import RoomFilterCard from './_room-filter'
import MyContractsCard from '@/components/contracts/MyContractsCard'

// ── 단과대별 히어로 색상 ──────────────────────────────────────────

const COLLEGE_COLORS: Record<string, { from: string; to: string; mid: string; accent: string; shadow: string }> = {
  '인문대학':         { from: '#3b0764', mid: '#6d28d9', to: '#7c3aed', accent: '#a78bfa', shadow: 'rgba(109,40,217,0.32)' },
  '사회과학대학':     { from: '#134e4a', mid: '#0f766e', to: '#0d9488', accent: '#2dd4bf', shadow: 'rgba(13,148,136,0.32)' },
  '자연과학대학':     { from: '#0c4a6e', mid: '#0369a1', to: '#0284c7', accent: '#38bdf8', shadow: 'rgba(2,132,199,0.32)' },
  '경상대학':         { from: '#14532d', mid: '#15803d', to: '#059669', accent: '#34d399', shadow: 'rgba(5,150,105,0.32)' },
  '공과대학':         { from: '#431407', mid: '#c2410c', to: '#ea580c', accent: '#fb923c', shadow: 'rgba(234,88,12,0.32)' },
  'IT대학':           { from: '#1e1b4b', mid: '#3730a3', to: '#4338ca', accent: '#818cf8', shadow: 'rgba(67,56,202,0.32)' },
  '농업생명과학대학': { from: '#052e16', mid: '#15803d', to: '#16a34a', accent: '#4ade80', shadow: 'rgba(22,163,74,0.32)' },
  '예술대학':         { from: '#500724', mid: '#be123c', to: '#e11d48', accent: '#fb7185', shadow: 'rgba(225,29,72,0.32)' },
  '사범대학':         { from: '#172554', mid: '#1e40af', to: '#1d4ed8', accent: '#60a5fa', shadow: 'rgba(29,78,216,0.32)' },
  '수의과대학':       { from: '#0d3331', mid: '#0f766e', to: '#0d9488', accent: '#2dd4bf', shadow: 'rgba(13,148,136,0.32)' },
  '생활과학대학':     { from: '#2e1065', mid: '#7e22ce', to: '#a855f7', accent: '#c084fc', shadow: 'rgba(168,85,247,0.32)' },
  '간호대학':         { from: '#083344', mid: '#0e7490', to: '#0891b2', accent: '#22d3ee', shadow: 'rgba(8,145,178,0.32)' },
  '약학대학':         { from: '#064e3b', mid: '#047857', to: '#10b981', accent: '#6ee7b7', shadow: 'rgba(16,185,129,0.32)' },
  '첨단기술융합대학': { from: '#1a0533', mid: '#7e22ce', to: '#9333ea', accent: '#c084fc', shadow: 'rgba(147,51,234,0.32)' },
  '독립학부':         { from: '#0f172a', mid: '#1e293b', to: '#334155', accent: '#94a3b8', shadow: 'rgba(51,65,85,0.32)' },
  '의과대학':         { from: '#450a0a', mid: '#b91c1c', to: '#dc2626', accent: '#f87171', shadow: 'rgba(220,38,38,0.32)' },
}
const DEFAULT_COLLEGE_COLOR = { from: '#1e3a8a', mid: '#1d4ed8', to: '#2563eb', accent: '#60a5fa', shadow: 'rgba(37,99,235,0.28)' }

// ── 테마 토큰 ────────────────────────────────────────────────────

const THEME = {
  dark: {
    pageBg:         '#0a0a0a',
    cardBg:         '#111111',
    cardBorder:     'rgba(255,255,255,0.07)',
    textPrimary:    '#ffffff',
    textSecondary:  'rgba(255,255,255,0.5)',
    textTertiary:   'rgba(255,255,255,0.25)',
    headerBg:       'rgba(10,10,10,0.92)',
    headerBorder:   'rgba(255,255,255,0.07)',
    settingsBg:     '#1a1a1a',
    settingsBorder: 'rgba(255,255,255,0.15)',
    settingsColor:  'rgba(255,255,255,0.5)',
    zoneBg:         '#111111',
    zoneBorder:     'rgba(255,255,255,0.07)',
    zoneText:       '#ffffff',
    zoneDesc:       'rgba(255,255,255,0.35)',
    shadow:         '0 8px 32px rgba(0,0,0,0.5)',
    priorityBg:     ['rgba(37,99,235,0.12)', 'rgba(124,58,237,0.12)', 'rgba(8,145,178,0.12)'],
    priorityColors: ['#2563eb', '#7c3aed', '#0891b2'],
    priorityText:   '#ffffff',
    priorityLabel:  '#ffffff',
    prioritySub:    'rgba(255,255,255,0.35)',
    gateBg:         'rgba(255,255,255,0.05)',
    gateText:       'rgba(255,255,255,0.65)',
    gateStrong:     '#ffffff',
    footerText:     'rgba(255,255,255,0.35)',
    footerDot:      'rgba(255,255,255,0.12)',
    logoFilter:     'brightness(0) invert(1)',
  },
  light: {
    pageBg:         '#f8fafc',
    cardBg:         '#ffffff',
    cardBorder:     '#e2e8f0',
    textPrimary:    '#0f172a',
    textSecondary:  '#64748b',
    textTertiary:   '#94a3b8',
    headerBg:       'rgba(248,250,252,0.92)',
    headerBorder:   '#e2e8f0',
    settingsBg:     '#f1f5f9',
    settingsBorder: '#e2e8f0',
    settingsColor:  '#64748b',
    zoneBg:         '#ffffff',
    zoneBorder:     '#e2e8f0',
    zoneText:       '#0f172a',
    zoneDesc:       '#94a3b8',
    shadow:         '0 8px 32px rgba(0,0,0,0.10)',
    priorityBg:     ['rgba(37,99,235,0.08)', 'rgba(124,58,237,0.08)', 'rgba(8,145,178,0.08)'],
    priorityColors: ['#2563eb', '#7c3aed', '#0891b2'],
    priorityText:   '#0f172a',
    priorityLabel:  '#0f172a',
    prioritySub:    '#64748b',
    gateBg:         '#f1f5f9',
    gateText:       '#64748b',
    gateStrong:     '#0f172a',
    footerText:     '#94a3b8',
    footerDot:      '#e2e8f0',
    logoFilter:     'none',
  },
} as const

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

  const theme = prefs.theme ?? 'dark'
  const tok   = THEME[theme]

  // 단과대 → 히어로 색상
  const college = prefs.dept
    ? (DEPARTMENTS.find((d) => d.name === prefs.dept)?.college ?? null)
    : null
  const col = (college ? COLLEGE_COLORS[college] : null) ?? DEFAULT_COLLEGE_COLOR

  const heroGradient = `linear-gradient(135deg, ${col.from} 0%, ${col.mid} 50%, ${col.to} 100%)`

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, fontFamily: 'inherit' }}>

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={32}
            height={32}
            style={{ objectFit: 'contain', filter: tok.logoFilter }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: tok.textPrimary, letterSpacing: '-0.02em' }}>
            KNUtheMAP
          </span>
        </div>
        <Link
          href="/?reset=1"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: tok.settingsColor, textDecoration: 'none',
            padding: '6px 12px', borderRadius: 999,
            background: tok.settingsBg, border: `1px solid ${tok.settingsBorder}`,
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
          background: heroGradient,
          borderRadius: 22, padding: '24px 22px 20px', color: '#fff',
          boxShadow: `0 8px 32px ${col.shadow}`,
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
              background: '#fff', color: col.mid,
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
            <span style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary }}>구역 바로가기</span>
            <Link href={mapUrl} style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
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
                    background: isMyZone ? `${col.to}22` : tok.zoneBg,
                    borderRadius: 14,
                    padding: '10px 14px',
                    border: isMyZone ? `1.5px solid ${col.to}` : `1px solid ${tok.zoneBorder}`,
                    textDecoration: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    minWidth: 64,
                    boxShadow: isMyZone ? `0 0 0 3px ${col.to}22` : tok.shadow,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{z.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isMyZone ? col.to : tok.zoneText }}>
                    {z.name}
                  </span>
                  <span style={{ fontSize: 10, color: tok.zoneDesc, whiteSpace: 'nowrap' }}>{z.desc}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── 방 조건 필터 ─────────────────────────────────────── */}
        <RoomFilterCard />

        {/* ── 내 계약 관리 ─────────────────────────────────────── */}
        <div style={{
          background: tok.cardBg, borderRadius: 20,
          border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow,
          marginBottom: 14, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>내 계약 관리</span>
            <Link href="/me" style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
              마이페이지 →
            </Link>
          </div>
          <MyContractsCard hideHeader />
        </div>

        {/* ── 내 우선순위 ──────────────────────────────────────── */}
        {topPriority.length > 0 && (
          <div style={{
            background: tok.cardBg, borderRadius: 20, padding: '16px 20px',
            border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow,
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>내 우선순위</span>
              <Link href="/?reset=1" style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
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
                    background: tok.priorityBg[i], borderRadius: 10, padding: '9px 12px',
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: tok.priorityColors[i], color: '#fff',
                      fontSize: 10, fontWeight: 800, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: tok.priorityLabel }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: tok.prioritySub }}>{meta.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {prefs.gate && (
              <div style={{
                marginTop: 8, padding: '9px 12px',
                background: tok.gateBg, borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🚪</span>
                <span style={{ fontSize: 12, color: tok.gateText, fontWeight: 500 }}>
                  주로 쓰는 문: <strong style={{ color: tok.gateStrong }}>{prefs.gate}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── 하단 링크 ────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '4px 0', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link href="/me" style={{ fontSize: 11, color: tok.footerText, textDecoration: 'none', fontWeight: 500 }}>
            마이페이지
          </Link>
          <span style={{ color: tok.footerDot, fontSize: 11 }}>·</span>
          <Link href="/?reset=1" style={{ fontSize: 11, color: tok.footerText, textDecoration: 'none', fontWeight: 500 }}>
            온보딩 다시 하기
          </Link>
        </div>

      </div>
    </div>
  )
}
