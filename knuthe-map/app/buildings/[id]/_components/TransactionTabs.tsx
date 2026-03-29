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
    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>월세 실거래가</h3>
        {summary && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            평균 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{summary.avg_rent}만원</strong>
            {' '}({summary.min_rent}~{summary.max_rent}만원)
          </span>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr 1.5fr 1fr',
        borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 2,
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>계약일</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>실거래가 (만원)</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>면적</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>층·호</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>출처</span>
      </div>

      {transactions.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>!</span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>실거래 기록이 없습니다.</p>
        </div>
      ) : (
        <div>
          {transactions.map((t, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr 1.5fr 1fr',
              padding: '10px 0',
              borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{fmtDate(t.contract_date)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{fmtPrice(t.rent, t.deposit)}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
                {t.area_m2 ? `${t.area_m2.toFixed(1)}㎡` : '–'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
                {[t.floor ? `${t.floor}층` : null, t.unit_number].filter(Boolean).join(' ') || '–'}
              </span>
              <span style={{ fontSize: 12, textAlign: 'right' }}>
                {t.source === 'user_contract'
                  ? <span style={{ color: '#60a5fa', fontWeight: 600 }}>실거주</span>
                  : t.source === 'review'
                  ? <span style={{ color: '#4ade80' }}>리뷰</span>
                  : <span style={{ color: 'rgba(255,255,255,0.2)' }}>–</span>
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
