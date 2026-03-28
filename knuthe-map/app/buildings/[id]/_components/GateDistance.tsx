// GateDistance — 가까운 출입문 거리 카드

interface GateRow {
  name:    string
  distM:   number
  minutes: number
}

interface Props {
  gates: GateRow[]
}

export default function GateDistance({ gates }: Props) {
  if (gates.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">가까운 출입문</h3>
          <p className="text-xs text-gray-400 mt-0.5">도보 속도 약 4.2km/h 기준</p>
        </div>
      </div>

      {/* 게이트 목록 */}
      <div>
        {gates.map((g, i) => {
          const isNearest = i === 0
          return (
            <div
              key={g.name}
              className={`flex items-center px-5 py-3.5 gap-4 ${
                i < gates.length - 1 ? 'border-b border-gray-100' : ''
              } ${isNearest ? 'bg-blue-50/40' : ''}`}
            >
              {/* 순위 */}
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={
                  isNearest
                    ? { background: '#3b82f6', color: 'var(--text-inverse)' }
                    : { background: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {i + 1}
              </span>

              {/* 문 이름 */}
              <span className={`flex-1 text-sm font-semibold ${isNearest ? 'text-blue-700' : 'text-gray-700'}`}>
                {g.name}
              </span>

              {/* 거리 */}
              <span className="text-xs text-gray-400 shrink-0">
                {g.distM < 1000 ? `${Math.round(g.distM)}m` : `${(g.distM / 1000).toFixed(1)}km`}
              </span>

              {/* 도보 시간 */}
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  isNearest ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                도보 {g.minutes}분
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
