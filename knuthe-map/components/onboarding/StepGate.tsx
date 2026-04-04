'use client'

import { MAJOR_GATES } from '@/lib/gate-utils'
import { getGatesByDept } from '@/lib/department-zones'

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
  dept?:   string | null
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

export default function StepGate({ value, onChange, dept, tok }: Props) {
  const select = (name: string | null) => onChange({ gate: name, minutes: null })

  const majorGateNames = new Set(MAJOR_GATES.map((g) => g.name))
  const deptGates = dept ? getGatesByDept(dept).filter((g) => majorGateNames.has(g)) : []
  const recommendedGate = deptGates[0] ?? null

  // 팁 영역: 추천 안내 또는 선택 구역 안내 (위치 고정)
  const tipContent = value.gate
    ? (
      <>
        <strong style={{ color: tok.accent }}>{value.gate}</strong>
        {GATE_TO_ZONE[value.gate] && (
          <span style={{ color: tok.textSecondary }}> ({GATE_TO_ZONE[value.gate]})</span>
        )}
        <span style={{ color: tok.textSecondary }}> 근처 건물을 높은 순위로 보여드릴게요</span>
      </>
    )
    : recommendedGate
      ? (
        <>
          <strong style={{ color: tok.accent }}>{dept}</strong>
          <span style={{ color: tok.textSecondary }}> 학생이라면 </span>
          <strong style={{ color: tok.accent }}>{recommendedGate}</strong>
          <span style={{ color: tok.textSecondary }}>{(recommendedGate.charCodeAt(recommendedGate.length - 1) - 0xAC00) % 28 > 0 ? '이' : '가'} 가장 가까워요</span>
        </>
      )
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 팁 영역 (고정 위치) */}
      <div style={{
        background: tok.cardActiveBg,
        border: `1px solid ${tok.cardActiveBorder}`,
        borderRadius: 12,
        padding: '10px 16px',
        fontSize: 13,
        textAlign: 'center',
        transition: 'all .2s ease',
        opacity: tipContent ? 1 : 0,
        visibility: tipContent ? 'visible' as const : 'hidden' as const,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {tipContent}
      </div>

      {/* 문 선택 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {MAJOR_GATES.map((g) => {
          const active = value.gate === g.name
          const isRecommended = g.name === recommendedGate
          return (
            <button
              key={g.name}
              onClick={() => select(active ? null : g.name)}
              style={{
                position: 'relative',
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
              {isRecommended && !active && (
                <span style={{
                  position: 'absolute',
                  top: -8,
                  right: -4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: tok.accent,
                  background: tok.cardActiveBg,
                  border: `1px solid ${tok.cardActiveBorder}`,
                  borderRadius: 8,
                  padding: '1px 6px',
                }}>
                  추천
                </span>
              )}
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
    </div>
  )
}
