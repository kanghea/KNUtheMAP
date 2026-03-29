'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { MapFilters, DEFAULT_FILTERS } from '@/components/map/DynamicFilter'
import { MAJOR_GATES } from '@/lib/gate-utils'
import { useFilters } from '@/lib/filter-context'

const BUILDING_TYPES = [
  { key: null,       label: '전체' },
  { key: '단독주택', label: '단독주택' },
  { key: '공동주택', label: '공동주택' },
  { key: '상가',     label: '상가·근린' },
  { key: '기타',     label: '기타' },
]

const ROOM_OPTIONS = [
  '에어컨', '냉장고', '세탁기', '전자레인지',
  '주차장', '인터넷', '엘리베이터', 'CCTV',
  '가스레인지', '반려동물', '옷장', '신발장',
]

const GATE_MINUTES = [5, 10, 15, 20]

const fmtWon = (v: number) => `${v.toLocaleString()}만`
const fmtAge = (v: number) => v === 0 ? '신축' : `${v}년`

function isDefault(f: MapFilters): boolean {
  return (
    f.buildingType === DEFAULT_FILTERS.buildingType &&
    f.rentRange[0]    === DEFAULT_FILTERS.rentRange[0]    && f.rentRange[1]    === DEFAULT_FILTERS.rentRange[1] &&
    f.depositRange[0] === DEFAULT_FILTERS.depositRange[0] && f.depositRange[1] === DEFAULT_FILTERS.depositRange[1] &&
    f.ageRange[0]     === DEFAULT_FILTERS.ageRange[0]     && f.ageRange[1]     === DEFAULT_FILTERS.ageRange[1] &&
    f.options.length  === 0 &&
    f.gate === null && f.gateMinutes === null
  )
}

// ── 칩 ───────────────────────────────────────────────────────────────

function Chip({ label, active, onClick, isDark }: { label: string; active: boolean; onClick: () => void; isDark: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px', borderRadius: 999, fontSize: 12,
        fontWeight: active ? 700 : 500,
        border: active ? '1.5px solid #2563eb' : `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
        background: active ? (isDark ? 'rgba(37,99,235,0.2)' : '#eff6ff') : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
        color: active ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? 'rgba(255,255,255,0.5)' : '#64748b'),
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

// ── 듀얼 레인지 슬라이더 ──────────────────────────────────────────────

function DualRange({
  min, max, from, to, step = 1, onChange, fmtMin, fmtMax, isDark,
}: {
  min: number; max: number; from: number; to: number; step?: number
  onChange: (f: number, t: number) => void
  fmtMin: (v: number) => string; fmtMax: (v: number) => string
  isDark: boolean
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const thumbStyle: React.CSSProperties = {
    WebkitAppearance: 'none', appearance: 'none',
    position: 'absolute', inset: 0, width: '100%',
    background: 'transparent', pointerEvents: 'none', cursor: 'grab',
  }
  return (
    <>
      <style>{`
        .lf-thumb::-webkit-slider-thumb { -webkit-appearance:none; pointer-events:all; width:18px; height:18px; border-radius:50%; background:#2563eb; cursor:grab; box-shadow:0 2px 6px rgba(37,99,235,.4); }
        .lf-thumb::-moz-range-thumb { pointer-events:all; width:18px; height:18px; border-radius:50%; background:#2563eb; cursor:grab; border:none; box-shadow:0 2px 6px rgba(37,99,235,.4); }
      `}</style>
      <div style={{ paddingBottom: 4 }}>
        <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', inset: '0 0', height: 3, margin: 'auto 0',
            background: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0', borderRadius: 999,
          }}>
            <div style={{
              position: 'absolute', height: '100%', background: '#2563eb', borderRadius: 999,
              left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%`,
            }} />
          </div>
          <input
            type="range" min={min} max={max} value={from} step={step}
            className="lf-thumb"
            style={{ ...thumbStyle, zIndex: from > max - (max - min) * 0.08 ? 5 : 3 }}
            onChange={(e) => { const v = +e.target.value; if (v <= to - step) onChange(v, to) }}
          />
          <input
            type="range" min={min} max={max} value={to} step={step}
            className="lf-thumb"
            style={{ ...thumbStyle, zIndex: 4 }}
            onChange={(e) => { const v = +e.target.value; if (v >= from + step) onChange(from, v) }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>{fmtMin(from)}</span>
          <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>{fmtMax(to)}{to === max ? '+' : ''}</span>
        </div>
      </div>
    </>
  )
}

// ── 섹션 행 ───────────────────────────────────────────────────────────

function Section({
  label, summary, open, onToggle, children, maxH = 120, isDark,
}: {
  label: string; summary: string; open: boolean; onToggle: () => void
  children: React.ReactNode; maxH?: number; isDark: boolean
}) {
  const muted = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8'
  return (
    <div style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : '#374151' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: muted }}>{summary}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? maxH : 0, transition: 'max-height .25s ease' }}>
        <div style={{ paddingBottom: 12 }}>{children}</div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

export default function RoomFilterCard({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const isDark = theme === 'dark'
  const { filters: filter, setFilters } = useFilters()
  const [section,      setSection]      = useState<string | null>(null)
  const [notifOn,      setNotifOn]      = useState(false)
  const [showLogin,    setShowLogin]    = useState(false)
  const [loggedIn,     setLoggedIn]     = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [expanded,     setExpanded]     = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session)
      if (session) setShowLogin(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const set = <K extends keyof MapFilters>(key: K, val: MapFilters[K]) =>
    setFilters({ ...filter, [key]: val })

  const toggleOption = (opt: string) =>
    setFilters({ ...filter, options: filter.options.includes(opt)
      ? filter.options.filter((o) => o !== opt)
      : [...filter.options, opt] })

  const toggleSection = (s: string) => setSection((prev) => prev === s ? null : s)

  const handleNotifToggle = () => {
    if (!loggedIn) { setShowLogin(true); return }
    setNotifOn((v) => !v)
  }

  const handleGoogleLogin = async () => {
    setLoginLoading(true)
    const supabase = createBrowserSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const rentSummary    = `${fmtWon(filter.rentRange[0])} ~ ${fmtWon(filter.rentRange[1])}${filter.rentRange[1] === DEFAULT_FILTERS.rentRange[1] ? '+' : ''}`
  const depositSummary = `${fmtWon(filter.depositRange[0])} ~ ${fmtWon(filter.depositRange[1])}${filter.depositRange[1] === DEFAULT_FILTERS.depositRange[1] ? '+' : ''}`
  const ageSummary     = `${fmtAge(filter.ageRange[0])} ~ ${fmtAge(filter.ageRange[1])}${filter.ageRange[1] === DEFAULT_FILTERS.ageRange[1] ? '+' : ''}`
  const gateSummary    = filter.gate && filter.gateMinutes ? `${filter.gate} · ${filter.gateMinutes}분 이내` : '설정 안 함'

  // 테마 변수
  const cardBg     = isDark ? '#111111'                    : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)'     : '#f1f5f9'
  const sectionDiv = isDark ? 'rgba(255,255,255,0.07)'     : '#f8fafc'
  const labelColor = isDark ? 'rgba(255,255,255,0.35)'     : '#94a3b8'
  const titleColor = isDark ? '#ffffff'                    : '#0f172a'
  const subColor   = isDark ? 'rgba(255,255,255,0.35)'     : '#94a3b8'
  const notifBg    = isDark ? 'rgba(255,255,255,0.04)'     : '#f8fafc'
  const notifBd    = isDark ? 'rgba(255,255,255,0.08)'     : '#f1f5f9'
  const toggleOff  = isDark ? 'rgba(255,255,255,0.15)'     : '#e2e8f0'
  const loginPanelBg = isDark ? 'rgba(255,255,255,0.03)'   : '#fff'
  const loginPanelBd = isDark ? 'rgba(255,255,255,0.07)'   : '#f1f5f9'
  const resetBg    = isDark ? 'rgba(255,255,255,0.05)'     : '#f8fafc'
  const resetColor = isDark ? 'rgba(255,255,255,0.5)'      : '#64748b'
  const resetBd    = isDark ? 'rgba(255,255,255,0.12)'     : '#e2e8f0'

  return (
    <div style={{
      background: cardBg, borderRadius: 20, border: `1px solid ${cardBorder}`,
      boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.04)',
      marginBottom: 16, overflow: 'hidden',
    }}>

      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 10,
            background: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>
            🔍
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: titleColor, lineHeight: 1.3 }}>
              원하는 방 조건 설정
            </div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 1 }}>
              {isDefault(filter) ? '건물 종류·가격대·옵션·출입문 거리 선택' : '조건이 설정되어 있어요'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {notifOn && loggedIn && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: isDark ? '#60a5fa' : '#2563eb',
              background: isDark ? 'rgba(37,99,235,0.2)' : '#eff6ff',
              borderRadius: 999, padding: '3px 8px',
            }}>알림 ON</span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={subColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* ── 펼친 내용 ────────────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${sectionDiv}` }}>

          {/* 건물 종류 */}
          <div style={{ padding: '14px 0 12px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: labelColor, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              건물 종류
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BUILDING_TYPES.map(({ key, label }) => (
                <Chip key={String(key)} label={label} isDark={isDark}
                  active={filter.buildingType === key}
                  onClick={() => set('buildingType', key)}
                />
              ))}
            </div>
          </div>

          <Section label="월세 범위" summary={rentSummary} open={section === 'rent'} onToggle={() => toggleSection('rent')} isDark={isDark}>
            <DualRange min={0} max={200} step={5} isDark={isDark}
              from={filter.rentRange[0]} to={filter.rentRange[1]}
              onChange={(f, t) => set('rentRange', [f, t])}
              fmtMin={fmtWon} fmtMax={fmtWon}
            />
          </Section>

          <Section label="보증금 범위" summary={depositSummary} open={section === 'deposit'} onToggle={() => toggleSection('deposit')} isDark={isDark}>
            <DualRange min={0} max={5000} step={100} isDark={isDark}
              from={filter.depositRange[0]} to={filter.depositRange[1]}
              onChange={(f, t) => set('depositRange', [f, t])}
              fmtMin={fmtWon} fmtMax={fmtWon}
            />
          </Section>

          <Section label="건물 연식" summary={ageSummary} open={section === 'age'} onToggle={() => toggleSection('age')} isDark={isDark}>
            <DualRange min={0} max={60} step={1} isDark={isDark}
              from={filter.ageRange[0]} to={filter.ageRange[1]}
              onChange={(f, t) => set('ageRange', [f, t])}
              fmtMin={fmtAge} fmtMax={fmtAge}
            />
          </Section>

          <Section label="출입문 거리" summary={gateSummary} open={section === 'gate'} onToggle={() => toggleSection('gate')} maxH={200} isDark={isDark}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: labelColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                기준 출입문
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {MAJOR_GATES.map((g) => (
                  <Chip key={g.name} label={g.name} isDark={isDark}
                    active={filter.gate === g.name}
                    onClick={() => set('gate', filter.gate === g.name ? null : g.name)}
                  />
                ))}
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: labelColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                최대 도보 시간
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GATE_MINUTES.map((min) => (
                  <Chip key={min} label={`${min}분 이내`} isDark={isDark}
                    active={filter.gateMinutes === min}
                    onClick={() => set('gateMinutes', filter.gateMinutes === min ? null : min)}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* 방 옵션 */}
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: labelColor, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              방 옵션
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ROOM_OPTIONS.map((opt) => (
                <Chip key={opt} label={opt} isDark={isDark}
                  active={filter.options.includes(opt)}
                  onClick={() => toggleOption(opt)}
                />
              ))}
            </div>
          </div>

          {/* 초기화 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 16 }}>
            <button
              onClick={() => { setFilters(DEFAULT_FILTERS); setSection(null) }}
              style={{
                flex: 1, padding: '11px', borderRadius: 12,
                background: resetBg, color: resetColor,
                border: `1px solid ${resetBd}`, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              필터 초기화
            </button>
          </div>

          {/* ── 알림 설정 ─────────────────────────────────────── */}
          <div style={{ background: notifBg, borderRadius: 14, border: `1px solid ${notifBd}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: titleColor }}>새 매물 알림</div>
                  <div style={{ fontSize: 11, color: subColor, marginTop: 1 }}>
                    조건에 맞는 방이 등록되면 알려드려요
                  </div>
                </div>
              </div>
              <button
                onClick={handleNotifToggle}
                style={{
                  width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: notifOn && loggedIn ? '#2563eb' : toggleOff,
                  position: 'relative', flexShrink: 0, transition: 'background .2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: notifOn && loggedIn ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left .2s',
                }} />
              </button>
            </div>

            {showLogin && !loggedIn && (
              <div style={{ borderTop: `1px solid ${loginPanelBd}`, padding: '14px 16px', background: loginPanelBg }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : '#475569', lineHeight: 1.6 }}>
                  알림 설정은 <strong style={{ color: titleColor }}>로그인</strong>이 필요해요.
                  조건에 맞는 새 매물이 등록되면 바로 알려드려요!
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '11px 16px', borderRadius: 12,
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                    background: loginLoading
                      ? (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc')
                      : (isDark ? 'rgba(255,255,255,0.08)' : '#fff'),
                    fontSize: 13, fontWeight: 700, color: titleColor,
                    cursor: loginLoading ? 'default' : 'pointer',
                  }}
                >
                  {loginLoading ? '로그인 중…' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google로 로그인하기
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLogin(false)}
                  style={{
                    width: '100%', marginTop: 8, padding: '8px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8',
                  }}
                >
                  나중에 하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
