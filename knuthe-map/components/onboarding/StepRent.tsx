'use client'

import { useState } from 'react'

interface Props {
  value: [number, number]
  onChange: (v: [number, number]) => void
}

const MIN  = 0
const MAX  = 100   // 만원
const STEP = 1

function pct(v: number) { return ((v - MIN) / (MAX - MIN)) * 100 }
function fmt(v: number) { return `${v}만` }

export default function StepRent({ value, onChange }: Props) {
  const [from, to] = value
  const [inputFrom, setInputFrom] = useState(String(from))
  const [inputTo,   setInputTo]   = useState(String(to))

  const applyFrom = (raw: string) => {
    const v = parseInt(raw)
    if (!isNaN(v) && v >= MIN && v < to) onChange([v, to])
    else setInputFrom(String(from))
  }
  const applyTo = (raw: string) => {
    const v = parseInt(raw)
    if (!isNaN(v) && v > from && v <= MAX) onChange([from, v])
    else setInputTo(String(to))
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 직접 입력 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="number" min={MIN} max={MAX - 1}
            value={inputFrom}
            onChange={(e) => setInputFrom(e.target.value)}
            onBlur={(e) => { applyFrom(e.target.value); setInputFrom(String(from)) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { applyFrom(inputFrom); setInputFrom(String(from)) } }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 text-center focus:outline-none focus:border-blue-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
        </div>
        <span className="text-gray-300 font-light text-lg">–</span>
        <div className="flex-1 relative">
          <input
            type="number" min={MIN + 1} max={MAX}
            value={inputTo}
            onChange={(e) => setInputTo(e.target.value)}
            onBlur={(e) => { applyTo(e.target.value); setInputTo(String(to)) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { applyTo(inputTo); setInputTo(String(to)) } }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 text-center focus:outline-none focus:border-blue-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원{to === MAX ? '+' : ''}</span>
        </div>
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
          onChange={(e) => {
            const v = +e.target.value
            if (v < to) { onChange([v, to]); setInputFrom(String(v)) }
          }}
          className="ob-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: from > MAX * 0.92 ? 5 : 3 }}
        />
        <input
          type="range" min={MIN} max={MAX} value={to} step={STEP}
          onChange={(e) => {
            const v = +e.target.value
            if (v > from) { onChange([from, v]); setInputTo(String(v)) }
          }}
          className="ob-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>0만원</span>
        <span>100만원 이상</span>
      </div>

      {/* 빠른 선택 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2">빠른 선택</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { label: '~20만원',   range: [0,  20]  as [number,number] },
            { label: '20~30만원', range: [20, 30]  as [number,number] },
            { label: '30~40만원', range: [30, 40]  as [number,number] },
            { label: '40~50만원', range: [40, 50]  as [number,number] },
            { label: '50~70만원', range: [50, 70]  as [number,number] },
            { label: '전체',      range: [0,  100] as [number,number] },
          ] as { label: string; range: [number,number] }[]).map(({ label, range }) => (
            <button
              key={label}
              onClick={() => { onChange(range); setInputFrom(String(range[0])); setInputTo(String(range[1])) }}
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
    </div>
  )
}
