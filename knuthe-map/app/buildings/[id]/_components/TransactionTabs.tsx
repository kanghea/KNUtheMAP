interface Transaction {
  contract_type:  string
  rent:           number | null
  deposit:        number
  maintenance:    number | null
  area_m2:        number | null
  floor:          number | null
  unit_number:    string | null
  contract_date:  string | null
  contract_start: string | null
  contract_end:   string | null
  source:         string
}

interface Summary {
  avg_rent: number
  min_rent: number
  max_rent: number
  count: number
}

interface Props {
  transactions: Transaction[]
  summary: Summary | null
}

function fmtDate(d: string | null) {
  if (!d) return '–'
  return d.slice(0, 7).replace('-', '.')
}

function fmtPrice(rent: number | null, deposit: number) {
  if (rent && rent > 0) return `${rent}/${deposit}`
  return `전세 ${deposit}`
}

export default function TransactionTabs({ transactions, summary }: Props) {
  return (
    <div className="px-5 py-5 border-b border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">월세 실거래가</h3>
        {summary && (
          <span className="text-xs text-gray-400">
            평균 <strong className="text-gray-700">{summary.avg_rent}만원</strong>
            {' '}({summary.min_rent}~{summary.max_rent}만원)
          </span>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_1fr] border-b border-gray-200 pb-2.5">
        <span className="text-xs text-gray-500">계약일</span>
        <span className="text-xs font-bold text-gray-700">실거래가 (만원)</span>
        <span className="text-xs text-gray-500 text-right">면적</span>
        <span className="text-xs text-gray-500 text-right">층·호</span>
        <span className="text-xs text-gray-500 text-right">출처</span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
            <span className="text-gray-300 text-base font-bold leading-none select-none">!</span>
          </div>
          <p className="text-sm text-gray-400">실거래 기록이 없습니다.</p>
        </div>
      ) : (
        <div>
          {transactions.map((t, i) => (
            <div key={i} className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_1fr] py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-400">{fmtDate(t.contract_date)}</span>
              <span className="text-sm font-semibold text-gray-800">{fmtPrice(t.rent, t.deposit)}</span>
              <span className="text-xs text-gray-500 text-right">
                {t.area_m2 ? `${t.area_m2.toFixed(1)}㎡` : '–'}
              </span>
              <span className="text-xs text-gray-500 text-right">
                {[t.floor ? `${t.floor}층` : null, t.unit_number].filter(Boolean).join(' ') || '–'}
              </span>
              <span className="text-xs text-right">
                {t.source === 'user_contract'
                  ? <span className="text-blue-500 font-semibold">실거주</span>
                  : t.source === 'review'
                  ? <span className="text-green-500">리뷰</span>
                  : <span className="text-gray-300">–</span>
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
