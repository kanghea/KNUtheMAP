'use client'

import { useState, useRef, useEffect } from 'react'

// ── 타입 ─────────────────────────────────────────────────────────

export interface MapFilters {
  buildingType: string | null
  rentRange:    [number, number]   // 만원
  depositRange: [number, number]   // 만원
  ageRange:     [number, number]   // 년
  options:      string[]
}

export const DEFAULT_FILTERS: MapFilters = {
  buildingType: null,
  rentRange:    [0, 200],
  depositRange: [0, 5000],
  ageRange:     [0, 60],
  options:      [],
}

// ── 건물 종류 매처 ────────────────────────────────────────────────

const TYPE_MATCHERS: Record<string, (p: string) => boolean> = {
  '단독주택': (p) => p === '단독주택',
  '공동주택': (p) => p === '공동주택' || p.includes('다세대') || p.includes('연립'),
  '상가':     (p) => p.includes('근린생활') || p.includes('판매'),
  '기타':     (p) => !p.includes('주택') && !p.includes('근린생활') && p !== '',
}

// ── GeoJSON 피처 필터 함수 (MapView에서 사용) ─────────────────────

function calcAge(useAprDay: string | null | undefined): number | null {
  if (!useAprDay || useAprDay.length < 4) return null
  const y = parseInt(useAprDay.slice(0, 4))
  return isNaN(y) ? null : new Date().getFullYear() - y
}

export function featureMatchesFilters(
  filters: MapFilters,
): (f: GeoJSON.Feature) => boolean {
  const [rentMin, rentMax]       = filters.rentRange
  const [depMin,  depMax]        = filters.depositRange
  const [ageMin,  ageMax]        = filters.ageRange
  const defaultRent    = filters.rentRange[0]    === DEFAULT_FILTERS.rentRange[0]    && filters.rentRange[1]    === DEFAULT_FILTERS.rentRange[1]
  const defaultDeposit = filters.depositRange[0] === DEFAULT_FILTERS.depositRange[0] && filters.depositRange[1] === DEFAULT_FILTERS.depositRange[1]
  const defaultAge     = filters.ageRange[0]     === DEFAULT_FILTERS.ageRange[0]     && filters.ageRange[1]     === DEFAULT_FILTERS.ageRange[1]

  return (feature) => {
    const p = feature.properties ?? {}

    // 건물 종류
    if (filters.buildingType) {
      const matcher = TYPE_MATCHERS[filters.buildingType]
      if (matcher && !matcher(p.main_purps_nm ?? '')) return false
    }

    // 건물 연식
    if (!defaultAge) {
      const age = calcAge(p.use_apr_day)
      if (age !== null) {
        if (age < ageMin || age > ageMax) return false
      }
    }

    // 월세 / 보증금: 건물에 room 데이터 있을 때만 필터링
    if (!defaultRent && p.rent_min != null) {
      if (p.rent_min < rentMin || p.rent_min > rentMax) return false
    }
    if (!defaultDeposit && p.deposit_min != null) {
      if (p.deposit_min < depMin || p.deposit_min > depMax) return false
    }

    // 방 옵션
    if (filters.options.length > 0 && p.options) {
      const bOpts: string[] = Array.isArray(p.options) ? p.options : []
      if (!filters.options.every((o) => bOpts.includes(o))) return false
    }

    return true
  }
}

// ── 방 옵션 목록 ──────────────────────────────────────────────────

const ROOM_OPTIONS = [
  '에어컨', '냉장고', '세탁기', '전자레인지',
  '주차장', '인터넷', '엘리베이터', 'CCTV',
  '가스레인지', '반려동물', '옷장', '신발장',
]

const BUILDING_TYPES = [
  { key: null,       label: '전체' },
  { key: '단독주택', label: '단독주택' },
  { key: '공동주택', label: '공동주택' },
  { key: '상가',     label: '상가·근린' },
  { key: '기타',     label: '기타' },
]

// ── 듀얼 레인지 슬라이더 ──────────────────────────────────────────

interface DualRangeProps {
  min: number; max: number
  from: number; to: number
  step?: number
  onChange: (from: number, to: number) => void
  fmtMin: (v: number) => string
  fmtMax: (v: number) => string
}

function DualRange({ min, max, from, to, step = 1, onChange, fmtMin, fmtMax }: DualRangeProps) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <div className="pt-1 pb-2">
      <div className="relative h-5 flex items-center">
        {/* 트랙 배경 */}
        <div className="absolute inset-x-0 h-[3px] bg-white/20 rounded-full pointer-events-none">
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }}
          />
        </div>
        {/* FROM */}
        <input
          type="range" min={min} max={max} value={from} step={step}
          onChange={(e) => { const v = +e.target.value; if (v <= to - step) onChange(v, to) }}
          className="di-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: from > max - (max - min) * 0.08 ? 5 : 3 }}
        />
        {/* TO */}
        <input
          type="range" min={min} max={max} value={to} step={step}
          onChange={(e) => { const v = +e.target.value; if (v >= from + step) onChange(from, v) }}
          className="di-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-white/50">
        <span>{fmtMin(from)}</span>
        <span>{fmtMax(to)}{to === max ? '+' : ''}</span>
      </div>
    </div>
  )
}

// ── 섹션 행 (클릭 → 슬라이더 토글) ──────────────────────────────

function RangeRow({
  label, summary, open, onToggle, children,
}: {
  label: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-semibold text-white">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{summary}</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? 120 : 0,
          transition: 'max-height .25s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

interface Props {
  filters:  MapFilters
  onChange: (f: MapFilters) => void
}

export default function DynamicFilter({ filters, onChange }: Props) {
  const [open, setOpen]       = useState(false)
  const [section, setSection] = useState<string | null>(null)
  const wrapperRef            = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSection(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggleSection = (s: string) => setSection((prev) => (prev === s ? null : s))

  const set = <K extends keyof MapFilters>(key: K, val: MapFilters[K]) =>
    onChange({ ...filters, [key]: val })

  const toggleOption = (opt: string) =>
    set('options', filters.options.includes(opt)
      ? filters.options.filter((o) => o !== opt)
      : [...filters.options, opt])

  const activeCount = [
    filters.buildingType !== null,
    filters.rentRange[0]    !== DEFAULT_FILTERS.rentRange[0]    || filters.rentRange[1]    !== DEFAULT_FILTERS.rentRange[1],
    filters.depositRange[0] !== DEFAULT_FILTERS.depositRange[0] || filters.depositRange[1] !== DEFAULT_FILTERS.depositRange[1],
    filters.ageRange[0]     !== DEFAULT_FILTERS.ageRange[0]     || filters.ageRange[1]     !== DEFAULT_FILTERS.ageRange[1],
    filters.options.length > 0,
  ].filter(Boolean).length

  const fmtWon  = (v: number) => `${v.toLocaleString()}만`
  const fmtAge  = (v: number) => v === 0 ? '신축' : `${v}년`

  const rentSummary    = `${fmtWon(filters.rentRange[0])} ~ ${fmtWon(filters.rentRange[1])}${filters.rentRange[1] === DEFAULT_FILTERS.rentRange[1] ? '+' : ''}`
  const depositSummary = `${fmtWon(filters.depositRange[0])} ~ ${fmtWon(filters.depositRange[1])}${filters.depositRange[1] === DEFAULT_FILTERS.depositRange[1] ? '+' : ''}`
  const ageSummary     = `${fmtAge(filters.ageRange[0])} ~ ${fmtAge(filters.ageRange[1])}${filters.ageRange[1] === DEFAULT_FILTERS.ageRange[1] ? '+' : ''}`

  return (
    <>
      {/* ── range thumb CSS ──────────────────────────────────── */}
      <style>{`
        .di-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0,0,0,.55);
        }
        .di-thumb::-moz-range-thumb {
          pointer-events: all;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: grab;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,.55);
        }
      `}</style>

      {/* ── 위치 앵커 ──────────────────────────────────────────── */}
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}
      >
        {/* ── 닫힌 pill ──────────────────────────────────────── */}
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#0a0a0a', color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,.4)',
            whiteSpace: 'nowrap',
            // 열릴 때 위로 축소되며 사라짐
            opacity: open ? 0 : 1,
            transform: open ? 'scale(0.88) translateY(-4px)' : 'scale(1) translateY(0)',
            pointerEvents: open ? 'none' : 'all',
            transition: 'opacity .2s ease, transform .2s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          필터
          {activeCount > 0 && (
            <span style={{
              background: '#2563eb', color: '#fff',
              borderRadius: 999, fontSize: 11, fontWeight: 700,
              padding: '1px 7px', lineHeight: '18px',
            }}>
              {activeCount}
            </span>
          )}
        </button>

        {/* ── 열린 패널 ──────────────────────────────────────── */}
        {/* pill 위치에서 아래로 펼쳐지는 scale + opacity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 'min(360px, calc(100vw - 32px))',
            transform: `translateX(-50%) ${open ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(-6px)'}`,
            transformOrigin: 'top center',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'all' : 'none',
            transition: 'opacity .25s ease, transform .28s cubic-bezier(.4,0,.2,1)',
            background: '#0e0e10',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: '16px 18px 14px',
            boxShadow: '0 8px 40px rgba(0,0,0,.6)',
            color: '#fff',
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">필터</span>
            <button
              onClick={() => { setOpen(false); setSection(null) }}
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              닫기
            </button>
          </div>

          {/* ── 건물 종류 ───────────────────────────────────── */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wide">건물 종류</p>
            <div className="flex flex-wrap gap-1.5">
              {BUILDING_TYPES.map(({ key, label }) => {
                const active = filters.buildingType === key
                return (
                  <button
                    key={String(key)}
                    onClick={() => set('buildingType', key)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'background .15s, color .15s',
                      background: active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0 2px' }} />

          {/* ── 월세 범위 ───────────────────────────────────── */}
          <RangeRow label="월세 범위" summary={rentSummary} open={section === 'rent'} onToggle={() => toggleSection('rent')}>
            <DualRange
              min={0} max={200} step={5}
              from={filters.rentRange[0]} to={filters.rentRange[1]}
              onChange={(f, t) => set('rentRange', [f, t])}
              fmtMin={fmtWon} fmtMax={fmtWon}
            />
          </RangeRow>

          {/* ── 보증금 범위 ─────────────────────────────────── */}
          <RangeRow label="보증금 범위" summary={depositSummary} open={section === 'deposit'} onToggle={() => toggleSection('deposit')}>
            <DualRange
              min={0} max={5000} step={100}
              from={filters.depositRange[0]} to={filters.depositRange[1]}
              onChange={(f, t) => set('depositRange', [f, t])}
              fmtMin={fmtWon} fmtMax={fmtWon}
            />
          </RangeRow>

          {/* ── 건물 연식 ───────────────────────────────────── */}
          <RangeRow label="건물 연식" summary={ageSummary} open={section === 'age'} onToggle={() => toggleSection('age')}>
            <DualRange
              min={0} max={60} step={1}
              from={filters.ageRange[0]} to={filters.ageRange[1]}
              onChange={(f, t) => set('ageRange', [f, t])}
              fmtMin={fmtAge} fmtMax={fmtAge}
            />
          </RangeRow>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0 8px' }} />

          {/* ── 방 옵션 ─────────────────────────────────────── */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wide">방 옵션</p>
            <div className="flex flex-wrap gap-1.5">
              {ROOM_OPTIONS.map((opt) => {
                const active = filters.options.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'background .15s, color .15s',
                      background: active ? '#2563eb' : 'rgba(255,255,255,0.1)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── 하단 버튼 ───────────────────────────────────── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => { onChange(DEFAULT_FILTERS); setSection(null) }}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              초기화
            </button>
            <button
              onClick={() => { setOpen(false); setSection(null) }}
              style={{
                background: '#2563eb', color: '#fff', border: 'none', borderRadius: 999,
                padding: '7px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
