'use client'

import { MAJOR_GATES } from '@/lib/gate-utils'
import { getGatesByDept, DEPARTMENTS } from '@/lib/department-zones'

interface Value {
  gate:    string | null
  minutes: number | null   // 온보딩에서는 사용 안 함 (필터 패널에서 설정)
}

interface Props {
  value:    Value
  onChange: (v: Value) => void
  dept?:    string
}

export default function StepGate({ value, onChange, dept }: Props) {
  const select = (name: string | null) => onChange({ gate: name, minutes: null })

  const deptGates = dept ? getGatesByDept(dept) : []
  const deptInfo  = dept ? DEPARTMENTS.find((d) => d.name === dept) : null
  const tipGate   = deptGates[0] ?? null

  return (
    <div className="space-y-4">
      {/* 학과 기반 추천 tip */}
      {dept && tipGate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-center">
          💡 <strong>{deptInfo?.college ?? dept}</strong> 학생들은 주로 <strong>{tipGate}</strong>
          {deptGates[1] ? <>이나 <strong>{deptGates[1]}</strong></> : null}을 이용해요
        </div>
      )}

      {/* 문 선택 그리드 */}
      <div className="grid grid-cols-4 gap-2">
        {MAJOR_GATES.map((g) => {
          const active = value.gate === g.name
          return (
            <button
              key={g.name}
              onClick={() => select(active ? null : g.name)}
              className={[
                'py-3.5 rounded-xl text-sm font-bold border-2 transition-all',
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-200',
              ].join(' ')}
            >
              {g.name}
            </button>
          )
        })}
      </div>

      {/* "상관없어요" 버튼 */}
      <button
        onClick={() => select(null)}
        className={[
          'w-full py-3.5 rounded-xl text-sm font-semibold border-2 transition-all',
          value.gate === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300',
        ].join(' ')}
      >
        어느 문이든 상관없어요
      </button>

      {/* 선택 안내 */}
      {value.gate && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 text-center">
          <strong>{value.gate}</strong> 근처 건물을 높은 순위로 보여드릴게요
        </div>
      )}
    </div>
  )
}
