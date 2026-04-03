import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating_overall, rating_clean, rating_noise,
      rating_security, rating_transport, rating_cost,
      content, pros, cons, floor, room_type,
      lived_from, lived_to, is_anonymous, created_at,
      user:users(nickname, avatar_url)
    `)
    .eq('building_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 익명 리뷰의 사용자 정보 제거 (is_anonymous=true인 경우 user null 처리)
  const reviews = (data ?? []).map((r) => ({
    ...r,
    user: r.is_anonymous ? null : r.user,
  }))
  const avgOverall = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length) * 10) / 10
    : null

  return NextResponse.json({ reviews, total: reviews.length, avg_rating: avgOverall })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: building_id } = await params

  // 인증 확인
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await req.json()

  const {
    rating_overall, rating_clean, rating_noise, rating_security,
    rating_transport, rating_cost, content, pros, cons,
    floor, room_type, lived_from, lived_to,
    rent, deposit, maintenance, is_anonymous,
  } = body

  if (!rating_overall || !content || content.length < 20) {
    return NextResponse.json({ error: '필수 항목을 확인해 주세요.' }, { status: 400 })
  }

  // 입력 검증: rating 범위, content 길이
  const isValidRating = (v: unknown): boolean =>
    v == null || (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5)
  if (!Number.isInteger(rating_overall) || rating_overall < 1 || rating_overall > 5)
    return NextResponse.json({ error: '평점은 1~5 사이 정수여야 합니다' }, { status: 400 })
  if (![rating_clean, rating_noise, rating_security, rating_transport, rating_cost].every(isValidRating))
    return NextResponse.json({ error: '세부 평점은 1~5 사이 정수여야 합니다' }, { status: 400 })
  if (content.length > 5000)
    return NextResponse.json({ error: '리뷰 내용은 5000자 이하여야 합니다' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('reviews')
    .insert({
      building_id,
      user_id: user.id,
      rating_overall, rating_clean, rating_noise, rating_security,
      rating_transport, rating_cost,
      content, pros: pros || null, cons: cons || null,
      floor: floor || null, room_type: room_type || null,
      lived_from: lived_from || null, lived_to: lived_to || null,
      rent: rent || null, deposit: deposit || null, maintenance: maintenance || null,
      is_anonymous: is_anonymous ?? false,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 이 건물에 리뷰를 작성하셨습니다.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data }, { status: 201 })
}
