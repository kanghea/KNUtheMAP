type Tok = {
  border: string; borderSoft: string; cardBgAlt: string
  textPrimary: string; textSecondary: string; textTertiary: string
  accent: string
}

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
  summary:      Summary | null
  tok:          Tok
}

function fmtDate(d: string | null) {
  if (!d) return '–'
  return d.slice(0, 7).replace('-', '.')
}

function fmtPrice(rent: number | null, deposit: number) {
  if (rent && rent > 0) return `${rent}/${deposit}`
  return `전세 ${deposit}`
}

export default function TransactionTabs({ transactions, summary, tok }: Props) {
  return (
    <div style={{ padding: '20px 20px', borderBottom: `1px solid ${tok.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>월세 실거래가</h3>
        {summary && (
          <span style={{ fontSize: 12, color: tok.textTertiary }}>
            평균 <strong style={{ color: tok.textSecondary }}>{summary.avg_rent}만원</strong>
            {' '}({summary.min_rent}~{summary.max_rent}만원)
          </span>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr 1.5fr 1fr',
        borderBottom: `1px solid ${tok.borderSoft}`, paddingBottom: 10,
      }}>
        {(['계약일', '실거래가 (만원)', '면적', '층·호', '출처'] as const).map((h, i) => (
          <span key={h} style={{
            fontSize: 12, color: i === 1 ? tok.textSecondary : tok.textTertiary, fontWeight: i === 1 ? 700 : 400,
            textAlign: i >= 2 ? 'right' : 'left',
          }}>{h}</span>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `2px solid ${tok.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: tok.textTertiary, fontSize: 16, fontWeight: 700, lineHeight: 1 }}>!</span>
          </div>
          <p style={{ fontSize: 14, color: tok.textTertiary, margin: 0 }}>실거래 기록이 없습니다.</p>
        </div>
      ) : (
        <div>
          {transactions.map((t, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr 1.5fr 1fr',
              padding: '10px 0',
              borderBottom: i < transactions.length - 1 ? `1px solid ${tok.cardBgAlt}` : 'none',
            }}>
              <span style={{ fontSize: 12, color: tok.textTertiary }}>{fmtDate(t.contract_date)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: tok.textPrimary }}>{fmtPrice(t.rent, t.deposit)}</span>
              <span style={{ fontSize: 12, color: tok.textTertiary, textAlign: 'right' }}>
                {t.area_m2 ? `${t.area_m2.toFixed(1)}㎡` : '–'}
              </span>
              <span style={{ fontSize: 12, color: tok.textTertiary, textAlign: 'right' }}>
                {[t.floor ? `${t.floor}층` : null, t.unit_number].filter(Boolean).join(' ') || '–'}
              </span>
              <span style={{ fontSize: 12, textAlign: 'right' }}>
                {t.source === 'user_contract'
                  ? <span style={{ color: tok.accent, fontWeight: 600 }}>실거주</span>
                  : t.source === 'review'
                  ? <span style={{ color: '#10b981' }}>리뷰</span>
                  : <span style={{ color: tok.textTertiary }}>–</span>
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
