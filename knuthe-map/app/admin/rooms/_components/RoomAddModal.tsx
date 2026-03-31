'use client'

import { useState, useEffect, useRef } from 'react'
import DepositDial from '@/components/shared/DepositDial'
import { THEME_TOKENS } from '@/lib/theme-tokens'

const ROOM_TYPES = ['원룸','투룸','복층형원룸','오피스텔','아파트','빌라','단독주택']

// 호수 유효성: 숫자 1~4자리 + 선택적으로 가/나/다 or B(지하) 접두사
// 예) 101, 202, 1001, 101가, B101
const UNIT_NUMBER_RE = /^(B|b)?\d{1,4}[가나다]?$/

interface Building { id: string; name: string | null; address: string | null }

interface Props {
  onCreated: (room: any) => void
  onClose: () => void
}

export default function RoomAddModal({ onCreated, onClose }: Props) {
  const [query,        setQuery]        = useState('')
  const [buildings,    setBuildings]    = useState<Building[]>([])
  const [selected,     setSelected]     = useState<Building | null>(null)
  const [searching,    setSearching]    = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [contractType, setContractType] = useState<'월세'|'전세'|'매매'>('월세')
  const [deposit,      setDeposit]      = useState(500)
  const [monthlyRent,  setMonthlyRent]  = useState(40)
  const [maintenance,  setMaintenance]  = useState('')
  const [area,         setArea]         = useState('')
  const [floor,        setFloor]        = useState('')
  const [unitNumber,   setUnitNumber]   = useState('')
  const [unitError,    setUnitError]    = useState<string | null>(null)
  const [roomType,     setRoomType]     = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [availFrom,    setAvailFrom]    = useState('')
  const [description,  setDescription]  = useState('')

  // 이미지: 로컬 File + 미리보기 URL
  const [pendingFiles,   setPendingFiles]   = useState<File[]>([])
  const [previewUrls,    setPreviewUrls]    = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [progress,   setProgress]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  // 로컬 미리보기 URL 생성 / 해제
  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)) }
  }, [pendingFiles])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || selected) return
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/buildings/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setBuildings(data)
      setSearching(false)
    }, 300)
  }, [query, selected])

  const addFiles = (files: FileList) => {
    const valid = Array.from(files).filter((f) =>
      ['image/jpeg','image/png','image/webp'].includes(f.type)
    )
    setPendingFiles((prev) => [...prev, ...valid])
  }

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const validateUnitNumber = (v: string) => {
    if (!v) return null  // 선택 필드
    if (!UNIT_NUMBER_RE.test(v)) return '호수 형식이 올바르지 않아요 (예: 101, B201, 305가)'
    return null
  }

  const handleSubmit = async () => {
    const unitErr = validateUnitNumber(unitNumber.trim())
    if (unitErr) { setUnitError(unitErr); return }

    if (!selected)   { setError('건물을 선택해주세요'); return }
    if (deposit <= 0) { setError('보증금을 입력해주세요'); return }
    if (contractType === '월세' && monthlyRent <= 0) { setError('월세를 입력해주세요'); return }

    setSubmitting(true); setError(null); setProgress('방 등록 중…')

    // 1. 방 생성
    const res = await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        building_id:   selected.id,
        contract_type: contractType,
        deposit:       deposit,
        monthly_rent:  contractType === '월세' ? monthlyRent : null,
        maintenance:   maintenance  ? Number(maintenance)   : null,
        area_m2:       area         ? Number(area)          : null,
        floor:         floor        ? Number(floor)         : null,
        room_type:     roomType     || null,
        contact_phone: contactPhone || null,
        available_from: availFrom   || null,
        description:   description  || null,
        unit_number:   unitNumber.trim() || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? '등록 실패'); setSubmitting(false); setProgress(null); return }

    const roomId = json.id

    // 2. 이미지 업로드
    if (pendingFiles.length > 0) {
      const uploadedUrls: string[] = []
      for (let i = 0; i < pendingFiles.length; i++) {
        setProgress(`이미지 업로드 중… (${i + 1}/${pendingFiles.length})`)
        const form = new FormData()
        form.append('file',   pendingFiles[i])
        form.append('bucket', 'room-images')
        form.append('id',     roomId)
        const upRes = await fetch('/api/admin/upload', { method: 'POST', body: form })
        if (upRes.ok) {
          const { url } = await upRes.json()
          uploadedUrls.push(url)
        }
      }
      if (uploadedUrls.length > 0) {
        await fetch(`/api/admin/rooms/${roomId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: uploadedUrls }),
        })
        json.images = uploadedUrls
      }
    }

    setSubmitting(false); setProgress(null)
    onCreated(json)
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.15)', fontSize: 16, outline: 'none', boxSizing: 'border-box',
    background: '#1a1a1a', color: '#ffffff',
  }
  const lbl = (t: string, req = false) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 5px' }}>
      {t}{req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </p>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#111111', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        padding: '20px 20px 32px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#ffffff' }}>방(매물) 추가</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 건물 검색 */}
          <div>
            {lbl('건물 선택', true)}
            {selected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.3)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{selected.address}</div>
                </div>
                <button onClick={() => { setSelected(null); setQuery(''); setBuildings([]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>✕</button>
              </div>
            ) : (
              <>
                <input style={inp}
                  placeholder="건물명 또는 주소 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {searching && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>검색 중…</p>}
                {buildings.length > 0 && (
                  <div style={{ marginTop: 4, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden' }}>
                    {buildings.map((b) => (
                      <button key={b.id}
                        onClick={() => { setSelected(b); setQuery(b.name ?? ''); setBuildings([]) }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 12px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
                          background: '#1a1a1a', cursor: 'pointer',
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.address}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 계약 유형 */}
          <div>
            {lbl('계약 유형', true)}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['월세','전세','매매'] as const).map((t) => (
                <button key={t} onClick={() => setContractType(t)} style={{
                  flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: contractType === t ? '2px solid #2563eb' : '1.5px solid rgba(255,255,255,0.15)',
                  background: contractType === t ? 'rgba(37,99,235,0.15)' : '#1a1a1a',
                  color: contractType === t ? '#2563eb' : 'rgba(255,255,255,0.5)',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* 보증금 / 월세 — 다이얼 */}
          <DepositDial
            label="보증금 (만원)" required
            value={deposit} onChange={setDeposit}
            min={0} max={10000} step={50}
            tok={THEME_TOKENS.dark}
          />
          {contractType === '월세' && (
            <DepositDial
              label="월세 (만원)" required
              value={monthlyRent} onChange={setMonthlyRent}
              min={0} max={200} step={5}
              tok={THEME_TOKENS.dark}
            />
          )}

          {/* 관리비 / 면적 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {lbl('관리비 (만원)')}
              <input style={inp} type="number" min="0" placeholder="예) 5"
                value={maintenance} onChange={(e) => setMaintenance(e.target.value)} />
            </div>
            <div>
              {lbl('면적 (㎡)')}
              <input style={inp} type="number" min="0" step="0.1" placeholder="예) 20.5"
                value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </div>

          {/* 층 / 호수 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {lbl('층')}
              <input style={inp} type="number" min="1" placeholder="예) 3"
                value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>
            <div>
              {lbl('호수')}
              <input
                style={{ ...inp, borderColor: unitError ? '#ef4444' : '#e2e8f0' }}
                placeholder="예) 101, B201, 305가"
                value={unitNumber}
                onChange={(e) => {
                  setUnitNumber(e.target.value)
                  setUnitError(validateUnitNumber(e.target.value.trim()))
                }}
              />
              {unitError && (
                <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{unitError}</p>
              )}
            </div>
          </div>

          {/* 방 유형 */}
          <div>
            {lbl('방 유형')}
            <select style={inp} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option value="">선택 안함</option>
              {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 연락처 + 입주 가능일 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {lbl('연락처')}
              <input style={inp} type="tel" placeholder="010-0000-0000"
                value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div>
              {lbl('입주 가능일')}
              <input style={inp} type="date"
                value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} />
            </div>
          </div>

          {/* 설명 */}
          <div>
            {lbl('설명 (선택)')}
            <textarea style={{ ...inp, height: 72, resize: 'none', lineHeight: 1.5 }}
              placeholder="방 특징, 주의사항 등"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* 이미지 */}
          <div>
            {lbl('사진 (선택)')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {previewUrls.map((url, idx) => (
                <div key={url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#f1f5f9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removeFile(idx)}
                    style={{
                      position: 'absolute', top: 3, right: 3,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>
              ))}
              <button
                onClick={() => imageInputRef.current?.click()}
                style={{
                  aspectRatio: '1', borderRadius: 10,
                  border: '2px dashed #e2e8f0', background: '#f8fafc',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                }}>
                <span style={{ fontSize: 20, color: '#94a3b8' }}>+</span>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>사진 추가</span>
              </button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files) }}
            />
            {pendingFiles.length > 0 && (
              <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>
                {pendingFiles.length}장 선택됨 — 등록 시 자동 업로드
              </p>
            )}
          </div>

          {progress && <p style={{ fontSize: 12, color: '#2563eb', margin: 0 }}>{progress}</p>}
          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
            background: submitting ? '#93c5fd' : '#2563eb',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
          }}>
            {submitting ? (progress ?? '등록 중…') : '매물 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
