'use client'

import { useState, useEffect, useRef } from 'react'
import { MapFilters, DEFAULT_FILTERS } from './DynamicFilter'
import { MAJOR_GATES } from '@/lib/gate-utils'

// ── 타입 ──────────────────────────────────────────────────────────

export interface SearchResult {
  id:           string
  name:         string | null
  address:      string | null
  lat:          number
  lng:          number
  main_purps_nm: string | null
}

interface Props {
  filters:  MapFilters
  onChange: (f: MapFilters) => void
  onSelect: (r: SearchResult) => void
}

// ── 상수 ──────────────────────────────────────────────────────────

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

// ── 내부 컴포넌트 ─────────────────────────────────────────────────

interface DualRangeProps {
  min: number; max: number; from: number; to: number; step?: number
  onChange: (from: number, to: number) => void
  fmtMin: (v: number) => string; fmtMax: (v: number) => string
}

function DualRange({ min, max, from, to, step = 1, onChange, fmtMin, fmtMax }: DualRangeProps) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <div className="pt-1 pb-2">
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-white/20 rounded-full pointer-events-none">
          <div className="absolute h-full bg-blue-500 rounded-full"
            style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }} />
        </div>
        <input type="range" min={min} max={max} value={from} step={step}
          onChange={(e) => { const v = +e.target.value; if (v <= to - step) onChange(v, to) }}
          className="di-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: from > max - (max - min) * 0.08 ? 5 : 3 }} />
        <input type="range" min={min} max={max} value={to} step={step}
          onChange={(e) => { const v = +e.target.value; if (v >= from + step) onChange(from, v) }}
          className="di-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: 4 }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-white/50">
        <span>{fmtMin(from)}</span>
        <span>{fmtMax(to)}{to === max ? '+' : ''}</span>
      </div>
    </div>
  )
}

function RangeRow({ label, summary, open, onToggle, children, maxH = 120 }: {
  label: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode; maxH?: number
}) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center justify-between py-3 text-left">
        <span className="text-sm font-semibold text-white">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{summary}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? maxH : 0, transition: 'max-height .25s ease' }}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: on ? '#2563eb' : 'rgba(255,255,255,0.15)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
        display: 'block',
      }} />
    </button>
  )
}

// ── 건물 유형 아이콘 ───────────────────────────────────────────────

function buildingIcon(purps: string | null) {
  if (!purps) return '🏢'
  if (purps.includes('주택') || purps.includes('아파트')) return '🏠'
  if (purps.includes('근린') || purps.includes('상가') || purps.includes('판매')) return '🏪'
  if (purps.includes('학교') || purps.includes('교육')) return '🏫'
  return '🏢'
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

export default function SearchAndFilter({ filters, onChange, onSelect }: Props) {
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<SearchResult[]>([])
  const [focused,    setFocused]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [notifyOn,   setNotifyOn]   = useState(false)
  const [section,    setSection]    = useState<string | null>(null)

  const wrapperRef  = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── 검색 디바운스 ─────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setLoading(false); return }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buildings/search?q=${encodeURIComponent(query.trim())}`)
        setResults(await res.json())
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // ── 외부 클릭 닫기 ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
        setFilterOpen(false)
        setSection(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showCard    = focused || filterOpen || results.length > 0
  const showOverlay = filterOpen || results.length > 0

  const set = <K extends keyof MapFilters>(key: K, val: MapFilters[K]) =>
    onChange({ ...filters, [key]: val })

  const toggleOption = (opt: string) =>
    set('options', filters.options.includes(opt)
      ? filters.options.filter((o) => o !== opt)
      : [...filters.options, opt])

  const toggleSection = (s: string) => setSection((p) => (p === s ? null : s))

  const activeCount = [
    filters.buildingType !== null,
    filters.rentRange[0]    !== DEFAULT_FILTERS.rentRange[0]    || filters.rentRange[1]    !== DEFAULT_FILTERS.rentRange[1],
    filters.depositRange[0] !== DEFAULT_FILTERS.depositRange[0] || filters.depositRange[1] !== DEFAULT_FILTERS.depositRange[1],
    filters.ageRange[0]     !== DEFAULT_FILTERS.ageRange[0]     || filters.ageRange[1]     !== DEFAULT_FILTERS.ageRange[1],
    filters.options.length > 0,
    filters.gate !== null && filters.gateMinutes !== null,
  ].filter(Boolean).length

  const fmtWon = (v: number) => `${v.toLocaleString()}만`
  const fmtAge = (v: number) => v === 0 ? '신축' : `${v}년`

  const rentSummary    = `${fmtWon(filters.rentRange[0])} ~ ${fmtWon(filters.rentRange[1])}${filters.rentRange[1] === DEFAULT_FILTERS.rentRange[1] ? '+' : ''}`
  const depositSummary = `${fmtWon(filters.depositRange[0])} ~ ${fmtWon(filters.depositRange[1])}${filters.depositRange[1] === DEFAULT_FILTERS.depositRange[1] ? '+' : ''}`
  const ageSummary     = `${fmtAge(filters.ageRange[0])} ~ ${fmtAge(filters.ageRange[1])}${filters.ageRange[1] === DEFAULT_FILTERS.ageRange[1] ? '+' : ''}`

  const handleSelect = (r: SearchResult) => {
    onSelect(r)
    setQuery(r.name || r.address || '')
    setResults([])
    setFocused(false)
    inputRef.current?.blur()
  }

  const handleReset = () => { onChange(DEFAULT_FILTERS); setSection(null) }

  // ── 렌더 ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .saf-thumb::-webkit-slider-thumb {
          -webkit-appearance: none; pointer-events: all;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; cursor: grab; box-shadow: 0 2px 6px rgba(0,0,0,.55);
        }
        .saf-thumb::-moz-range-thumb {
          pointer-events: all; width: 18px; height: 18px; border-radius: 50%;
          background: #fff; cursor: grab; border: none; box-shadow: 0 2px 6px rgba(0,0,0,.55);
        }
      `}</style>

      {/* 오버레이 — 필터 열림 또는 검색 결과 있을 때만 */}
      {showOverlay && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 24 }}
          onClick={() => { setFocused(false); setFilterOpen(false); setSection(null); setResults([]) }}
        />
      )}

      {/* 검색 + 필터 래퍼 */}
      <div
        ref={wrapperRef}
        style={{
          position:  'fixed',
          top:       16,
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    25,
          width:     'min(360px, calc(100vw - 96px))',
        }}
      >
        {/* ── 검색 바 ──────────────────────────────────────── */}
        <div
          style={{
            background:   '#0a0a0a',
            border:       '1px solid rgba(255,255,255,0.13)',
            borderBottom: showCard ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.13)',
            borderRadius: showCard ? '20px 20px 0 0' : 999,
            padding:      '10px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            boxShadow:    showCard ? 'none' : '0 4px 24px rgba(0,0,0,.5)',
            transition:   'border-radius .2s ease, border-bottom .1s ease',
          }}
        >
          {/* 검색 아이콘 */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={focused || query ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, transition: 'stroke .2s' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>

          {/* 입력 */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="주소나 건물명으로 검색"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 16, fontWeight: 500,
            }}
          />

          {/* 로딩 스피너 */}
          {loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"
              style={{ flexShrink: 0, animation: 'spin 0.8s linear infinite' }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            </svg>
          )}

          {/* 지우기 버튼 */}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              style={{
                flexShrink: 0, background: 'rgba(255,255,255,0.1)', border: 'none',
                borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          )}

          {/* 필터 아이콘 */}
          <button
            onClick={() => { setFilterOpen((v) => !v); setFocused(true) }}
            style={{
              flexShrink: 0, background: activeCount > 0 ? '#2563eb' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s', position: 'relative',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {activeCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#fff', color: '#2563eb',
                borderRadius: '50%', width: 14, height: 14,
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{activeCount}</span>
            )}
          </button>
        </div>

        {/* ── 카드 (검색결과 + 필터) ──────────────────────── */}
        <div
          style={{
            background:    '#0a0a0a',
            borderTop:     'none',
            borderRight:   showCard ? '1px solid rgba(255,255,255,0.13)' : 'none',
            borderBottom:  showCard ? '1px solid rgba(255,255,255,0.13)' : 'none',
            borderLeft:    showCard ? '1px solid rgba(255,255,255,0.13)' : 'none',
            borderRadius: '0 0 20px 20px',
            overflow:     'hidden',
            maxHeight:    showCard ? 'calc(100vh - 120px)' : 0,
            overflowY:    'auto',
            boxShadow:    showCard ? '0 8px 32px rgba(0,0,0,.5)' : 'none',
            opacity:      showCard ? 1 : 0,
            transition:   'max-height .25s cubic-bezier(.4,0,.2,1), opacity .15s ease',
          }}
        >
          {/* ── 검색 결과 ────────────────────────────────── */}
          {results.length > 0 && (
            <div>
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        12,
                    width:      '100%',
                    padding:    '11px 16px',
                    background: 'none',
                    border:     'none',
                    borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor:     'pointer',
                    textAlign:  'left',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{buildingIcon(r.main_purps_nm)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.name || '이름 없음'}
                    </div>
                    {r.address && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.address}
                      </div>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"
                    style={{ flexShrink: 0, marginLeft: 'auto' }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {!loading && query.trim() && results.length === 0 && (
            <div style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              &apos;{query}&apos; 에 해당하는 건물이 없어요
            </div>
          )}

          {/* 검색 결과 + 필터 사이 구분선 */}
          {results.length > 0 && (
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px' }} />
          )}

          {/* ── 필터 토글 행 ────────────────────────────── */}
          <button
            onClick={() => setFilterOpen((v) => !v)}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              width:      '100%',
              padding:    '13px 16px',
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      '#fff',
              textAlign:  'left',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round"
              style={{ flexShrink: 0, transform: filterOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1 }}>
              자세한 조건으로 찾고싶나요?
            </span>
            {activeCount > 0 && (
              <span style={{
                background: '#2563eb', color: '#fff', borderRadius: 999,
                fontSize: 11, fontWeight: 700, padding: '1px 8px',
              }}>
                {activeCount}
              </span>
            )}
          </button>

          {/* ── 필터 콘텐츠 ─────────────────────────────── */}
          <div style={{
            maxHeight:  filterOpen ? 900 : 0,
            overflow:   'hidden',
            transition: 'max-height .32s cubic-bezier(.4,0,.2,1)',
          }}>
            <div style={{ padding: '0 16px 4px' }}>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />

              {/* 건물 종류 */}
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  건물 종류
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {BUILDING_TYPES.map(({ key, label }) => {
                    const active = filters.buildingType === key
                    return (
                      <button key={String(key)} onClick={() => set('buildingType', key)} style={{
                        padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', border: 'none', transition: 'background .15s, color .15s',
                        background: active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                      }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />

              {/* 월세 */}
              <RangeRow label="월세 범위" summary={rentSummary} open={section === 'rent'} onToggle={() => toggleSection('rent')}>
                <DualRange min={0} max={200} step={5}
                  from={filters.rentRange[0]} to={filters.rentRange[1]}
                  onChange={(f, t) => set('rentRange', [f, t])}
                  fmtMin={fmtWon} fmtMax={fmtWon} />
              </RangeRow>

              {/* 보증금 */}
              <RangeRow label="보증금 범위" summary={depositSummary} open={section === 'deposit'} onToggle={() => toggleSection('deposit')}>
                <DualRange min={0} max={5000} step={100}
                  from={filters.depositRange[0]} to={filters.depositRange[1]}
                  onChange={(f, t) => set('depositRange', [f, t])}
                  fmtMin={fmtWon} fmtMax={fmtWon} />
              </RangeRow>

              {/* 건물 연식 */}
              <RangeRow label="건물 연식" summary={ageSummary} open={section === 'age'} onToggle={() => toggleSection('age')}>
                <DualRange min={0} max={60} step={1}
                  from={filters.ageRange[0]} to={filters.ageRange[1]}
                  onChange={(f, t) => set('ageRange', [f, t])}
                  fmtMin={fmtAge} fmtMax={fmtAge} />
              </RangeRow>

              {/* 출입문 거리 */}
              <RangeRow
                label="출입문 거리"
                summary={filters.gate && filters.gateMinutes ? `${filters.gate} · ${filters.gateMinutes}분 이내` : '설정 안 함'}
                open={section === 'gate'} onToggle={() => toggleSection('gate')} maxH={200}
              >
                <div style={{ paddingBottom: 12, paddingTop: 4 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>기준 출입문</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {MAJOR_GATES.map((g) => {
                      const active = filters.gate === g.name
                      return (
                        <button key={g.name} onClick={() => set('gate', active ? null : g.name)} style={{
                          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', border: 'none', transition: 'background .15s',
                          background: active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>최대 도보 시간</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[5, 10, 15, 20].map((min) => {
                      const active = filters.gateMinutes === min
                      return (
                        <button key={min} onClick={() => set('gateMinutes', active ? null : min)} style={{
                          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', border: 'none', transition: 'background .15s',
                          background: active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                          {min}분 이내
                        </button>
                      )
                    })}
                  </div>
                </div>
              </RangeRow>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0 8px' }} />

              {/* 방 옵션 */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  방 옵션
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ROOM_OPTIONS.map((opt) => {
                    const active = filters.options.includes(opt)
                    return (
                      <button key={opt} onClick={() => toggleOption(opt)} style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', border: 'none', transition: 'background .15s',
                        background: active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                      }}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 알림 토글 ────────────────────────────── */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0', padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🔔</span> 이 조건으로 매물 나오면 알림받기
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                      {notifyOn ? '조건에 맞는 새 건물이 등록되면 알려드려요' : '새 건물 알림을 설정할 수 있어요'}
                    </div>
                  </div>
                  <Toggle on={notifyOn} onChange={setNotifyOn} />
                </div>
              </div>

              {/* ── 하단 버튼 ────────────────────────────── */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleReset}
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                >
                  초기화
                </button>
                <button
                  onClick={() => { setFilterOpen(false); setFocused(false) }}
                  style={{
                    background: '#2563eb', color: '#fff', border: 'none',
                    borderRadius: 999, padding: '8px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
