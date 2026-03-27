'use client'

interface Props {
  value: [number, number]
  onChange: (v: [number, number]) => void
}

const MIN = 0
const MAX = 5000
const STEP = 100

function pct(v: number) { return ((v - MIN) / (MAX - MIN)) * 100 }
function fmt(v: number) { return v >= 10000 ? `${v / 10000}억` : `${v.toLocaleString()}만` }

export default function StepDeposit({ value, onChange }: Props) {
  const [from, to] = value

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <span className="text-3xl font-bold text-gray-900">
          {fmt(from)}
          <span className="text-lg text-gray-400 font-medium">원</span>
        </span>
        <span className="text-gray-300 mx-3">–</span>
        <span className="text-3xl font-bold text-gray-900">
          {fmt(to)}
          <span className="text-lg text-gray-400 font-medium">원</span>
          {to === MAX && <span className="text-lg text-blue-500"> 이상</span>}
        </span>
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
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }}
          />
        </div>
        <input
          type="range" min={MIN} max={MAX} value={from} step={STEP}
          onChange={(e) => { const v = +e.target.value; if (v <= to - STEP) onChange([v, to]) }}
          className="ob-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: from > MAX * 0.92 ? 5 : 3 }}
        />
        <input
          type="range" min={MIN} max={MAX} value={to} step={STEP}
          onChange={(e) => { const v = +e.target.value; if (v >= from + STEP) onChange([from, v]) }}
          className="ob-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>0원</span>
        <span>5,000만원 이상</span>
      </div>

      {/* 빠른 선택 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '~500만원',      range: [0,    500]  as [number,number] },
          { label: '500~1000만원',  range: [500,  1000] as [number,number] },
          { label: '1000~2000만원', range: [1000, 2000] as [number,number] },
          { label: '2000~3000만원', range: [2000, 3000] as [number,number] },
          { label: '3000만원~',     range: [3000, 5000] as [number,number] },
          { label: '전체',          range: [0,    5000] as [number,number] },
        ].map(({ label, range }) => (
          <button
            key={label}
            onClick={() => onChange(range)}
            className={[
              'py-2 rounded-xl text-xs font-semibold transition-colors',
              value[0] === range[0] && value[1] === range[1]
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
