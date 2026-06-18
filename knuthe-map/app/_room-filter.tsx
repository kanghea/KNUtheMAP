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

// ── 테마 토큰 ─────────────────────────────────────────────────────────

const TOK = {
  dark: {
    cardBg:          '#111111',
    border:          'rgba(255,255,255,0.07)',
    borderSoft:      'rgba(255,255,255,0.05)',
    altBg:           'rgba(255,255,255,0.04)',
    shadow:          '0 2px 12px rgba(0,0,0,0.3)',
    textPrimary:     '#ffffff',
    textSecond:      'rgba(255,255,255,0.65)',
    textThird:       '#94a3b8',
    iconBg:          'rgba(37,99,235,0.2)',
    chipActiveBg:    'rgba(37,99,235,0.2)',
    chipActiveBd:    '#3b82f6',
    chipActiveColor: '#60a5fa',
    chipBg:          'rgba(255,255,255,0.07)',
    chipBd:          'rgba(255,255,255,0.1)',
    chipColor:       'rgba(255,255,255,0.65)',
    rangeTxt:        'rgba(255,255,255,0.35)',
    resetBg:         'rgba(255,255,255,0.05)',
    resetBd:         'rgba(255,255,255,0.1)',
    resetColor:      'rgba(255,255,255,0.5)',
    notifBg:         'rgba(255,255,255,0.03)',
    notifBd:         'rgba(255,255,255,0.07)',
    notifOff:        'rgba(255,255,255,0.15)',
    badgeBg:         'rgba(37,99,235,0.2)',
    badgeColor:      '#60a5fa',
    loginPanelBg:    '#111111',
    loginBtnBd:      'rgba(255,255,255,0.15)',
    loginBtnBg:      '#1c1c1c',
    loginBtnColor:   'rgba(255,255,255,0.9)',
    loginSubColor:   'rgba(255,255,255,0.35)',
  },
  light: {
    cardBg:          '#ffffff',
    border:          '#f1f5f9',
    borderSoft:      '#f8fafc',
    altBg:           '#f8fafc',
    shadow:          '0 2px 12px rgba(0,0,0,0.04)',
    textPrimary:     '#0f172a',
    textSecond:      '#475569',
    textThird:       '#94a3b8',
    iconBg:          '#eff6ff',
    chipActiveBg:    '#eff6ff',
    chipActiveBd:    '#2563eb',
    chipActiveColor: '#2563eb',
    chipBg:          '#ffffff',
    chipBd:          '#e2e8f0',
    chipColor:       '#64748b',
    rangeTxt:        '#94a3b8',
    resetBg:         '#f8fafc',
    resetBd:         '#e2e8f0',
    resetColor:      '#64748b',
    notifBg:         '#f8fafc',
    notifBd:         '#f1f5f9',
    notifOff:        '#e2e8f0',
    badgeBg:         '#eff6ff',
    badgeColor:      '#2563eb',
    loginPanelBg:    '#ffffff',
    loginBtnBd:      '#e2e8f0',
    loginBtnBg:      '#ffffff',
    loginBtnColor:   '#374151',
    loginSubColor:   '#94a3b8',
  },
} as const

type Tok = typeof TOK[keyof typeof TOK]

// ── 유틸 ──────────────────────────────────────────────────────────────

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

function Chip({ label, active, onClick, tok }: { label: string; active: boolean; onClick: () => void; tok: Tok }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px', borderRadius: 999, fontSize: 12,
        fontWeight: active ? 700 : 500,
        border: `1.5px solid ${active ? tok.chipActiveBd : tok.chipBd}`,
        background: active ? tok.chipActiveBg : tok.chipBg,
        color: active ? tok.chipActiveColor : tok.chipColor,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

// ── 듀얼 레인지 슬라이더 ──────────────────────────────────────────────

function DualRange({
  min, max, from, to, step = 1, onChange, fmtMin, fmtMax, tok,
}: {
  min: number; max: number; from: number; to: number; step?: number
  onChange: (f: number, t: number) => void
  fmtMin: (v: number) => string; fmtMax: (v: number) => string
  tok: Tok
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const thumbStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    position: 'absolute', inset: 0, width: '100%',
    background: 'transparent', pointerEvents: 'none',
    cursor: 'grab',
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
            background: tok.chipBd, borderRadius: 999,
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
          <span style={{ fontSize: 11, color: tok.rangeTxt }}>{fmtMin(from)}</span>
          <span style={{ fontSize: 11, color: tok.rangeTxt }}>{fmtMax(to)}{to === max ? '+' : ''}</span>
        </div>
      </div>
    </>
  )
}

// ── 섹션 행 ───────────────────────────────────────────────────────────

function Section({
  label, summary, open, onToggle, children, maxH = 120, tok,
}: {
  label: string; summary: string; open: boolean; onToggle: () => void
  children: React.ReactNode; maxH?: number; tok: Tok
}) {
  return (
    <div style={{ borderBottom: `1px solid ${tok.border}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: tok.textPrimary }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: tok.textThird }}>{summary}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={tok.textThird} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? maxH : 0, transition: 'max-height .25s ease' }}>
        <div style={{ paddingBottom: 12 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────

export default function RoomFilterCard({ theme = 'light' }: { theme?: 'dark' | 'light' }) {
  const { filters: filter, setFilters } = useFilters()
  const [section,      setSection]      = useState<string | null>(null)
  const [notifOn,      setNotifOn]      = useState(false)
  const [showLogin,    setShowLogin]    = useState(false)
  // null = 세션 확인 중. false = 비로그인. true = 로그인.
  // false로 초기화하면 getSession() 응답 전에 토글을 누른 사용자에게
  // 항상 "로그인 필요" 패널이 잘못 뜨는 race가 발생함.
  const [loggedIn,     setLoggedIn]     = useState<boolean | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [expanded,     setExpanded]     = useState(false)
  // GET 응답 hydrate 가 끝나기 전에 디바운스 sync 가 도는 걸 막는 가드.
  // 없으면 다른 디바이스에서 로그인 → notifOn=true 로 올라오는 순간
  // 로컬 default filter 가 DB 의 저장된 조건을 덮어씀.
  const [hydrated,     setHydrated]     = useState(false)

  const tok: Tok = TOK[theme]

  useEffect(() => {
    const supabase = createBrowserSupabase()
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setLoggedIn(!!data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // 세션이 늦게 도착해 loggedIn이 true가 되면 이미 열려 있던 로그인 패널을 닫는다.
  useEffect(() => {
    if (loggedIn === true) setShowLogin(false)
  }, [loggedIn])

  // 로그인 직후 서버에서 saved_filters 의 notify + filters 상태를 hydrate.
  // 비로그인이거나 응답이 비면 notifOn 은 false 로 둔다.
  // notify=true 면 알림이 매칭하는 filters 도 함께 복원해야
  // 다른 디바이스에서 켰던 조건이 사라지지 않는다.
  useEffect(() => {
    if (loggedIn !== true) { setNotifOn(false); setHydrated(false); return }
    let cancelled = false
    fetch('/api/saved-filters', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (cancelled || !j) return
        if (typeof j.notify === 'boolean') setNotifOn(j.notify)
        // filters 가 실제 MapFilters 모양일 때만 적용. 빈 {} (행은 있는데 한 번도
        // 저장 안 한 상태) 이나 null (행 없음) 은 그대로 로컬 default 사용.
        if (j.notify === true && j.filters && typeof j.filters === 'object'
            && Array.isArray(j.filters.rentRange)) {
          setFilters({ ...DEFAULT_FILTERS, ...j.filters })
        }
      })
      .catch(() => { /* 네트워크 실패는 토글을 false 로 유지 */ })
      .finally(() => { if (!cancelled) setHydrated(true) })
    return () => { cancelled = true }
  }, [loggedIn, setFilters])

  // 알림이 ON 인 동안 사용자가 필터를 바꾸면 DB 의 filters JSONB 도 따라가도록 동기화.
  // 800ms 디바운스로 슬라이더 드래그 중 PUT 폭주 방지.
  // hydrated 가드: GET 응답이 도착하기 전에 디바운스가 돌아 로컬 default 가
  // DB 의 저장된 조건을 덮어쓰는 사고를 방지.
  useEffect(() => {
    if (loggedIn !== true || !notifOn || !hydrated) return
    const timer = setTimeout(() => {
      fetch('/api/saved-filters', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ filters: filter }),
      }).catch(() => { /* 동기화 실패는 무시 — 다음 변경에서 재시도됨 */ })
    }, 800)
    return () => clearTimeout(timer)
  }, [filter, notifOn, loggedIn, hydrated])

  const set = <K extends keyof MapFilters>(key: K, val: MapFilters[K]) =>
    setFilters({ ...filter, [key]: val })

  const toggleOption = (opt: string) =>
    setFilters({ ...filter, options: filter.options.includes(opt)
      ? filter.options.filter((o) => o !== opt)
      : [...filter.options, opt] })

  const toggleSection = (s: string) => setSection((prev) => prev === s ? null : s)

  const handleNotifToggle = async () => {
    if (loggedIn === null) return            // 세션 확인 중엔 무시
    if (loggedIn === false) { setShowLogin(true); return }

    // 낙관적 토글 + 현재 필터 동시 저장. 실패 시 이전 상태로 원복.
    const next = !notifOn
    setNotifOn(next)
    try {
      const res = await fetch('/api/saved-filters', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notify: next, filters: filter }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch {
      setNotifOn(!next)
    }
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

  return (
    <div style={{
      background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.border}`,
      boxShadow: tok.shadow, marginBottom: 16, overflow: 'hidden',
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
            width: 32, height: 32, borderRadius: 10, background: tok.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={tok.chipActiveColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, lineHeight: 1.3 }}>
              원하는 방 조건 설정
            </div>
            <div style={{ fontSize: 11, color: tok.textThird, marginTop: 1 }}>
              {isDefault(filter) ? '건물 종류·가격대·옵션·출입문 거리 선택' : '조건이 설정되어 있어요'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {notifOn && loggedIn === true && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: tok.badgeColor,
              background: tok.badgeBg, borderRadius: 999, padding: '3px 8px',
            }}>알림 ON</span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tok.textThird} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* ── 펼친 내용 ────────────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${tok.borderSoft}` }}>

          {/* 건물 종류 */}
          <div style={{ padding: '14px 0 12px', borderBottom: `1px solid ${tok.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: tok.textThird, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              건물 종류
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BUILDING_TYPES.map(({ key, label }) => (
                <Chip key={String(key)} label={label}
                  active={filter.buildingType === key}
                  onClick={() => set('buildingType', key)}
                  tok={tok}
                />
              ))}
            </div>
          </div>

          {/* 월세 범위 */}
          <Section label="월세 범위" summary={rentSummary} open={section === 'rent'} onToggle={() => toggleSection('rent')} tok={tok}>
            <DualRange min={0} max={200} step={5}
              from={filter.rentRange[0]} to={filter.rentRange[1]}
              onChange={(f, t) => set('rentRange', [f, t])}
              fmtMin={fmtWon} fmtMax={fmtWon} tok={tok}
            />
          </Section>

          {/* 보증금 범위 */}
          <Section label="보증금 범위" summary={depositSummary} open={section === 'deposit'} onToggle={() => toggleSection('deposit')} tok={tok}>
            <DualRange min={0} max={5000} step={100}
              from={filter.depositRange[0]} to={filter.depositRange[1]}
              onChange={(f, t) => set('depositRange', [f, t])}
              fmtMin={fmtWon} fmtMax={fmtWon} tok={tok}
            />
          </Section>

          {/* 건물 연식 */}
          <Section label="건물 연식" summary={ageSummary} open={section === 'age'} onToggle={() => toggleSection('age')} tok={tok}>
            <DualRange min={0} max={60} step={1}
              from={filter.ageRange[0]} to={filter.ageRange[1]}
              onChange={(f, t) => set('ageRange', [f, t])}
              fmtMin={fmtAge} fmtMax={fmtAge} tok={tok}
            />
          </Section>

          {/* 출입문 거리 */}
          <Section label="출입문 거리" summary={gateSummary} open={section === 'gate'} onToggle={() => toggleSection('gate')} maxH={200} tok={tok}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: tok.textThird, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                기준 출입문
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {MAJOR_GATES.map((g) => (
                  <Chip key={g.name} label={g.name}
                    active={filter.gate === g.name}
                    onClick={() => set('gate', filter.gate === g.name ? null : g.name)}
                    tok={tok}
                  />
                ))}
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: tok.textThird, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                최대 도보 시간
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GATE_MINUTES.map((min) => (
                  <Chip key={min} label={`${min}분 이내`}
                    active={filter.gateMinutes === min}
                    onClick={() => set('gateMinutes', filter.gateMinutes === min ? null : min)}
                    tok={tok}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* 방 옵션 */}
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: tok.textThird, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              방 옵션
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ROOM_OPTIONS.map((opt) => (
                <Chip key={opt} label={opt}
                  active={filter.options.includes(opt)}
                  onClick={() => toggleOption(opt)}
                  tok={tok}
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
                background: tok.resetBg, color: tok.resetColor,
                border: `1px solid ${tok.resetBd}`, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              필터 초기화
            </button>
          </div>

          {/* ── 알림 설정 ─────────────────────────────────────── */}
          <div style={{
            background: tok.notifBg, borderRadius: 14,
            border: `1px solid ${tok.notifBd}`, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={tok.textSecond} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary }}>새 매물 알림</div>
                  <div style={{ fontSize: 11, color: tok.textThird, marginTop: 1 }}>
                    조건에 맞는 방이 등록되면 알려드려요
                  </div>
                </div>
              </div>
              <button
                onClick={handleNotifToggle}
                disabled={loggedIn === null}
                aria-busy={loggedIn === null || undefined}
                style={{
                  width: 44, height: 26, borderRadius: 999, border: 'none',
                  cursor: loggedIn === null ? 'wait' : 'pointer',
                  background: notifOn && loggedIn === true ? '#2563eb' : tok.notifOff,
                  opacity: loggedIn === null ? 0.6 : 1,
                  position: 'relative', flexShrink: 0, transition: 'background .2s, opacity .2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: notifOn && loggedIn === true ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left .2s',
                }} />
              </button>
            </div>

            {showLogin && loggedIn === false && (
              <div style={{ borderTop: `1px solid ${tok.notifBd}`, padding: '14px 16px', background: tok.loginPanelBg }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: tok.textSecond, lineHeight: 1.6 }}>
                  알림 설정은 <strong style={{ color: tok.textPrimary }}>로그인</strong>이 필요해요.
                  조건에 맞는 새 매물이 등록되면 바로 알려드려요!
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '11px 16px', borderRadius: 12,
                    border: `1.5px solid ${tok.loginBtnBd}`, background: loginLoading ? tok.altBg : tok.loginBtnBg,
                    fontSize: 13, fontWeight: 700, color: tok.loginBtnColor,
                    cursor: loginLoading ? 'default' : 'pointer',
                  }}
                >
                  {loginLoading ? '로그인 중…' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
                    fontSize: 12, color: tok.loginSubColor,
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
