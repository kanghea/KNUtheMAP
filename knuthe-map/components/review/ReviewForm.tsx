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

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={i <= (hover || value) ? '#f59e0b' : '#e5e7eb'}>
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

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-5">
      <h3 className="text-sm font-bold text-gray-900">리뷰 작성</h3>

      {/* 종합 별점 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">종합 평점 <span className="text-red-400">*</span></p>
        <StarInput value={form.rating_overall} onChange={(v) => set('rating_overall', v)} />
      </div>

      {/* 세부 평점 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CAT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <StarInput value={form[key as keyof typeof form] as number} onChange={(v) => set(key, v)} />
          </div>
        ))}
      </div>

      {/* 내용 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">
          내용 <span className="text-red-400">*</span>
          <span className="text-gray-300 font-normal ml-1">최소 20자</span>
        </p>
        <textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="실제 거주 경험을 솔직하게 적어주세요..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-blue-400"
        />
        <p className="text-xs text-gray-300 mt-1 text-right">{form.content.length}자</p>
      </div>

      {/* 장단점 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-400 mb-1.5">장점</p>
          <input
            value={form.pros}
            onChange={(e) => set('pros', e.target.value)}
            placeholder="예: 조용하고 채광 좋음"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">단점</p>
          <input
            value={form.cons}
            onChange={(e) => set('cons', e.target.value)}
            placeholder="예: 주차 불편"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* 거주 정보 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-400 mb-1.5">방 종류</p>
          <select
            value={form.room_type}
            onChange={(e) => set('room_type', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">선택</option>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">층수</p>
          <input
            type="number" min={1} max={50}
            value={form.floor}
            onChange={(e) => set('floor', e.target.value)}
            placeholder="예: 3"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">거주 시작</p>
          <input
            type="month"
            value={form.lived_from}
            onChange={(e) => set('lived_from', e.target.value ? `${e.target.value}-01` : '')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">거주 종료</p>
          <input
            type="month"
            value={form.lived_to}
            onChange={(e) => set('lived_to', e.target.value ? `${e.target.value}-01` : '')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* 월세 정보 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">월세 정보 <span className="text-gray-300 font-normal">(선택 — 입력 시 거래 기록에 자동 등록됩니다)</span></p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'deposit', label: '보증금 (만원)' },
            { key: 'rent',    label: '월세 (만원)' },
            { key: 'maintenance', label: '관리비 (만원)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs text-gray-400 mb-1.5">{label}</p>
              <input
                type="number" min={0}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 익명 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_anonymous}
          onChange={(e) => set('is_anonymous', e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-600">익명으로 작성</span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {submitting ? '등록 중...' : '리뷰 등록'}
        </button>
      </div>
    </form>
  )
}
