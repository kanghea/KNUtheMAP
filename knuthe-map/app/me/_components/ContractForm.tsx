'use client'

import { useState, useEffect, useRef } from 'react'
import type { UserContract } from './MyContractsManager'

interface Props {
  renewal?: UserContract   // 연장인 경우 이전 계약
  onSaved:  () => void
  onCancel: () => void
}

interface BuildingResult {
  id: string
  name: string | null
  address: string | null
}

const CONTRACT_TYPES = ['월세', '전세'] as const
const ROOM_TYPES = ['원룸', '투룸', '복층형원룸', '오피스텔', '아파트', '빌라', '단독주택']

export default function ContractForm({ renewal, onSaved, onCancel }: Props) {
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
  const [deposit,      setDeposit]      = useState(String(renewal?.deposit ?? ''))
  const [monthlyRent,  setMonthlyRent]  = useState(String(renewal?.monthly_rent ?? ''))
  const [maintenance,  setMaintenance]  = useState(String(renewal?.maintenance ?? ''))
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
    if (!deposit) { setError('보증금을 입력해주세요'); return }

    setSaving(true); setError(null)
    const body = {
      building_id:          selectedBldg?.id    ?? null,
      address_text:         useManual ? manualAddress : null,
      unit_number:          unitNumber  || null,
      floor:                floor       ? parseInt(floor)       : null,
      area_m2:              areaM2      ? parseFloat(areaM2)    : null,
      room_type:            roomType    || null,
      contract_type:        contractType,
      deposit:              parseInt(deposit),
      monthly_rent:         monthlyRent  ? parseInt(monthlyRent)  : null,
      maintenance:          maintenance  ? parseInt(maintenance)  : null,
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

  const label = (txt: string) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px',
      textTransform: 'uppercase', letterSpacing: '0.05em' }}>{txt}</p>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.15)', fontSize: 16, color: '#ffffff',
    background: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: '#111111', borderRadius: 16,
      border: '1.5px solid rgba(255,255,255,0.08)', padding: '18px 16px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
          {renewal ? '계약 연장' : '새 계약 추가'}
        </span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>취소</button>
      </div>

      {/* ── 건물 검색 ──────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        {label('건물 주소')}
        {!useManual ? (
          <>
            {selectedBldg ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(37,99,235,0.15)', border: '1.5px solid rgba(37,99,235,0.3)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>
                    {selectedBldg.name ?? selectedBldg.address}
                  </div>
                  {selectedBldg.name && (
                    <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 2 }}>
                      {selectedBldg.address}
                    </div>
                  )}
                </div>
                <button onClick={() => { setSelectedBldg(null); setQuery('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: '#93c5fd', flexShrink: 0, marginLeft: 8 }}>
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
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>검색 중…</p>
                )}
                {results.length > 0 && (
                  <div style={{
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden',
                    marginTop: 4, background: '#1a1a1a',
                  }}>
                    {results.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBldg(b); setQuery(''); setResults([]) }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 12px',
                          background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
                          cursor: 'pointer', display: 'block',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                          {b.name ?? '(이름 없음)'}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                          {b.address}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setUseManual(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '4px 0', marginTop: 2 }}
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
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '4px 0', marginTop: 2 }}>
              ← 건물 검색으로 돌아가기
            </button>
          </>
        )}
      </div>

      {/* ── 호수 + 층수 ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          {label('호수')}
          <input style={inputStyle} placeholder="예) 301호"
            value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
        </div>
        <div>
          {label('층수')}
          <input style={inputStyle} placeholder="예) 3" type="number"
            value={floor} onChange={(e) => setFloor(e.target.value)} />
        </div>
      </div>

      {/* ── 방 유형 + 면적 ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          {label('방 유형')}
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
          {label('면적 (㎡)')}
          <input style={inputStyle} placeholder="예) 25.5" type="number" step="0.1"
            value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
        </div>
      </div>

      {/* ── 계약 유형 ───────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        {label('계약 유형')}
        <div style={{ display: 'flex', gap: 6 }}>
          {CONTRACT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setContractType(t)}
              style={{
                flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: contractType === t ? '1.5px solid #2563eb' : '1.5px solid rgba(255,255,255,0.12)',
                background: contractType === t ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.05)',
                color: contractType === t ? '#2563eb' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* ── 금액 ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: contractType === '월세' ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 12 }}>
        <div>
          {label('보증금 (만원)')}
          <input style={inputStyle} placeholder="예) 500" type="number"
            value={deposit} onChange={(e) => setDeposit(e.target.value)} />
        </div>
        {contractType === '월세' && (
          <div>
            {label('월세 (만원)')}
            <input style={inputStyle} placeholder="예) 40" type="number"
              value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
          </div>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        {label('관리비 (만원, 선택)')}
        <input style={inputStyle} placeholder="예) 5" type="number"
          value={maintenance} onChange={(e) => setMaintenance(e.target.value)} />
      </div>

      {/* ── 계약 기간 ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          {label('계약 시작')}
          <input style={inputStyle} type="date"
            value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          {label('계약 종료')}
          <input style={inputStyle} type="date"
            value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* ── 메모 ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        {label('메모 (선택)')}
        <textarea
          style={{ ...inputStyle, height: 64, resize: 'none', lineHeight: 1.5 }}
          placeholder="특이사항 등 자유롭게"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ef4444' }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          width: '100%', padding: '12px', borderRadius: 12,
          background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
          border: 'none', cursor: saving ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 700,
        }}
      >
        {saving ? '저장 중…' : renewal ? '연장 계약 저장' : '계약 추가'}
      </button>
    </div>
  )
}
