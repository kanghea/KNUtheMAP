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
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.15)'}>
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
      <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: 'none' }}>
          {/* 왼쪽: 종합 평점 */}
          <div style={{
            padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
              집 종합평점
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.35)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, lineHeight: 1,
              }}>i</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              {avg !== null ? (
                <>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{avg.toFixed(1)}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>/ 5</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>–</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>/ 5</span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
              {avg !== null ? <Stars rating={avg} /> : [1,2,3,4,5].map((i) => (
                <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>

          {/* 오른쪽: 카테고리 평점 */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {CAT_KEYS.map(({ key, label }) => {
              const val = avgCat(key)
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 56, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    {val !== null && (
                      <div style={{ height: '100%', background: '#f59e0b', borderRadius: 999, width: `${(val / 5) * 100}%` }} />
                    )}
                  </div>
                  <span style={{ fontSize: 11, width: 16, textAlign: 'right', flexShrink: 0, color: val !== null ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
                    {val !== null ? val.toFixed(1) : '–'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 리뷰 헤더 ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#ffffff',
            background: '#059669', borderRadius: 6, padding: '2px 8px',
          }}>건물 리뷰</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{buildingName}</span>
        </div>
        {avg !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* ── 리뷰 목록 ───────────────────────────────────────────── */}
      {reviews.length === 0 && !showForm ? (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '32px 0' }}>
          아직 등록된 리뷰가 없습니다.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
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
          style={{
            width: '100%', background: '#2563eb', color: '#ffffff',
            fontWeight: 600, padding: '14px', borderRadius: 12, fontSize: 14,
            border: 'none', cursor: 'pointer',
          }}
        >
          {loggedIn ? '건물 리뷰 작성하기' : '로그인하고 리뷰 작성하기'}
        </button>
      )}
    </>
  )
}
