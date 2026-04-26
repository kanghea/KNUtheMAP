'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  bucket: 'building-images' | 'room-images'
  entityId: string
  /** 현재 이미지 URL 목록 */
  images: string[]
  /** 이미지 목록이 변경됐을 때 호출 — 서버에 저장하는 책임은 부모 */
  onSave: (newImages: string[]) => Promise<void>
  onClose: () => void
}

export default function ImageManager({ bucket, entityId, images, onSave, onClose }: Props) {
  const [list,      setList]     = useState<string[]>(images)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]   = useState(false)
  const [error,     setError]    = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList) => {
    setUploading(true); setError(null)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file',   file)
      form.append('bucket', bucket)
      form.append('id',     entityId)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) { setError('업로드 실패'); setUploading(false); return }
      const { url } = await res.json()
      urls.push(url)
    }
    setList((prev) => [...prev, ...urls])
    setUploading(false)
  }

  const remove = (url: string) => setList((prev) => prev.filter((u) => u !== url))

  const handleSave = async () => {
    setSaving(true)
    await onSave(list)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 560, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        padding: '20px 20px 0',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>이미지 관리</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
        </div>

        {/* 이미지 그리드 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {list.map((url) => (
              <div key={url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                <Image
                  src={url}
                  alt="등록된 이미지"
                  fill
                  sizes="(max-width: 600px) 30vw, 180px"
                  style={{ objectFit: 'cover' }}
                />
                <button
                  onClick={() => remove(url)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', border: 'none',
                    color: '#fff', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
              </div>
            ))}

            {/* 추가 버튼 */}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                aspectRatio: '1', borderRadius: 10,
                border: '2px dashed #e2e8f0', background: '#f8fafc',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                opacity: uploading ? 0.5 : 1,
              }}>
              <span style={{ fontSize: 22, color: '#94a3b8' }}>+</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{uploading ? '업로드 중…' : '추가'}</span>
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.length) upload(e.target.files) }}
          />

          {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{error}</p>}
          {list.length === 0 && !uploading && (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>
              아직 이미지가 없어요. + 버튼으로 추가하세요.
            </p>
          )}
        </div>

        {/* 저장 버튼 */}
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 0 20px' }}>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: (saving || uploading) ? '#93c5fd' : '#2563eb',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
