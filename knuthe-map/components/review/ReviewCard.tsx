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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#f59e0b' : '#e5e7eb'}>
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
    <div className="border border-gray-100 rounded-xl p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 mb-3">
        {avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
            {displayName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{displayName}</span>
            {review.room_type && (
              <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 leading-none">
                {review.room_type}
              </span>
            )}
            {review.floor && (
              <span className="text-xs text-gray-400">{review.floor}층</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating_overall} />
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.content}</p>

      {/* 장단점 */}
      {(review.pros || review.cons) && (
        <div className="flex flex-col gap-1.5 mb-3">
          {review.pros && (
            <div className="flex items-start gap-1.5">
              <span className="text-xs font-bold text-emerald-500 shrink-0 mt-0.5">장점</span>
              <span className="text-xs text-gray-600">{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div className="flex items-start gap-1.5">
              <span className="text-xs font-bold text-red-400 shrink-0 mt-0.5">단점</span>
              <span className="text-xs text-gray-600">{review.cons}</span>
            </div>
          )}
        </div>
      )}

      {/* 세부 평점 */}
      {catRatings.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2.5 border-t border-gray-100">
          {catRatings.map(({ label, val }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{label}</span>
              <Stars rating={val!} size={10} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
