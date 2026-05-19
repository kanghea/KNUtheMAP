'use client'

import { useState } from 'react'
import type { UserContract, HistoryEntry } from './MyContractsManager'
import { THEME_TOKENS, type ThemeMode, type ThemeTokens } from '@/lib/theme-tokens'

interface Props {
  contract: UserContract
  onEdit:   (patch: Partial<UserContract>) => void
  onEnd:    () => void
  onRenew:  () => void
  theme?:   ThemeMode
}

const FIELD_LABELS: Record<string, string> = {
  deposit:        '보증금',
  monthly_rent:   '월세',
  maintenance:    '관리비',
  contract_start: '계약 시작',
  contract_end:   '계약 종료',
  unit_number:    '호수',
}

function priceTag(c: UserContract) {
  if (c.contract_type === '전세') return `전세 ${c.deposit.toLocaleString()}만`
  const dep  = c.deposit > 0 ? `${c.deposit.toLocaleString()}만 / ` : ''
  const rent = c.monthly_rent ? `월 ${c.monthly_rent.toLocaleString()}만` : '-'
  return `${dep}${rent}`
}

function buildingName(c: UserContract) {
  if (c.buildings?.name) return c.buildings.name
  if (c.buildings?.address) return c.buildings.address.split(' ').slice(-2).join(' ')
  return c.address_text ?? '주소 미입력'
}

function ActionLabel({ action, tok }: { action: HistoryEntry['action']; tok: ThemeTokens }) {
  const map = { created: '계약 등록', updated: '내용 변경', renewed: '연장 계약', ended: '계약 종료' }
  const colors: Record<HistoryEntry['action'], string> = {
    created: tok.successColor,
    updated: tok.accentColor,
    renewed: '#a78bfa',
    ended:   tok.dangerColor,
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
      background: `${colors[action]}22`, color: colors[action],
    }}>
      {map[action]}
    </span>
  )
}

function HistoryTimeline({ history, tok }: { history: HistoryEntry[]; tok: ThemeTokens }) {
  if (history.length === 0) return (
    <p style={{ fontSize: 12, color: tok.textTertiary, textAlign: 'center', padding: '12px 0' }}>
      변경 이력이 없습니다
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {[...history].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((h, i) => (
        <div key={h.id} style={{
          display: 'flex', gap: 10, paddingBottom: i < history.length - 1 ? 12 : 0,
        }}>
          {/* 타임라인 선 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tok.accentColor, flexShrink: 0, marginTop: 3 }} />
            {i < history.length - 1 && (
              <div style={{ flex: 1, width: 1, background: tok.cardBorder, marginTop: 3 }} />
            )}
          </div>

          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ActionLabel action={h.action} tok={tok} />
              <span style={{ fontSize: 10, color: tok.textTertiary }}>
                {new Date(h.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {h.changed_fields && Object.entries(h.changed_fields).map(([field, [oldVal, newVal]]) => (
              <div key={field} style={{ fontSize: 11, color: tok.textSecondary, marginBottom: 2 }}>
                <span style={{ color: tok.textTertiary }}>{FIELD_LABELS[field] ?? field}: </span>
                <span style={{ textDecoration: 'line-through', color: tok.dangerColor }}>
                  {typeof oldVal === 'number' ? `${(oldVal as number).toLocaleString()}만` : String(oldVal ?? '-')}
                </span>
                {' → '}
                <span style={{ color: tok.successColor, fontWeight: 600 }}>
                  {typeof newVal === 'number' ? `${(newVal as number).toLocaleString()}만` : String(newVal ?? '-')}
                </span>
              </div>
            ))}

            {h.action === 'created' || h.action === 'renewed' ? (
              <div style={{ fontSize: 11, color: tok.textSecondary }}>
                {`${(h.snapshot.contract_type as string)} · 보증금 ${((h.snapshot.deposit as number) ?? 0).toLocaleString()}만`}
                {h.snapshot.monthly_rent ? ` / 월세 ${((h.snapshot.monthly_rent as number)).toLocaleString()}만` : ''}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ContractCard({ contract: c, onEdit, onEnd, onRenew, theme = 'light' }: Props) {
  const tok = THEME_TOKENS[theme]
  const [showHistory, setShowHistory] = useState(false)
  const [editing,     setEditing]     = useState(false)

  const [deposit,     setDeposit]     = useState(String(c.deposit))
  const [monthlyRent, setMonthlyRent] = useState(String(c.monthly_rent ?? ''))
  const [maintenance, setMaintenance] = useState(String(c.maintenance ?? ''))
  const [contractEnd, setContractEnd] = useState(c.contract_end ?? '')
  const [saving,      setSaving]      = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onEdit({
      deposit:      parseInt(deposit),
      monthly_rent: monthlyRent ? parseInt(monthlyRent) : null,
      maintenance:  maintenance ? parseInt(maintenance) : null,
      contract_end: contractEnd || null,
    })
    setSaving(false)
    setEditing(false)
  }

  const isExpiring = c.contract_end
    ? (new Date(c.contract_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 60
    : false

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${tok.inputBorder}`, fontSize: 16,
    background: tok.inputBg, color: tok.inputColor, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  const warnColor = '#f59e0b'

  return (
    <div style={{
      background: tok.cardBg, borderRadius: 16,
      border: `1.5px solid ${isExpiring ? `${warnColor}66` : tok.cardBorder}`,
      overflow: 'hidden',
    }}>
      {/* ── 만료 임박 배너 ──────────────────────────────────── */}
      {isExpiring && (
        <div style={{
          background: `${warnColor}1a`, borderBottom: `1px solid ${warnColor}4d`,
          padding: '7px 14px', fontSize: 11, fontWeight: 600, color: warnColor,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          ⚠️ 계약 만료가 60일 이내입니다
        </div>
      )}

      {/* ── 헤더 ────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 계약 유형 배지 + 건물명 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                background: c.contract_type === '월세' ? tok.accentBg : tok.successBg,
                color: c.contract_type === '월세' ? tok.accentColor : tok.successColor,
              }}>{c.contract_type}</span>
              {c.is_renewal && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                  background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
                }}>연장</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {buildingName(c)}
            </div>
            <div style={{ fontSize: 11, color: tok.textSecondary }}>
              {[c.unit_number, c.floor ? `${c.floor}층` : null, c.room_type, c.area_m2 ? `${c.area_m2}㎡` : null]
                .filter(Boolean).join(' · ')}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button
              onClick={() => { setEditing((v) => !v); setShowHistory(false) }}
              style={{
                padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: `1px solid ${tok.inputBorder}`,
                background: editing ? tok.accentBg : 'transparent',
                color: editing ? tok.accentColor : tok.textSecondary, cursor: 'pointer',
              }}
            >수정</button>
            <button
              onClick={onRenew}
              style={{
                padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: `1px solid ${tok.inputBorder}`, background: 'transparent',
                color: '#a78bfa', cursor: 'pointer',
              }}
            >연장</button>
          </div>
        </div>

        {/* ── 금액 + 기간 요약 ─────────────────────────────── */}
        {!editing && (
          <div style={{
            marginTop: 10, background: tok.inputBg, borderRadius: 10,
            padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: `1px solid ${tok.cardBorder}`,
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: tok.textPrimary }}>
              {priceTag(c)}
            </span>
            <span style={{ fontSize: 11, color: tok.textTertiary }}>
              {c.contract_start?.slice(0, 7) ?? '?'} ~ {c.contract_end?.slice(0, 7) ?? '?'}
            </span>
          </div>
        )}

        {/* ── 인라인 수정 폼 ───────────────────────────────── */}
        {editing && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: c.contract_type === '월세' ? '1fr 1fr' : '1fr', gap: 8 }}>
              <div>
                <p style={{ fontSize: 10, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600 }}>보증금 (만원)</p>
                <input style={inputStyle} type="number" inputMode="numeric" value={deposit}
                  onChange={(e) => setDeposit(e.target.value)} />
              </div>
              {c.contract_type === '월세' && (
                <div>
                  <p style={{ fontSize: 10, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600 }}>월세 (만원)</p>
                  <input style={inputStyle} type="number" inputMode="numeric" value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)} />
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <p style={{ fontSize: 10, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600 }}>관리비 (만원)</p>
                <input style={inputStyle} type="number" inputMode="numeric" value={maintenance}
                  onChange={(e) => setMaintenance(e.target.value)} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600 }}>계약 종료일</p>
                <input
                  style={{ ...inputStyle, padding: '10px 10px' }}
                  type="date"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: tok.accentColor, color: '#fff', border: 'none',
                  cursor: saving ? 'default' : 'pointer',
                }}
              >{saving ? '저장 중…' : '저장'}</button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: 'transparent', color: tok.textSecondary,
                  border: `1.5px solid ${tok.inputBorder}`, cursor: 'pointer',
                }}
              >취소</button>
              <button
                onClick={() => { if (confirm('이 계약을 종료하시겠어요?')) onEnd() }}
                style={{
                  padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: tok.dangerBg, color: tok.dangerColor,
                  border: `1px solid ${tok.dangerColor}33`, cursor: 'pointer',
                }}
              >종료</button>
            </div>
          </div>
        )}
      </div>

      {/* ── 가격 변동 이력 토글 ──────────────────────────────── */}
      <button
        onClick={() => { setShowHistory((v) => !v); setEditing(false) }}
        style={{
          width: '100%', padding: '10px 16px', background: 'none',
          border: 'none', borderTop: `1px solid ${tok.cardBorder}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: tok.textTertiary }}>
          가격 변동 이력 ({c.user_contract_history.length}건)
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={tok.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {showHistory && (
        <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${tok.cardBorder}` }}>
          <HistoryTimeline history={c.user_contract_history} tok={tok} />
        </div>
      )}
    </div>
  )
}
