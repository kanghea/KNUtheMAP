'use client'

import { useState, useEffect, useRef } from 'react'
import type { Unit } from './BuildingFloorMap'

interface Props {
  unit: Unit | null
  defaultFloor?: number
  buildingId: string
  onClose: () => void
  onSaved: () => void
}

const ROOM_TYPES = ['원룸', '투룸', '복층형원룸', '오피스텔', '아파트', '빌라', '단독주택']

// 로컬 파일 미리보기와 기존 URL을 함께 관리
type ImageItem =
  | { type: 'url';  url: string }
  | { type: 'file'; file: File; preview: string }

export default function UnitModal({ unit, defaultFloor, buildingId, onClose, onSaved }: Props) {
  const isNew = !unit

  const [floor,       setFloor]       = useState(String(unit?.floor ?? defaultFloor ?? 1))
  const [unitNumber,  setUnitNumber]  = useState(unit?.unit_number ?? '')
  const [areaM2,      setAreaM2]      = useState(String(unit?.area_m2 ?? ''))
  const [roomType,    setRoomType]    = useState(unit?.room_type ?? '')
  const [baseDeposit, setBaseDeposit] = useState(String(unit?.base_deposit ?? ''))
  const [baseRent,    setBaseRent]    = useState(String(unit?.base_rent ?? ''))
  const [saving,      setSaving]      = useState(false)
  const [progress,    setProgress]    = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  // 이미지 목록: 기존 URL + 새 파일
  const [images,      setImages]      = useState<ImageItem[]>(() =>
    (unit?.images ?? []).map((url) => ({ type: 'url' as const, url }))
  )
  // 대표 이미지 인덱스 (images 배열 기준)
  const [mainIdx,     setMainIdx]     = useState(unit?.main_image_idx ?? 0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 미리보기 URL 정리
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.type === 'file') URL.revokeObjectURL(img.preview)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = (files: FileList) => {
    const newItems: ImageItem[] = Array.from(files)
      .filter((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
      .map((file) => ({ type: 'file' as const, file, preview: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...newItems])
  }

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const item = prev[idx]
      if (item.type === 'file') URL.revokeObjectURL(item.preview)
      const next = prev.filter((_, i) => i !== idx)
      // mainIdx 조정
      if (mainIdx === idx) setMainIdx(0)
      else if (mainIdx > idx) setMainIdx((m) => m - 1)
      return next
    })
  }

  const getPreviewSrc = (img: ImageItem) =>
    img.type === 'url' ? img.url : img.preview

  const handleSave = async () => {
    if (!unitNumber.trim()) { setError('호수를 입력해주세요'); return }
    if (!floor) { setError('층수를 입력해주세요'); return }

    setSaving(true); setError(null)

    // 1. 호실 생성 또는 기본 정보 저장
    setProgress(isNew ? '호실 등록 중…' : '저장 중…')
    const body = {
      building_id:  buildingId,
      floor:        parseInt(floor),
      unit_number:  unitNumber.trim(),
      area_m2:      areaM2      ? parseFloat(areaM2)    : null,
      room_type:    roomType    || null,
      base_deposit: baseDeposit ? parseInt(baseDeposit) : null,
      base_rent:    baseRent    ? parseInt(baseRent)    : null,
    }

    const res = await fetch(
      isNew ? '/api/owner/units' : `/api/owner/units/${unit!.id}`,
      {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      const j = await res.json()
      setError(j.error ?? '저장에 실패했어요')
      setSaving(false); setProgress(null)
      return
    }
    const saved = await res.json()
    const unitId: string = saved.id ?? unit!.id

    // 2. 새 파일 업로드
    const newFiles = images.filter((img): img is Extract<ImageItem, { type: 'file' }> => img.type === 'file')
    const uploadedUrls: string[] = []

    for (let i = 0; i < newFiles.length; i++) {
      setProgress(`이미지 업로드 중… (${i + 1}/${newFiles.length})`)
      const form = new FormData()
      form.append('file', newFiles[i].file)
      form.append('id', unitId)
      const upRes = await fetch('/api/owner/upload', { method: 'POST', body: form })
      if (upRes.ok) {
        const { url } = await upRes.json()
        uploadedUrls.push(url)
      }
    }

    // 3. 최종 이미지 배열 구성 (기존 URL + 새 URL)
    let uploadIdx = 0
    const finalImages = images.map((img) => {
      if (img.type === 'url') return img.url
      return uploadedUrls[uploadIdx++] ?? null
    }).filter(Boolean) as string[]

    // mainIdx는 이미 images 배열 기준이므로 그대로 사용
    const finalMainIdx = Math.min(mainIdx, finalImages.length - 1)

    // 4. 이미지 배열 + 대표 인덱스 PATCH
    if (finalImages.length > 0 || !isNew) {
      setProgress('이미지 저장 중…')
      await fetch(`/api/owner/units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: finalImages, main_image_idx: finalMainIdx }),
      })
    }

    setSaving(false); setProgress(null)
    onSaved()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 16, color: '#0f172a',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  }
  const label = (txt: string, req = false) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', margin: '0 0 5px' }}>
      {txt}{req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </p>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 520,
        padding: '20px 20px 36px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isNew ? '호실 추가' : `${unit!.unit_number} 수정`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#94a3b8' }}>닫기</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 층수 / 호수 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('층수', true)}
              <input style={inputStyle} type="number" placeholder="예) 3"
                value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>
            <div>
              {label('호수', true)}
              <input style={inputStyle} placeholder="예) 301"
                value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
            </div>
          </div>

          {/* 방 유형 / 면적 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('방 유형')}
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                <option value="">선택</option>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              {label('면적 (㎡)')}
              <input style={inputStyle} type="number" step="0.1" placeholder="예) 23.5"
                value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
            </div>
          </div>

          {/* 보증금 / 월세 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('기본 보증금 (만원)')}
              <input style={inputStyle} type="number" placeholder="예) 500"
                value={baseDeposit} onChange={(e) => setBaseDeposit(e.target.value)} />
            </div>
            <div>
              {label('기본 월세 (만원)')}
              <input style={inputStyle} type="number" placeholder="예) 40"
                value={baseRent} onChange={(e) => setBaseRent(e.target.value)} />
            </div>
          </div>

          {/* 이미지 */}
          <div>
            {label('사진')}
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '-2px 0 8px' }}>
              클릭하면 대표 사진으로 설정됩니다
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {images.map((img, idx) => {
                const isMain = idx === mainIdx
                const src = getPreviewSrc(img)
                return (
                  <div
                    key={idx}
                    onClick={() => setMainIdx(idx)}
                    style={{
                      position: 'relative', aspectRatio: '1', borderRadius: 12,
                      overflow: 'hidden', cursor: 'pointer',
                      outline: isMain ? '3px solid #2563eb' : '2px solid transparent',
                      outlineOffset: isMain ? '2px' : '0',
                      transition: 'outline .15s',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {/* 대표 이미지 배지 */}
                    {isMain && (
                      <div style={{
                        position: 'absolute', top: 5, left: 5,
                        background: '#2563eb', borderRadius: 6,
                        padding: '2px 6px', fontSize: 9, fontWeight: 700, color: '#fff',
                      }}>
                        대표
                      </div>
                    )}

                    {/* 새 파일 표시 */}
                    {img.type === 'file' && (
                      <div style={{
                        position: 'absolute', bottom: 4, left: 4,
                        background: 'rgba(0,0,0,0.5)', borderRadius: 4,
                        padding: '1px 5px', fontSize: 9, color: '#fff',
                      }}>
                        NEW
                      </div>
                    )}

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        color: '#fff', fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  </div>
                )
              })}

              {/* 추가 버튼 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  aspectRatio: '1', borderRadius: 12,
                  border: '2px dashed #e2e8f0', background: '#f8fafc',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 22, color: '#94a3b8' }}>+</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>사진 추가</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files) }}
            />

            {images.filter((i) => i.type === 'file').length > 0 && (
              <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>
                새 사진 {images.filter((i) => i.type === 'file').length}장 — 저장 시 자동 업로드
              </p>
            )}
          </div>

          {error    && <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}
          {progress && <p style={{ margin: 0, fontSize: 12, color: '#2563eb' }}>{progress}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '13px', borderRadius: 12, border: 'none',
              background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              marginTop: 4,
            }}
          >
            {saving ? (progress ?? '저장 중…') : isNew ? '호실 추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
