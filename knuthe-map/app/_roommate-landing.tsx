// 룸메이트 모드 전용 랜딩(홈) — 서버 컴포넌트.
//
// 방보기 모드의 `_landing.tsx` 와는 완전히 다른 시각 언어를 갖는다:
//  - 보라(#6C63FF) 그라디언트 정체성
//  - 두 룸메이트 SVG 히어로
//  - 호환도 Top 3 추천
//  - 거주 유형(기숙사/자취방) 빠른 진입
//  - 내 프로필 미니 스탯
//  - 모드 전환 카드 (홈에서 바로 viewMode 토글)
//
// SSR에서 Supabase로 직접 fetch — `/api/roommate` 클라이언트 호출 대비 첫
// 페인트가 빠르고, loading.tsx 와 깔끔하게 핸드오프된다.

import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getServerThemeTokens } from '@/lib/theme-server'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { RoommateHeroArt } from '@/components/roommate/RoommateHeroArt'
import { ModeSwitchCard } from '@/components/roommate/ModeSwitchCard'

// 룸메이트 정체성 색
const ROOMMATE_ACCENT = '#6C63FF'
const ROOMMATE_ACCENT_DEEP = '#5B52E0'

interface MatchPreview {
  user_id: string
  compatibility: number
  nickname: string | null
  dept: string | null
  grade: string | null
  living_type: 'dormitory' | 'offcampus'
  dormitory: string | null
  cleanliness: number
  smoking: string
  bedtime_start: string
}

interface Props {
  userId: string
}

export default async function RoommateLanding({ userId }: Props) {
  const { tok } = await getServerThemeTokens()
  const supabase = await createSupabaseServer()

  // 내 사용자 정보(닉네임/대학) + 룸메이트 프로필을 동시 fetch
  const [userRes, profileRes] = await Promise.all([
    supabase
      .from('users')
      .select('nickname, dept, grade, avatar_url')
      .eq('id', userId)
      .single(),
    supabase
      .from('roommate_profiles')
      .select('living_type, dormitory, bedtime_start, bedtime_end, cleanliness, smoking, introduction')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const me        = userRes.data
  const myProfile = profileRes.data

  // 매칭 풀 사이즈 + Top 3 추천 — 두 단계
  // 1) 같은 living_type 의 다른 사람 ID 만 빠르게 카운트 + ID 모음
  // 2) 각 ID 에 대해 RPC 호환도 계산 후 상위 3 만 디테일 fetch
  let topMatches: MatchPreview[] = []
  let totalPoolSize = 0

  if (myProfile) {
    const { count } = await supabase
      .from('roommate_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('living_type', myProfile.living_type)
      .neq('user_id', userId)
    totalPoolSize = count ?? 0

    const { data: candidates } = await supabase
      .from('roommate_profiles')
      .select('user_id, living_type, dormitory, bedtime_start, cleanliness, smoking, users!inner(nickname, dept, grade)')
      .eq('living_type', myProfile.living_type)
      .neq('user_id', userId)
      .limit(20)  // 호환도 계산은 비용이 있으므로 풀을 일부로 제한 (홈 미리보기 용도)

    if (candidates && candidates.length > 0) {
      const scored = await Promise.all(
        candidates.map(async (c) => {
          const { data: score } = await supabase.rpc('calculate_compatibility', {
            viewer_id: userId,
            target_id: c.user_id,
          })
          // supabase 의 nested join 결과 타입은 unknown — 안전하게 캐스팅
          const u = (c as unknown as { users?: { nickname: string | null; dept: string | null; grade: string | null } }).users
          return {
            user_id:       c.user_id,
            compatibility: (score as number | null) ?? 0,
            nickname:      u?.nickname ?? null,
            dept:          u?.dept ?? null,
            grade:         u?.grade ?? null,
            living_type:   c.living_type as 'dormitory' | 'offcampus',
            dormitory:     c.dormitory,
            cleanliness:   c.cleanliness,
            smoking:       c.smoking,
            bedtime_start: c.bedtime_start,
          } satisfies MatchPreview
        })
      )
      topMatches = scored.sort((a, b) => b.compatibility - a.compatibility).slice(0, 3)
    }
  }

  const greeting = me?.nickname ? `${me.nickname}님` : '안녕하세요'
  const heroSub = me?.dept
    ? `${me.dept}${me.grade ? ` · ${me.grade}` : ''}`
    : '오늘도 잘 맞는 룸메이트를 찾아보세요'

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg }}>

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${ROOMMATE_ACCENT}, ${ROOMMATE_ACCENT_DEEP})`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span style={{
            fontSize: 15, fontWeight: 800, color: tok.textPrimary,
            letterSpacing: '-0.02em',
          }}>
            룸메이트
          </span>
        </div>
        <Link
          href="/me"
          aria-label="마이페이지"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: tok.textSecondary,
            textDecoration: 'none', padding: '6px 12px', borderRadius: 999,
            background: tok.inputBg, border: `1px solid ${tok.inputBorder}`,
          }}
        >
          마이
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* ── 히어로 ───────────────────────────────────────────── */}
        <section style={{
          margin: '16px 0 14px',
          background: `linear-gradient(150deg, ${ROOMMATE_ACCENT_DEEP} 0%, ${ROOMMATE_ACCENT} 55%, #8B5CF6 100%)`,
          borderRadius: 22, padding: '22px 22px 18px', color: '#fff',
          boxShadow: `0 2px 4px rgba(0,0,0,0.06), 0 12px 40px rgba(108,99,255,0.32), inset 0 1px 0 rgba(255,255,255,0.22)`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 상단 유리 반사광 */}
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.14) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          {/* 노이즈 텍스처 */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            opacity: 0.04,
            pointerEvents: 'none',
          }} />

          <p style={{
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
            margin: 0, letterSpacing: '0.06em',
          }}>
            룸메이트 매칭
          </p>
          <h1 style={{
            fontSize: 22, fontWeight: 800, margin: '4px 0 2px',
            letterSpacing: '-0.03em', lineHeight: 1.25,
          }}>
            {greeting}, 좋은 룸메 만나요
          </h1>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.7)',
            margin: '0 0 14px',
          }}>
            {heroSub}
          </p>

          {/* SVG 일러스트 */}
          <div style={{ margin: '0 -8px 14px', position: 'relative', zIndex: 1 }}>
            <RoommateHeroArt height={148} />
          </div>

          {/* CTA */}
          <Link
            href="/roommate"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#fff', color: ROOMMATE_ACCENT_DEEP,
              borderRadius: 12, padding: '12px 0',
              fontSize: 14, fontWeight: 800, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            매칭 결과 보기
            {totalPoolSize > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 999,
                background: `${ROOMMATE_ACCENT}1a`, color: ROOMMATE_ACCENT_DEEP,
              }}>
                {totalPoolSize}명
              </span>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </section>

        {/* ── 거주 유형 듀얼 카드 ──────────────────────────────── */}
        <section style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          marginBottom: 14,
        }}>
          <LivingTypeCard
            tok={tok}
            href="/roommate?living_type=dormitory"
            label="기숙사"
            desc="누리관·향토관 등"
            isMine={myProfile?.living_type === 'dormitory'}
            gradient={`linear-gradient(135deg, #4F46E5, #6C63FF)`}
            icon={<DormIcon />}
          />
          <LivingTypeCard
            tok={tok}
            href="/roommate?living_type=offcampus"
            label="자취방"
            desc="원룸·투룸 등"
            isMine={myProfile?.living_type === 'offcampus'}
            gradient={`linear-gradient(135deg, #DB2777, #8B5CF6)`}
            icon={<OffcampusIcon />}
          />
        </section>

        {/* ── 호환도 Top 3 추천 ────────────────────────────────── */}
        {topMatches.length > 0 && (
          <section style={{
            background: tok.cardBg,
            border: `1px solid ${tok.cardBorder}`,
            borderRadius: 20,
            padding: '16px 16px 12px',
            boxShadow: tok.shadow,
            marginBottom: 14,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12, padding: '0 4px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary }}>
                나와 잘 맞는 룸메 Top 3
              </span>
              <Link
                href="/roommate"
                style={{
                  fontSize: 11, color: ROOMMATE_ACCENT,
                  fontWeight: 600, textDecoration: 'none',
                }}
              >
                전체 보기 →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topMatches.map((m) => <TopMatchRow key={m.user_id} match={m} tok={tok} />)}
            </div>
          </section>
        )}

        {/* ── 내 프로필 미니 스탯 ──────────────────────────────── */}
        {myProfile && (
          <section style={{
            background: tok.cardBg,
            border: `1px solid ${tok.cardBorder}`,
            borderRadius: 20,
            padding: '14px 16px 16px',
            boxShadow: tok.shadow,
            marginBottom: 14,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, padding: '0 2px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary }}>
                내 룸메이트 프로필
              </span>
              <Link
                href="/onboarding/roommate"
                style={{
                  fontSize: 11, color: tok.textTertiary,
                  fontWeight: 500, textDecoration: 'none',
                }}
              >
                다시 답하기 →
              </Link>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
            }}>
              <ProfileStat tok={tok} icon="🏠"
                label="거주"
                value={myProfile.living_type === 'dormitory'
                  ? (myProfile.dormitory ?? '기숙사') : '자취방'} />
              <ProfileStat tok={tok} icon="🌙"
                label="취침"
                value={`${myProfile.bedtime_start}${myProfile.bedtime_end !== myProfile.bedtime_start ? `~${myProfile.bedtime_end}` : ''}`} />
              <ProfileStat tok={tok} icon="✨"
                label="청결"
                value={['', '낮음', '보통', '높음', '매우 높음'][myProfile.cleanliness] ?? '-'} />
              <ProfileStat tok={tok} icon={myProfile.smoking === 'smoker' ? '🚬' : '🚭'}
                label="흡연"
                value={myProfile.smoking === 'smoker' ? '흡연' : '비흡연'} />
            </div>
          </section>
        )}

        {/* ── 모드 전환 카드 (현재 룸메이트 모드) ─────────────── */}
        <section style={{ marginBottom: 14 }}>
          <ModeSwitchCard tok={tok} currentMode="roommate" />
        </section>

        {/* ── 호환도 작동 원리 인포 ────────────────────────────── */}
        <section style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: tok.inputBg,
          border: `1px solid ${tok.inputBorder}`,
          borderRadius: 14,
          padding: '11px 14px',
          marginBottom: 14,
        }}>
          <span aria-hidden style={{
            flexShrink: 0,
            width: 28, height: 28, borderRadius: 8,
            background: `${ROOMMATE_ACCENT}1f`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={ROOMMATE_ACCENT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8"  x2="12.01" y2="8" />
            </svg>
          </span>
          <p style={{
            margin: 0, fontSize: 11, color: tok.textSecondary, lineHeight: 1.55,
            flex: 1,
          }}>
            호환도는 <strong style={{ color: tok.textPrimary }}>스와이프 가중치</strong>와{' '}
            <strong style={{ color: tok.textPrimary }}>40여 항목 답변 일치도</strong>로 계산돼요.
          </p>
        </section>

        {/* ── 하단 빠른 링크 ────────────────────────────────────── */}
        <div style={{
          textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16,
          flexWrap: 'wrap',
        }}>
          <Link href="/me" style={{
            fontSize: 11, color: tok.textTertiary,
            textDecoration: 'none', fontWeight: 500,
          }}>
            마이페이지
          </Link>
          <span style={{ color: tok.cardBorder, fontSize: 11 }}>·</span>
          <Link href="/onboarding/roommate" style={{
            fontSize: 11, color: tok.textTertiary,
            textDecoration: 'none', fontWeight: 500,
          }}>
            프로필 다시 답하기
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── 거주 유형 카드 ─────────────────────────────────────────────────────────────

function LivingTypeCard({
  tok, href, label, desc, gradient, icon, isMine,
}: {
  tok: ThemeTokens
  href: string
  label: string
  desc: string
  gradient: string
  icon: React.ReactNode
  isMine: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block', position: 'relative',
        background: gradient,
        borderRadius: 18, padding: '14px 14px 16px',
        textDecoration: 'none',
        boxShadow: '0 6px 18px rgba(108,99,255,0.20), inset 0 1px 0 rgba(255,255,255,0.22)',
        overflow: 'hidden',
      }}
    >
      {/* 우상단 글로우 */}
      <div aria-hidden style={{
        position: 'absolute', top: -16, right: -16, width: 80, height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />
      {isMine && (
        <span aria-label="내 거주 유형" style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 9, fontWeight: 800,
          padding: '2px 7px', borderRadius: 999,
          background: 'rgba(255,255,255,0.95)', color: '#0f172a',
        }}>
          MY
        </span>
      )}
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
        position: 'relative', zIndex: 1,
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 800, color: '#fff',
        letterSpacing: '-0.02em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.7)',
        marginTop: 1,
      }}>
        {desc}
      </div>
      {/* tok 은 다크/라이트 양쪽 background 처리에 사용 가능하도록 prop 으로 받지만,
          현재 카드는 그라디언트 위라 별도 적용 X */}
      <span aria-hidden style={{ display: 'none' }}>{tok.cardBg}</span>
    </Link>
  )
}

function DormIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 6h.01" /><path d="M16 6h.01" />
      <path d="M8 10h.01" /><path d="M16 10h.01" />
    </svg>
  )
}

function OffcampusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 9v11h14V9" />
      <rect x="9" y="13" width="6" height="7" />
    </svg>
  )
}

// ── Top 3 추천 행 ──────────────────────────────────────────────────────────────

function TopMatchRow({ match, tok }: { match: MatchPreview; tok: ThemeTokens }) {
  const cleanLabel = ['', '낮음', '보통', '높음', '매우 높음'][match.cleanliness] ?? ''
  return (
    <Link
      href="/roommate"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 6px', borderRadius: 12,
        textDecoration: 'none',
      }}
    >
      {/* 호환도 배지 */}
      <span style={{
        flexShrink: 0,
        width: 44, height: 44, borderRadius: 14,
        background: `linear-gradient(135deg, ${ROOMMATE_ACCENT}, #8B5CF6)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {match.compatibility}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
          %
        </span>
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: tok.textPrimary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {match.nickname ?? '익명'}
          {match.grade && (
            <span style={{
              fontSize: 10, fontWeight: 600, marginLeft: 6,
              padding: '1px 6px', borderRadius: 999,
              background: `${ROOMMATE_ACCENT}1a`, color: ROOMMATE_ACCENT,
            }}>
              {match.grade}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: tok.textTertiary, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {[
            match.dept,
            match.dormitory,
            cleanLabel ? `청결 ${cleanLabel}` : null,
            match.smoking === 'smoker' ? '흡연' : '비흡연',
          ].filter(Boolean).join(' · ')}
        </div>
      </div>

      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={tok.textTertiary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}

// ── 프로필 미니 스탯 셀 ────────────────────────────────────────────────────────

function ProfileStat({ tok, icon, label, value }: {
  tok: ThemeTokens; icon: string; label: string; value: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 12,
      background: tok.inputBg,
      border: `1px solid ${tok.inputBorder}`,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: tok.textTertiary, fontWeight: 600 }}>
          {label}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: tok.textPrimary,
          marginTop: 1, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}
