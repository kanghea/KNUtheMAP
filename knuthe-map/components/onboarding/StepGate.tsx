'use client'

import { MAJOR_GATES } from '@/lib/gate-utils'

const GATE_TO_ZONE: Record<string, string> = {
  '북문': '북문구역',
  '정문': '정문구역',
  '서문': '서문구역',
  '쪽문': '쪽문구역',
  '동문': '동문구역',
  '택문': '택문구역',
  '나리문': '나리문구역',
  '누리문': '누리문구역',
}

interface Value {
  gate:    string | null
  minutes: number | null
}

interface Props {
  value:    Value
  onChange: (v: Value) => void
  tok: {
    cardBg: string
    cardBorder: string
    cardActiveBg: string
    cardActiveBorder: string
    cardActiveGlow: string
    textPrimary: string
    textSecondary: string
    textTertiary: string
    accent: string
  }
}

export default function StepGate({ value, onChange, tok }: Props) {
  const select = (name: string | null) => onChange({ gate: name, minutes: null })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 문 선택 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {MAJOR_GATES.map((g) => {
          const active = value.gate === g.name
          return (
            <button
              key={g.name}
              onClick={() => select(active ? null : g.name)}
              style={{
                padding: '14px 0',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                border: `1.5px solid ${active ? tok.cardActiveBorder : tok.cardBorder}`,
                background: active ? tok.cardActiveBg : tok.cardBg,
                color: active ? tok.accent : tok.textPrimary,
                boxShadow: active ? tok.cardActiveGlow : 'none',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              {g.name}
            </button>
          )
        })}
      </div>

      {/* "상관없어요" 버튼 */}
      <button
        onClick={() => select(null)}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          border: `1.5px solid ${value.gate === null ? tok.cardActiveBorder : tok.cardBorder}`,
          background: value.gate === null ? tok.cardActiveBg : tok.cardBg,
          color: value.gate === null ? tok.accent : tok.textSecondary,
          boxShadow: value.gate === null ? tok.cardActiveGlow : 'none',
          cursor: 'pointer',
          transition: 'all .2s ease',
        }}
      >
        어느 문이든 상관없어요
      </button>

      {/* 선택 구역 안내 */}
      {value.gate && (
        <div style={{
          background: tok.cardActiveBg,
          border: `1px solid ${tok.cardActiveBorder}`,
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 13,
          color: tok.accent,
          textAlign: 'center',
          transition: 'all .2s ease',
        }}>
          <strong>{value.gate}</strong>
          {GATE_TO_ZONE[value.gate] && (
            <span style={{ color: tok.textSecondary }}> ({GATE_TO_ZONE[value.gate]})</span>
          )}
          <span style={{ color: tok.textSecondary }}> 근처 건물을 높은 순위로 보여드릴게요</span>
        </div>
      )}
    </div>
  )
}
