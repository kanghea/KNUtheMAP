'use client'

import { useState } from 'react'

const ZONES = ['북문','텍문','서문','쪽문','정문','동문','경북대학교']
const PURPS = ['단독주택','공동주택','제1종근린생활시설','제2종근린생활시설','근린생활시설','오피스텔','숙박시설','기타']

interface GeoResult {
  lat: number; lng: number
  roadAddress: string; jibunAddress: string
  candidates: { label: string; lat: number; lng: number }[]
}

interface NewBuilding {
  id: string; name: string | null; address: string | null
  zone: string | null; total_floors: number | null; main_purps_nm: string | null
  is_active: boolean; images: string[]
}

interface Props {
  onCreated: (b: NewBuilding) => void
  onClose: () => void
}

export default function BuildingAddModal({ onCreated, onClose }: Props) {
  const [addrInput,  setAddrInput]  = useState('')
  const [geo,        setGeo]        = useState<GeoResult | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError,   setGeoError]   = useState<string | null>(null)

  const [name,        setName]       = useState('')
  const [zone,        setZone]       = useState('')
  const [totalFloors, setTotalFloors]= useState('')
  const [purp,        setPurp]       = useState('')

  const [submitting, setSubmitting]  = useState(false)
  const [error,      setError]       = useState<string | null>(null)

  const searchGeo = async () => {
    if (!addrInput.trim()) return
    setGeoLoading(true); setGeoError(null); setGeo(null)
    const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(addrInput.trim())}`)
    const json = await res.json()
    setGeoLoading(false)
    if (!res.ok) { setGeoError(json.error ?? '검색 실패'); return }
    setGeo(json)
    // 주소 자동 채움
    if (!addrInput || addrInput === json.jibunAddress) setAddrInput(json.roadAddress)
  }

  const selectCandidate = (c: GeoResult['candidates'][0]) => {
    setGeo((prev) => prev ? { ...prev, lat: c.lat, lng: c.lng, roadAddress: c.label } : null)
    setAddrInput(c.label)
  }

  const handleSubmit = async () => {
    if (!name.trim())  { setError('건물명을 입력해주세요'); return }
    if (!geo)          { setError('주소 검색을 먼저 해주세요'); return }

    setSubmitting(true); setError(null)
    const res = await fetch('/api/admin/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          name.trim(),
        address:       geo.roadAddress,
        lat:           geo.lat,
        lng:           geo.lng,
        zone:          zone || null,
        total_floors:  totalFloors ? parseInt(totalFloors) : null,
        main_purps_nm: purp || null,
      }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(json.error ?? '등록 실패'); return }
    onCreated(json)
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 16, outline: 'none', boxSizing: 'border-box',
  }
  const lbl = (t: string, req = false) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', margin: '0 0 5px' }}>
      {t}{req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </p>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        padding: '20px 20px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>건물 추가</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 주소 검색 */}
          <div>
            {lbl('주소', true)}
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 1 }}
                placeholder="도로명 또는 지번 주소 입력"
                value={addrInput}
                onChange={(e) => setAddrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchGeo()}
              />
              <button onClick={searchGeo} disabled={geoLoading} style={{
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: geoLoading ? '#93c5fd' : '#2563eb',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {geoLoading ? '검색 중…' : '검색'}
              </button>
            </div>

            {geoError && <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0' }}>{geoError}</p>}

            {/* 좌표 확인 */}
            {geo && (
              <div style={{ marginTop: 8, background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', margin: '0 0 2px' }}>좌표 확인 완료</p>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{geo.roadAddress}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>
                  lat {geo.lat.toFixed(6)}, lng {geo.lng.toFixed(6)}
                </p>
              </div>
            )}

            {/* 후보 목록 */}
            {geo && geo.candidates.length > 1 && (
              <div style={{ marginTop: 6 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>다른 결과 선택:</p>
                {geo.candidates.map((c, i) => (
                  <button key={i} onClick={() => selectCandidate(c)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', borderRadius: 8, marginBottom: 3,
                    border: '1px solid #e2e8f0', background: '#fff',
                    fontSize: 11, color: '#475569', cursor: 'pointer',
                  }}>{c.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* 건물명 */}
          <div>
            {lbl('건물명', true)}
            <input style={inp} placeholder="예) 복현빌라" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* 구역 */}
          <div>
            {lbl('구역')}
            <select style={inp} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">선택 안함</option>
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* 층수 + 용도 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {lbl('지상 층수')}
              <input style={inp} type="number" min="1" max="100"
                placeholder="예) 5"
                value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
            </div>
            <div>
              {lbl('주용도')}
              <select style={inp} value={purp} onChange={(e) => setPurp(e.target.value)}>
                <option value="">선택 안함</option>
                {PURPS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
            background: submitting ? '#93c5fd' : '#2563eb',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
          }}>
            {submitting ? '등록 중…' : '건물 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
