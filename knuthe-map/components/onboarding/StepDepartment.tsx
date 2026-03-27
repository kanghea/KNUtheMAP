'use client'

import { useState } from 'react'
import { DEPARTMENTS, COLLEGES } from '@/lib/department-zones'

// 구역별 선배 팁
const ZONE_TIPS: Record<string, { gate: string; emoji: string; msg: string }> = {
  '북문':  { gate: '북문',  emoji: '🎒', msg: '공대·IT대는 북문이 압도적으로 가까워요. 강의실까지 걸어서 5분이면 충분해요!' },
  '쪽문':  { gate: '쪽문',  emoji: '☕', msg: '경상대·법대는 쪽문이 제일 편해요. 쪽문 앞 카페거리도 유명하죠!' },
  '정문':  { gate: '정문',  emoji: '📚', msg: '인문대·사범대는 정문 쪽으로 많이 다녀요. 정문 주변 자취방이 인기 많아요.' },
  '동문':  { gate: '동문',  emoji: '🌿', msg: '농대·수의대는 동문이 제일 가까워요. 상대적으로 조용한 동네예요.' },
  '칠곡':  { gate: '칠곡',  emoji: '🏥', msg: '칠곡 캠퍼스는 본교와 따로 있어요. 캠퍼스 바로 인근 자취방을 추천드려요.' },
}

interface Props {
  selected: string | null
  onSelect: (dept: string) => void
}

export default function StepDepartment({ selected, onSelect }: Props) {
  const [college, setCollege] = useState<string | null>(
    selected ? (DEPARTMENTS.find((d) => d.name === selected)?.college ?? null) : null
  )

  const depts = college ? DEPARTMENTS.filter((d) => d.college === college) : []

  const selectedDept = DEPARTMENTS.find((d) => d.name === selected)
  const tip = selectedDept ? ZONE_TIPS[selectedDept.zone] ?? null : null

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 단과대 선택 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">단과대학</p>
        <div className="flex flex-wrap gap-2">
          {COLLEGES.map((c) => (
            <button
              key={c}
              onClick={() => { setCollege(c); if (college !== c) onSelect('') }}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                college === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 학과 선택 */}
      {college && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">학과·학부</p>
          <div className="flex flex-wrap gap-2">
            {depts.map((d) => (
              <button
                key={d.name}
                onClick={() => onSelect(d.name)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selected === d.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ].join(' ')}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 선배 팁 */}
      {selected && tip && (
        <div className="mt-1 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 flex gap-3 items-start">
          <span className="text-xl shrink-0 mt-0.5">{tip.emoji}</span>
          <div>
            <p className="text-xs font-bold text-blue-600 mb-1">
              {selected} 선배들은 주로 <strong>{tip.gate}</strong>을 사용해요!
            </p>
            <p className="text-xs text-blue-700/70 leading-relaxed">{tip.msg}</p>
          </div>
        </div>
      )}
    </div>
  )
}
