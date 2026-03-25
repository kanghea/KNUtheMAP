'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'

interface Review {
  id: string
  rating_overall: number
  rating_clean: number | null
  rating_noise: number | null
  rating_security: number | null
  rating_transport: number | null
  rating_cost: number | null
  content: string
  pros: string | null
  cons: string | null
  floor: number | null
  room_type: string | null
  lived_from: string | null
  lived_to: string | null
  is_anonymous: boolean
  created_at: string
  user: { nickname: string | null; avatar_url: string | null } | null
}

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

const CAT_KEYS = [
  { key: 'rating_clean',     label: '청결도' },
  { key: 'rating_noise',     label: '방음' },
  { key: 'rating_security',  label: '치안' },
  { key: 'rating_transport', label: '교통' },
  { key: 'rating_cost',      label: '가성비' },
]

interface Props {
  buildingId: string
  buildingName: string
  initialReviews: Review[]
  initialAvg: number | null
}

export default function ReviewSection({ buildingId, buildingName, initialReviews, initialAvg }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [avg, setAvg] = useState<number | null>(initialAvg)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session)
    })
  }, [])

  const refresh = async () => {
    const res  = await fetch(`/api/buildings/${buildingId}/reviews`)
    const json = await res.json()
    setReviews(json.reviews ?? [])
    setAvg(json.avg_rating ?? null)
    setShowForm(false)
  }

  const avgCat = (key: string) => {
    const vals = reviews.map((r) => r[key as keyof Review] as number | null).filter((v): v is number => v !== null)
    return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
  }

  const handleWriteClick = () => {
    if (loggedIn) setShowForm(true)
    else router.push('/login')
  }

  return (
    <>
      {/* ── 종합 평점 카드 ──────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div className="px-5 py-5 flex flex-col items-center justify-center gap-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              집 종합평점
              <span className="w-3.5 h-3.5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[9px] font-bold leading-none">i</span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              {avg !== null ? (
                <>
                  <span className="text-[1.75rem] font-bold text-gray-900 leading-none">{avg.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">/ 5</span>
                </>
              ) : (
                <>
                  <span className="text-[1.75rem] font-bold text-gray-300 leading-none">–</span>
                  <span className="text-sm text-gray-300">/ 5</span>
                </>
              )}
            </div>
            <div className="flex gap-0.5 mt-1">
              {avg !== null ? <Stars rating={avg} /> : [1,2,3,4,5].map((i) => (
                <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#e5e7eb">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="px-5 py-5 flex flex-col justify-center gap-2.5">
            {CAT_KEYS.map(({ key, label }) => {
              const val = avgCat(key)
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-[3.5rem] shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    {val !== null && (
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(val / 5) * 100}%` }} />
                    )}
                  </div>
                  <span className="text-xs w-4 text-right shrink-0" style={{ color: val !== null ? '#f59e0b' : '#d1d5db' }}>
                    {val !== null ? val.toFixed(1) : '–'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 리뷰 헤더 ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white bg-emerald-500 rounded-md px-2 py-0.5">건물 리뷰</span>
          <span className="text-sm font-semibold text-gray-800">{buildingName}</span>
        </div>
        {avg !== null && (
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* ── 리뷰 목록 ───────────────────────────────────────────── */}
      {reviews.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 text-center py-8">아직 등록된 리뷰가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {/* ── 리뷰 작성 폼 ────────────────────────────────────────── */}
      {showForm ? (
        <ReviewForm
          buildingId={buildingId}
          onSuccess={refresh}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={handleWriteClick}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-blue-700 transition-colors"
        >
          {loggedIn ? '건물 리뷰 작성하기' : '로그인하고 리뷰 작성하기'}
        </button>
      )}
    </>
  )
}
