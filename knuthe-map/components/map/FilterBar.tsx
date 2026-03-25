'use client'

type Filter = {
  key: string | null
  label: string
  match: (purps: string) => boolean
}

export const BUILDING_FILTERS: Filter[] = [
  { key: null,       label: '전체',    match: () => true },
  { key: '단독주택', label: '단독주택', match: (p) => p === '단독주택' },
  { key: '공동주택', label: '공동주택', match: (p) => p === '공동주택' || p.includes('다세대') || p.includes('연립') },
  { key: '상가',     label: '상가·근린', match: (p) => p.includes('근린생활') },
  { key: '기타',     label: '기타',    match: (p) => !p.includes('주택') && !p.includes('근린생활') && p !== '' },
]

interface FilterBarProps {
  activeFilter: string | null
  onFilterChange: (key: string | null) => void
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#fff',
        borderRadius: 999,
        padding: '6px 10px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        border: '1.5px solid #e5e7eb',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {BUILDING_FILTERS.map(({ key, label }) => {
        const active = activeFilter === key
        return (
          <button
            key={String(key)}
            onClick={() => onFilterChange(key)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              fontFamily: "-apple-system, 'Apple SD Gothic Neo', sans-serif",
              background: active ? '#2563eb' : 'transparent',
              color: active ? '#fff' : '#374151',
              transition: 'background 0.15s, color 0.15s',
              lineHeight: 1,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
