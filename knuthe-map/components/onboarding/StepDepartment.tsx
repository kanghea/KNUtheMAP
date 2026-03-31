'use client'

import { useState } from 'react'
import { DEPARTMENTS, COLLEGES } from '@/lib/department-zones'

// 구역별 선배 팁
const ZONE_TIPS: Record<string, { gate: string; emoji: string; msg: string }> = {
  '정문':  { gate: '정문',  emoji: '🔬', msg: '자연대·수의대는 정문 쪽이 가장 가까워요. 정문 그린캠퍼스 인근 자취방이 인기 많아요.' },
  '북문':  { gate: '북문',  emoji: '🎒', msg: '인문대·예술대·농대는 북문 진입이 압도적으로 편해요. 북문 상권도 잘 갖춰져 있어요!' },
  '동문':  { gate: '동문',  emoji: '📚', msg: '경상대·사범대·사회과학대는 동문이 제일 가까워요. 조용하고 새 건물도 많아요.' },
  '서문':  { gate: '서문',  emoji: '⚙️', msg: '공대·IT대·약대는 서문 진입이 훨씬 가까워요. 서문~일청담 방면 자취방을 추천드려요!' },
  '칠곡':  { gate: '칠곡',  emoji: '🏥', msg: '의대·치대·간호대는 본교 캠퍼스와 따로 있어요. 동인동·삼덕 캠퍼스 인근 자취방을 추천드려요.' },
  '상주':  { gate: '상주',  emoji: '🌾', msg: '상주 캠퍼스 소재 학과예요. 상주시 캠퍼스 인근 자취방을 알아보세요.' },
}

type Tok = {
  textSecondary: string
  textPrimary: string
  surface: string
  border: string
  btnPrimary: string
  btnPrimaryText: string
  progressFill: string
}

const DEFAULT_TOK: Tok = {
  textSecondary:  '#64748b',
  textPrimary:    '#0f172a',
  surface:        '#f8fafc',
  border:         '#e2e8f0',
  btnPrimary:     '#2563eb',
  btnPrimaryText: '#ffffff',
  progressFill:   '#2563eb',
}

interface Props {
  selected: string | null
  onSelect: (dept: string) => void
  tok?: Tok
}

export default function StepDepartment({ selected, onSelect, tok = DEFAULT_TOK }: Props) {
  const [college, setCollege] = useState<string | null>(
    selected ? (DEPARTMENTS.find((d) => d.name === selected)?.college ?? null) : null
  )

  const depts = college ? DEPARTMENTS.filter((d) => d.college === college) : []

  const selectedDept = DEPARTMENTS.find((d) => d.name === selected)
  const tip = selectedDept ? ZONE_TIPS[selectedDept.zone] ?? null : null

  const chipBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'background .2s, color .2s, box-shadow .2s',
  }

  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: tok.btnPrimary,
    color: tok.btnPrimaryText,
    boxShadow: `0 0 0 2px ${tok.btnPrimary}40`,
  }

  const chipIdle: React.CSSProperties = {
    ...chipBase,
    background: tok.surface,
    color: tok.textSecondary,
    boxShadow: `inset 0 0 0 1px ${tok.border}`,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: tok.textSecondary,
    marginBottom: 8,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

      {/* 단과대 선택 */}
      <div>
        <p style={labelStyle}>단과대학</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COLLEGES.map((c) => (
            <button
              key={c}
              onClick={() => { setCollege(c); if (college !== c) onSelect('') }}
              style={college === c ? chipActive : chipIdle}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 학과 선택 */}
      {college && (
        <div>
          <p style={labelStyle}>학과·학부</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {depts.map((d) => (
              <button
                key={d.name}
                onClick={() => onSelect(d.name)}
                style={selected === d.name ? chipActive : chipIdle}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 선배 팁 */}
      {selected && tip && (
        <div style={{
          background: `${tok.btnPrimary}14`,
          border: `1px solid ${tok.btnPrimary}30`,
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          transition: 'background .4s ease, border-color .4s ease',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{tip.emoji}</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: tok.btnPrimary, margin: '0 0 4px', transition: 'color .4s ease' }}>
              {selected} 선배들은 주로 <strong>{tip.gate}</strong>을 사용해요!
            </p>
            <p style={{ fontSize: 12, color: tok.textSecondary, margin: 0, lineHeight: 1.6, transition: 'color .4s ease' }}>
              {tip.msg}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
