'use client'

import { useState, useEffect, useRef } from 'react'
import type { UserContract } from './MyContractsManager'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import MoneyDrumPicker, {
  DEPOSIT_VALUES, MONTHLY_VALUES, MAINTENANCE_VALUES,
} from '@/components/shared/MoneyDrumPicker'

interface Props {
  renewal?: UserContract
  onSaved:  () => void
  onCancel: () => void
  theme?:   ThemeMode
}

interface BuildingResult {
  id: string
  name: string | null
  address: string | null
}

const CONTRACT_TYPES = ['월세', '전세'] as const
const ROOM_TYPES = ['원룸', '투룸', '복층형원룸', '오피스텔', '아파트', '빌라', '단독주택']

function formatDeposit(v: number): string {
  if (v === 0) return '없음'
  if (v >= 10000 && v % 10000 === 0) return `${v / 10000}억`
  if (v >= 1000  && v % 1000  === 0) return `${v / 1000}천만원`
  return `${v}만원`
}

export default function ContractForm({ renewal, onSaved, onCancel, theme = 'dark' as ThemeMode }: Props) {
  const tok = THEME_TOKENS[theme]

  // 건물 검색
  const [query,          setQuery]          = useState('')
  const [results,        setResults]        = useState<BuildingResult[]>([])
  const [searching,      setSearching]      = useState(false)
  const [selectedBldg,   setSelectedBldg]   = useState<BuildingResult | null>(null)
  const [manualAddress,  setManualAddress]  = useState('')
  const [useManual,      setUseManual]      = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 계약 필드
  const [contractType, setContractType] = useState<'월세' | '전세'>(
    renewal?.contract_type ?? '월세'
  )
  const [deposit,      setDeposit]      = useState(renewal?.deposit      ?? 500)
  const [monthlyRent,  setMonthlyRent]  = useState(renewal?.monthly_rent ?? 30)
  const [maintenance,  setMaintenance]  = useState(renewal?.maintenance  ?? 0)
  const [unitNumber,   setUnitNumber]   = useState(renewal?.unit_number ?? '')
  const [floor,        setFloor]        = useState(String(renewal?.floor ?? ''))
  const [areaM2,       setAreaM2]       = useState(String(renewal?.area_m2 ?? ''))
  const [roomType,     setRoomType]     = useState(renewal?.room_type ?? '')
  const [startDate,    setStartDate]    = useState(renewal?.contract_end ?? '')
  const [endDate,      setEndDate]      = useState('')
  const [memo,         setMemo]         = useState('')

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // 연장 시 이전 건물 자동 선택
  useEffect(() => {
    if (renewal?.buildings) {
      setSelectedBldg({
        id:      renewal.building_id!,
        name:    renewal.buildings.name,
        address: renewal.buildings.address,
      })
    } else if (renewal?.address_text) {
      setUseManual(true)
      setManualAddress(renewal.address_text)
    }
  }, [renewal])

  // 건물 검색 디바운스
  useEffect(() => {
    if (useManual || query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/buildings/search?q=${encodeURIComponent(query)}&limit=6`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.buildings ?? data ?? [])
      }
      setSearching(false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, useManual])

  const handleSubmit = async () => {
    if (!selectedBldg && !useManual) {
      setError('건물을 선택하거나 주소를 직접 입력해주세요')
      return
    }
    if (useManual && !manualAddress.trim()) {
      setError('주소를 입력해주세요')
      return
    }
    if (!deposit && deposit !== 0) { setError('보증금을 선택해주세요'); return }

    setSaving(true); setError(null)
    const body = {
      building_id:          selectedBldg?.id    ?? null,
      address_text:         useManual ? manualAddress : null,
      unit_number:          unitNumber  || null,
      floor:                floor       ? parseInt(floor)       : null,
      area_m2:              areaM2      ? parseFloat(areaM2)    : null,
      room_type:            roomType    || null,
      contract_type:        contractType,
      deposit:              deposit,
      monthly_rent:         monthlyRent  > 0 ? monthlyRent  : null,
      maintenance:          maintenance  > 0 ? maintenance  : null,
      contract_start:       startDate   || null,
      contract_end:         endDate     || null,
      is_renewal:           !!renewal,
      previous_contract_id: renewal?.id ?? null,
      memo:                 memo        || null,
    }

    const res = await fetch('/api/user-contracts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    setSaving(false)
    if (!res.ok) {
      const j = await res.json()
      setError(j.error ?? '저장에 실패했어요')
      return
    }
    onSaved()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: `1.5px solid ${tok.inputBorder}`, fontSize: 16, color: tok.inputColor,
    background: tok.inputBg, outline: 'none', boxSizing: 'border-box',
  }

  const sectionLabel = (txt: string) => (
    <p style={{
      fontSize: 11, fontWeight: 700, color: tok.textTertiary, margin: '0 0 8px',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{txt}</p>
  )

  const subLabel = (txt: string) => (
    <p style={{ fontSize: 12, fontWeight: 600, color: tok.textSecondary, margin: '0 0 6px' }}>{txt}</p>
  )

  const sectionStyle: React.CSSProperties = {
    paddingBottom: 18,
    borderBottom: `1px solid ${tok.cardBorder}`,
    marginBottom: 18,
  }

  return (
    <div style={{
      background: tok.cardBg, borderRadius: 16,
      border: `1.5px solid ${tok.cardBorder}`,
      marginBottom: 12, overflow: 'hidden',
    }}>
      {/* ── 헤더 (sticky) ─────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 3,
        background: tok.cardBg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: `1px solid ${tok.cardBorder}`,
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: tok.textPrimary }}>
          {renewal ? '계약 연장' : '새 계약 추가'}
        </span>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: tok.textSecondary, padding: '4px 8px',
        }}>닫기</button>
      </div>

      <div style={{ padding: '18px 16px' }}>
        {/* ── 1. 건물 ────────────────────────────────────────── */}
        <div style={sectionStyle}>
          {sectionLabel('건물 주소')}
          {!useManual ? (
            <>
              {selectedBldg ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: tok.accentBg, border: `1.5px solid ${tok.accentColor}55`,
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: tok.accentColor,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedBldg.name ?? selectedBldg.address}
                    </div>
                    {selectedBldg.name && selectedBldg.address && (
                      <div style={{ fontSize: 11, color: tok.accentColor, opacity: 0.7, marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedBldg.address}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setSelectedBldg(null); setQuery('') }}
                    style={{
                      background: 'transparent', border: `1px solid ${tok.accentColor}55`,
                      borderRadius: 8, padding: '5px 10px',
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      color: tok.accentColor, flexShrink: 0, marginLeft: 8,
                    }}>
                    변경
                  </button>
                </div>
              ) : (
                <>
                  <input
                    style={inputStyle}
                    placeholder="건물명 또는 주소로 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {searching && (
                    <p style={{ fontSize: 12, color: tok.textTertiary, marginTop: 6 }}>검색 중…</p>
                  )}
                  {results.length > 0 && (
                    <div style={{
                      border: `1px solid ${tok.cardBorder}`, borderRadius: 12, overflow: 'hidden',
                      marginTop: 6, background: tok.inputBg,
                    }}>
                      {results.map((b, i) => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBldg(b); setQuery(''); setResults([]) }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '12px 14px',
                            background: 'none', border: 'none',
                            borderBottom: i < results.length - 1 ? `1px solid ${tok.cardBorder}` : 'none',
                            cursor: 'pointer', display: 'block',
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 600, color: tok.textPrimary }}>
                            {b.name ?? '(이름 없음)'}
                          </div>
                          <div style={{ fontSize: 11, color: tok.textTertiary, marginTop: 2 }}>
                            {b.address}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setUseManual(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: tok.textSecondary,
                      padding: '8px 0 0', display: 'block',
                    }}
                  >
                    건물을 찾을 수 없어요 →  직접 입력
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <input
                style={inputStyle}
                placeholder="예) 대구 북구 복현동 123-4"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
              <button onClick={() => { setUseManual(false); setManualAddress('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: tok.textSecondary,
                  padding: '8px 0 0', display: 'block',
                }}>
                ← 건물 검색으로 돌아가기
              </button>
            </>
          )}
        </div>

        {/* ── 2. 방 정보 ─────────────────────────────────────── */}
        <div style={sectionStyle}>
          {sectionLabel('방 정보')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                {subLabel('호수')}
                <input style={inputStyle} placeholder="예) 301호" inputMode="text"
                  value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
              </div>
              <div>
                {subLabel('층수')}
                <input style={inputStyle} placeholder="예) 3" type="number" inputMode="numeric"
                  value={floor} onChange={(e) => setFloor(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                {subLabel('방 유형')}
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {subLabel('면적 (㎡)')}
                <input style={inputStyle} placeholder="예) 25.5" type="number" inputMode="decimal" step="0.1"
                  value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. 계약 조건 ───────────────────────────────────── */}
        <div style={sectionStyle}>
          {sectionLabel('계약 조건')}

          {/* 계약 유형 토글 */}
          <div style={{ marginBottom: 14 }}>
            {subLabel('계약 유형')}
            <div style={{
              display: 'flex', gap: 0, padding: 4, borderRadius: 12,
              background: tok.inputBg, border: `1px solid ${tok.cardBorder}`,
            }}>
              {CONTRACT_TYPES.map((t) => {
                const active = contractType === t
                return (
                  <button
                    key={t}
                    onClick={() => setContractType(t)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 700,
                      border: 'none',
                      background: active ? tok.accentColor : 'transparent',
                      color: active ? '#fff' : tok.textSecondary,
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                  >{t}</button>
                )
              })}
            </div>
          </div>

          {/* 보증금 + 월세 (드럼) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              {subLabel(`보증금 · ${formatDeposit(deposit)}`)}
              <MoneyDrumPicker tok={tok} values={DEPOSIT_VALUES} value={deposit} onChange={setDeposit} />
            </div>
            {contractType === '월세' && (
              <div>
                {subLabel(`월세 · ${monthlyRent === 0 ? '없음' : `${monthlyRent}만원`}`)}
                <MoneyDrumPicker tok={tok} values={MONTHLY_VALUES} value={monthlyRent} onChange={setMonthlyRent} />
              </div>
            )}
            <div>
              {subLabel(`관리비 (선택) · ${maintenance === 0 ? '없음' : `${maintenance}만원`}`)}
              <MoneyDrumPicker tok={tok} values={MAINTENANCE_VALUES} value={maintenance} onChange={setMaintenance} />
            </div>
          </div>
        </div>

        {/* ── 4. 계약 기간 ───────────────────────────────────── */}
        <div style={sectionStyle}>
          {sectionLabel('계약 기간')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {subLabel('시작일')}
              <input style={inputStyle} type="date"
                value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              {subLabel('종료일')}
              <input style={inputStyle} type="date"
                value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── 5. 메모 ────────────────────────────────────────── */}
        <div style={{ marginBottom: 4 }}>
          {sectionLabel('메모 (선택)')}
          <textarea
            style={{ ...inputStyle, height: 88, resize: 'none', lineHeight: 1.5, fontSize: 14 }}
            placeholder="특이사항 등 자유롭게"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      {/* ── 하단 sticky 저장 바 ────────────────────────────── */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 3,
        background: tok.cardBg,
        borderTop: `1px solid ${tok.cardBorder}`,
        padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {error && (
          <p style={{ margin: 0, fontSize: 12, color: tok.dangerColor, fontWeight: 600 }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              flex: 1, padding: '14px', borderRadius: 12,
              background: 'transparent', color: tok.textSecondary,
              border: `1.5px solid ${tok.inputBorder}`,
              cursor: saving ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700,
            }}
          >취소</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 2, padding: '14px', borderRadius: 12,
              background: tok.accentColor, color: '#fff',
              border: 'none', cursor: saving ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '저장 중…' : renewal ? '연장 계약 저장' : '계약 추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
