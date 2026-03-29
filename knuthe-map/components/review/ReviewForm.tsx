'use client'

import { useState } from 'react'

const ROOM_TYPES = ['원룸', '투룸', '오피스텔', '고시원']

const CAT_FIELDS = [
  { key: 'rating_clean', label: '청결도' },
  { key: 'rating_noise', label: '방음' },
  { key: 'rating_security', label: '치안' },
  { key: 'rating_transport', label: '교통' },
  { key: 'rating_cost', label: '가성비' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid rgba(255,255,255,0.12)', fontSize: 16, color: '#ffffff',
  background: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={i <= (hover || value) ? '#f59e0b' : 'rgba(255,255,255,0.15)'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

interface Props {
  buildingId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ReviewForm({ buildingId, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    rating_overall: 0,
    rating_clean: 0, rating_noise: 0, rating_security: 0, rating_transport: 0, rating_cost: 0,
    content: '',
    pros: '', cons: '',
    floor: '',
    room_type: '',
    lived_from: '', lived_to: '',
    rent: '', deposit: '', maintenance: '',
    is_anonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rating_overall) return setError('종합 별점을 선택해 주세요.')
    if (form.content.length < 20) return setError('내용을 20자 이상 작성해 주세요.')

    setSubmitting(true)
    setError(null)

    const res = await fetch(`/api/buildings/${buildingId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        floor:       form.floor ? parseInt(form.floor) : null,
        rent:        form.rent ? parseInt(form.rent) : null,
        deposit:     form.deposit ? parseInt(form.deposit) : null,
        maintenance: form.maintenance ? parseInt(form.maintenance) : null,
        lived_from:  form.lived_from || null,
        lived_to:    form.lived_to || null,
        rating_clean:     form.rating_clean || null,
        rating_noise:     form.rating_noise || null,
        rating_security:  form.rating_security || null,
        rating_transport: form.rating_transport || null,
        rating_cost:      form.rating_cost || null,
      }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) return setError(json.error ?? '오류가 발생했습니다.')
    onSuccess()
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12,
        padding: 20, display: 'flex', flexDirection: 'column', gap: 20,
        background: '#111111',
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>리뷰 작성</h3>

      {/* 종합 별점 */}
      <div>
        <p style={labelStyle}>종합 평점 <span style={{ color: '#f87171' }}>*</span></p>
        <StarInput value={form.rating_overall} onChange={(v) => set('rating_overall', v)} />
      </div>

      {/* 세부 평점 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {CAT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>{label}</p>
            <StarInput value={form[key as keyof typeof form] as number} onChange={(v) => set(key, v)} />
          </div>
        ))}
      </div>

      {/* 내용 */}
      <div>
        <p style={labelStyle}>
          내용 <span style={{ color: '#f87171' }}>*</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginLeft: 4 }}>최소 20자</span>
        </p>
        <textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="실제 거주 경험을 솔직하게 적어주세요..."
          rows={4}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5, height: 'auto' }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>{form.content.length}자</p>
      </div>

      {/* 장단점 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>장점</p>
          <input
            value={form.pros}
            onChange={(e) => set('pros', e.target.value)}
            placeholder="예: 조용하고 채광 좋음"
            style={inputStyle}
          />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>단점</p>
          <input
            value={form.cons}
            onChange={(e) => set('cons', e.target.value)}
            placeholder="예: 주차 불편"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 거주 정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>방 종류</p>
          <select
            value={form.room_type}
            onChange={(e) => set('room_type', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">선택</option>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>층수</p>
          <input
            type="number" min={1} max={50}
            value={form.floor}
            onChange={(e) => set('floor', e.target.value)}
            placeholder="예: 3"
            style={inputStyle}
          />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>거주 시작</p>
          <input
            type="month"
            value={form.lived_from}
            onChange={(e) => set('lived_from', e.target.value ? `${e.target.value}-01` : '')}
            style={inputStyle}
          />
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>거주 종료</p>
          <input
            type="month"
            value={form.lived_to}
            onChange={(e) => set('lived_to', e.target.value ? `${e.target.value}-01` : '')}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 월세 정보 */}
      <div>
        <p style={labelStyle}>
          월세 정보
          <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginLeft: 4 }}>(선택 — 입력 시 거래 기록에 자동 등록됩니다)</span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { key: 'deposit', label: '보증금 (만원)' },
            { key: 'rent',    label: '월세 (만원)' },
            { key: 'maintenance', label: '관리비 (만원)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>{label}</p>
              <input
                type="number" min={0}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 익명 */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={form.is_anonymous}
          onChange={(e) => set('is_anonymous', e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>익명으로 작성</span>
      </label>

      {error && <p style={{ margin: 0, fontSize: 14, color: '#f87171' }}>{error}</p>}

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', fontWeight: 600, padding: '12px',
            borderRadius: 12, fontSize: 14, cursor: 'pointer', background: 'transparent',
          }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            flex: 1, background: '#2563eb', color: '#ffffff',
            fontWeight: 600, padding: '12px', borderRadius: 12,
            fontSize: 14, cursor: submitting ? 'default' : 'pointer',
            border: 'none', opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '등록 중...' : '리뷰 등록'}
        </button>
      </div>
    </form>
  )
}
