import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

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

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#f59e0b' : 'rgba(255,255,255,0.15)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

const CAT_LABELS: Record<string, string> = {
  rating_clean: '청결도',
  rating_noise: '방음',
  rating_security: '치안',
  rating_transport: '교통',
  rating_cost: '가성비',
}

export default function ReviewCard({ review }: { review: Review }) {
  const displayName = review.is_anonymous ? '익명' : (review.user?.nickname ?? '사용자')
  const avatar = !review.is_anonymous ? review.user?.avatar_url : null
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ko })

  const catRatings = Object.entries(CAT_LABELS)
    .map(([key, label]) => ({ label, val: review[key as keyof Review] as number | null }))
    .filter((c) => c.val !== null)

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={displayName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
          }}>
            {displayName[0]}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{displayName}</span>
            {review.room_type && (
              <span style={{
                fontSize: 11, color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 4, padding: '1px 6px', lineHeight: 1,
              }}>
                {review.room_type}
              </span>
            )}
            {review.floor && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{review.floor}층</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Stars rating={review.rating_overall} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 12 }}>{review.content}</p>

      {/* 장단점 */}
      {(review.pros || review.cons) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {review.pros && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', flexShrink: 0, marginTop: 1 }}>장점</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', flexShrink: 0, marginTop: 1 }}>단점</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{review.cons}</span>
            </div>
          )}
        </div>
      )}

      {/* 세부 평점 */}
      {catRatings.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px 16px',
          paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          {catRatings.map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              <Stars rating={val!} size={10} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
