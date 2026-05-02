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

// 호수: 한 층당 8개 슬롯(N01~N08), 1~50층 → [101..108, 201..208, …, 5001..5008]
const SLOTS_PER_FLOOR = 8
const UNIT_VALUES: number[] = (() => {
  const arr: number[] = []
  for (let f = 1; f <= 50; f++) {
    for (let s = 1; s <= SLOTS_PER_FLOOR; s++) arr.push(f * 100 + s)
  }
  return arr
})()
const floorOf = (unit: number) => Math.floor(unit / 100)
const slotOf  = (unit: number) => {
  const s = unit % 100
  return Math.min(SLOTS_PER_FLOOR, Math.max(1, s))
}

// 층수: 지하 5층 ~ 지상 50층 (0층 제외)
const FLOOR_VALUES: number[] = [
  ...Array.from({ length: 5 }, (_, i) => -(5 - i)),  // -5 .. -1
  ...Array.from({ length: 50 }, (_, i) => i + 1),    // 1 .. 50
]

// 면적: 5평 ~ 60평 (0.5평 단위)
const PYEONG_VALUES: number[] = Array.from({ length: 111 }, (_, i) => 5 + i * 0.5)
// 면적: 5㎡ ~ 200㎡ (1㎡ 단위)
const M2_VALUES:    number[] = Array.from({ length: 196 }, (_, i) => 5 + i)

const M2_PER_PYEONG = 3.3058

function pyeongToM2(p: number): number {
  return Math.round(p * M2_PER_PYEONG * 10) / 10
}
function m2ToPyeong(m: number): number {
  // 0.5평 단위로 반올림
  return Math.round((m / M2_PER_PYEONG) * 2) / 2
}
function nearestInArray(arr: number[], v: number): number {
  let best = arr[0]
  let diff = Math.abs(arr[0] - v)
  for (const x of arr) {
    const d = Math.abs(x - v)
    if (d < diff) { diff = d; best = x }
  }
  return best
}

function formatDeposit(v: number): string {
  if (v === 0) return '없음'
  if (v >= 10000 && v % 10000 === 0) return `${v / 10000}억`
  if (v >= 1000  && v % 1000  === 0) return `${v / 1000}천만원`
  return `${v}만원`
}

const formatUnit  = (v: number) => `${v}호`
const formatFloor = (v: number) => v < 0 ? `지하 ${-v}층` : `${v}층`

export default function ContractForm({ renewal, onSaved, onCancel, theme = 'light' as ThemeMode }: Props) {
  const tok = THEME_TOKENS[theme]

  // 건물 검색
  const [query,          setQuery]          = useState('')
  const [results,        setResults]        = useState<BuildingResult[]>([])
  const [searching,      setSearching]      = useState(false)
  const [selectedBldg,   setSelectedBldg]   = useState<BuildingResult | null>(null)
  const [manualAddress,  setManualAddress]  = useState('')
  const [useManual,      setUseManual]      = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 호수·층수 (드럼) — 한 층당 슬롯 8개로 연동
  const { initialFloor, initialSlot } = (() => {
    const f0 = renewal?.floor != null ? nearestInArray(FLOOR_VALUES, renewal.floor) : 1
    const num = renewal?.unit_number?.match(/\d+/)?.[0]
    if (!num) return { initialFloor: f0, initialSlot: 1 }
    const n = parseInt(num)
    // n>=100: floor*100+slot 형식 / 1~99: 슬롯 단독 (구버전 데이터)
    if (n >= 100) {
      const f = floorOf(n)
      return f0 < 0
        ? { initialFloor: f0, initialSlot: 1 }
        : { initialFloor: Math.min(50, Math.max(1, f)), initialSlot: slotOf(n) }
    }
    return { initialFloor: f0 > 0 ? f0 : 1, initialSlot: Math.min(SLOTS_PER_FLOOR, Math.max(1, n)) }
  })()

  const [floor, setFloor] = useState(initialFloor)
  const [slot,  setSlot]  = useState(initialSlot)
  const unitNum = floor > 0 ? floor * 100 + slot : null

  // 면적: 내부 상태는 항상 ㎡, 표시 단위만 토글
  const [areaM2,   setAreaM2]   = useState<number>(renewal?.area_m2 ?? pyeongToM2(10))
  const [areaUnit, setAreaUnit] = useState<'pyeong' | 'm2'>('pyeong')

  // 계약 필드
  const [contractType, setContractType] = useState<'월세' | '전세'>(
    renewal?.contract_type ?? '월세'
  )
  const [deposit,      setDeposit]      = useState(renewal?.deposit      ?? 500)
  const [monthlyRent,  setMonthlyRent]  = useState(renewal?.monthly_rent ?? 30)
  const [maintenance,  setMaintenance]  = useState(renewal?.maintenance  ?? 0)
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
      unit_number:          unitNum != null ? formatUnit(unitNum) : null,
      floor:                floor,
      area_m2:              Math.round(areaM2 * 10) / 10,
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

  // 면적 드럼 표시값/배열 (단위 토글에 따라 달라짐)
  const areaDrumValue = areaUnit === 'pyeong'
    ? nearestInArray(PYEONG_VALUES, m2ToPyeong(areaM2))
    : nearestInArray(M2_VALUES, Math.round(areaM2))
  const areaDrumValues = areaUnit === 'pyeong' ? PYEONG_VALUES : M2_VALUES
  const formatArea     = (v: number) => areaUnit === 'pyeong' ? `${v}평` : `${v}㎡`
  const onAreaDrumChange = (v: number) => {
    setAreaM2(areaUnit === 'pyeong' ? pyeongToM2(v) : v)
  }

  const areaPyeong = m2ToPyeong(areaM2)
  const areaSecondary = areaUnit === 'pyeong'
    ? `≈ ${pyeongToM2(areaPyeong).toFixed(1)}㎡`
    : `≈ ${areaPyeong}평`

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

          <div style={{ marginBottom: 14 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              {subLabel(`호수 · ${unitNum != null ? formatUnit(unitNum) : '—'}`)}
              {unitNum != null ? (
                <MoneyDrumPicker
                  tok={tok}
                  values={UNIT_VALUES}
                  value={unitNum}
                  onChange={(v) => {
                    const f = floorOf(v)
                    const s = slotOf(v)
                    setFloor(f)
                    setSlot(s)
                  }}
                  format={formatUnit}
                />
              ) : (
                <div style={{
                  height: 44 * 5, borderRadius: 12, background: tok.inputBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: tok.textTertiary, fontSize: 13, padding: '0 12px', textAlign: 'center',
                }}>
                  지상층에서만<br />호수를 선택할 수 있어요
                </div>
              )}
            </div>
            <div>
              {subLabel(`층수 · ${formatFloor(floor)}`)}
              <MoneyDrumPicker
                tok={tok}
                values={FLOOR_VALUES}
                value={floor}
                onChange={(f) => {
                  setFloor(f)
                  if (f > 0 && (slot < 1 || slot > SLOTS_PER_FLOOR)) setSlot(1)
                }}
                format={formatFloor}
              />
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: tok.textSecondary, margin: 0 }}>
                면적 · {formatArea(areaDrumValue)}
                <span style={{ marginLeft: 6, color: tok.textTertiary, fontWeight: 500 }}>
                  {areaSecondary}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setAreaUnit((u) => u === 'pyeong' ? 'm2' : 'pyeong')}
                aria-label="면적 단위 변환"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  background: tok.accentBg, color: tok.accentColor,
                  border: `1px solid ${tok.accentColor}33`,
                  cursor: 'pointer', fontSize: 11, fontWeight: 700,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7h18l-3-3" /><path d="M21 17H3l3 3" />
                </svg>
                {areaUnit === 'pyeong' ? '㎡로 보기' : '평으로 보기'}
              </button>
            </div>
            <MoneyDrumPicker tok={tok} values={areaDrumValues} value={areaDrumValue}
              onChange={onAreaDrumChange} format={formatArea} />
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

          {/* 보증금 + 월세 (같은 행) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: contractType === '월세' ? '1fr 1fr' : '1fr',
            gap: 10, marginBottom: 14,
          }}>
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
          </div>

          <div>
            {subLabel(`관리비 (선택) · ${maintenance === 0 ? '없음' : `${maintenance}만원`}`)}
            <MoneyDrumPicker tok={tok} values={MAINTENANCE_VALUES} value={maintenance} onChange={setMaintenance} />
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
