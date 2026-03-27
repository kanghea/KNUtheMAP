'use client'

// StepPriority — 중요한 순서대로 탭해서 우선순위 정하기

const FACTORS = [
  {
    id:    'dist',
    label: '학교랑 가까울수록',
    sub:   '출입문까지 도보 거리',
    icon:  '🚶',
  },
  {
    id:    'age',
    label: '새 건물일수록',
    sub:   '준공된 지 얼마 안 된 곳',
    icon:  '✨',
  },
  {
    id:    'size',
    label: '방이 넓을수록',
    sub:   '세대당 전용면적 기준',
    icon:  '📐',
  },
  {
    id:    'security',
    label: '보안이 좋을수록',
    sub:   '엘리베이터·인터폰·관리 여부',
    icon:  '🔒',
  },
  {
    id:    'nearby',
    label: '주변 편의시설 많을수록',
    sub:   '편의점·음식점·카페 등 300m 내',
    icon:  '🏪',
  },
]

const RANK_COLORS = [
  { bg: '#2563eb', text: '#fff' },
  { bg: '#7c3aed', text: '#fff' },
  { bg: '#0891b2', text: '#fff' },
  { bg: '#059669', text: '#fff' },
  { bg: '#6b7280', text: '#fff' },
]

interface Props {
  value:    string[]
  onChange: (v: string[]) => void
}

export default function StepPriority({ value, onChange }: Props) {
  const handleTap = (id: string) => {
    if (value.includes(id)) {
      // 탭한 항목부터 이후 선택 모두 해제
      onChange(value.slice(0, value.indexOf(id)))
    } else {
      onChange([...value, id])
    }
  }

  const allSelected = value.length === FACTORS.length

  const guide =
    value.length === 0         ? '가장 중요한 것부터 순서대로 탭해 주세요' :
    value.length < FACTORS.length ? `${value.length + 1}순위는 뭐예요?` :
                                  '완료! 아래 버튼을 눌러 계속하세요 👍'

  return (
    <div className="space-y-2.5">
      <p className="text-center text-sm text-gray-400 mb-3">{guide}</p>

      {FACTORS.map((f) => {
        const rank     = value.indexOf(f.id)
        const selected = rank >= 0
        const color    = RANK_COLORS[rank] ?? RANK_COLORS[RANK_COLORS.length - 1]

        return (
          <button
            key={f.id}
            onClick={() => handleTap(f.id)}
            className={[
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all text-left',
              selected
                ? 'shadow-sm'
                : allSelected
                ? 'border-gray-100 bg-gray-50 opacity-40 cursor-default'
                : 'border-gray-200 bg-white hover:border-blue-200 active:scale-[0.98]',
            ].join(' ')}
            style={selected ? { background: color.bg + '12', borderColor: color.bg } : {}}
          >
            <span className="text-xl shrink-0">{f.icon}</span>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold"
                style={selected ? { color: color.bg } : { color: '#1f2937' }}
              >
                {f.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{f.sub}</p>
            </div>

            {selected ? (
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: color.bg, color: color.text }}
              >
                {rank + 1}
              </span>
            ) : (
              <span className="shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300 font-semibold">
                ?
              </span>
            )}
          </button>
        )
      })}

      {value.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="w-full text-xs text-gray-400 py-2 hover:text-gray-600 transition-colors"
        >
          다시 고르기
        </button>
      )}
    </div>
  )
}
