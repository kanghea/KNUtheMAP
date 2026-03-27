'use client'

const PRESETS = [
  { label: '5년 이하',  sub: '신축',          max: 5  },
  { label: '10년 이하', sub: '비교적 최신',    max: 10 },
  { label: '15년 이하', sub: '',               max: 15 },
  { label: '20년 이하', sub: '',               max: 20 },
  { label: '30년 이하', sub: '',               max: 30 },
  { label: '상관없음',  sub: '연식 무관',      max: 60 },
]

const MAX = 60
const STEP = 1

function pct(v: number) { return (v / MAX) * 100 }

interface Props {
  value: number       // max age (0 = 신축만, 60 = 상관없음)
  onChange: (v: number) => void
}

export default function StepBuildingAge({ value, onChange }: Props) {
  const label = value >= 60 ? '상관없음' : `${value}년 이하`

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 현재 값 표시 */}
      <div className="text-center">
        <span className="text-3xl font-bold text-gray-900">{label}</span>
        {value < 60 && (
          <p className="text-sm text-gray-400 mt-1">
            준공 후 {value}년 이내 건물만 표시
          </p>
        )}
      </div>

      {/* 슬라이더 */}
      <div className="relative h-6 flex items-center px-1">
        <style>{`
          .ob-thumb::-webkit-slider-thumb {
            -webkit-appearance: none; pointer-events: all;
            width: 22px; height: 22px; border-radius: 50%;
            background: #fff; cursor: grab;
            border: 2px solid #2563eb;
            box-shadow: 0 2px 8px rgba(37,99,235,.35);
          }
          .ob-thumb::-moz-range-thumb {
            pointer-events: all; width: 22px; height: 22px; border-radius: 50%;
            background: #fff; cursor: grab; border: 2px solid #2563eb;
            box-shadow: 0 2px 8px rgba(37,99,235,.35);
          }
        `}</style>
        <div className="absolute inset-x-1 h-[4px] bg-gray-200 rounded-full pointer-events-none">
          <div
            className="absolute h-full bg-blue-500 rounded-full left-0"
            style={{ width: `${pct(value)}%` }}
          />
        </div>
        <input
          type="range" min={1} max={MAX} value={value} step={STEP}
          onChange={(e) => onChange(+e.target.value)}
          className="ob-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: 3 }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>1년</span>
        <span>상관없음</span>
      </div>

      {/* 빠른 선택 */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(({ label: pl, sub, max }) => (
          <button
            key={pl}
            onClick={() => onChange(max)}
            className={[
              'py-2.5 px-2 rounded-xl text-left transition-colors',
              value === max
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            <p className={['text-xs font-semibold', value === max ? 'text-white' : 'text-gray-800'].join(' ')}>
              {pl}
            </p>
            {sub && (
              <p className={['text-[10px] mt-0.5', value === max ? 'text-white/70' : 'text-gray-400'].join(' ')}>
                {sub}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
