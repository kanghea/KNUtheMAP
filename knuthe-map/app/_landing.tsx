// 랜딩 페이지 — 재방문 사용자용 (서버 컴포넌트)

import Link from 'next/link'
import Image from 'next/image'
import { UserPrefs, FACTOR_META } from '@/lib/prefs'
import { FACTOR_ICONS, GateIcon } from '@/lib/factor-icons'
import { DEPARTMENTS } from '@/lib/department-zones'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import RoomFilterCard from './_room-filter'
import MyContractsCard from '@/components/contracts/MyContractsCard'

// ── 단과대별 히어로 색상 ──────────────────────────────────────────

const COLLEGE_COLORS: Record<string, { from: string; to: string; mid: string; accent: string; shadow: string }> = {
  '인문대학':         { from: '#3b0764', mid: '#6d28d9', to: '#7c3aed', accent: '#a78bfa', shadow: 'rgba(109,40,217,0.32)' },
  '사회과학대학':     { from: '#134e4a', mid: '#0f766e', to: '#0d9488', accent: '#2dd4bf', shadow: 'rgba(13,148,136,0.32)' },
  '자연과학대학':     { from: '#0c4a6e', mid: '#0369a1', to: '#0284c7', accent: '#38bdf8', shadow: 'rgba(2,132,199,0.32)' },
  '경상대학':         { from: '#14532d', mid: '#15803d', to: '#059669', accent: '#34d399', shadow: 'rgba(5,150,105,0.32)' },
  '공과대학':         { from: '#431407', mid: '#c2410c', to: '#ea580c', accent: '#fb923c', shadow: 'rgba(234,88,12,0.32)' },
  'IT대학':           { from: '#1e1b4b', mid: '#3730a3', to: '#4338ca', accent: '#818cf8', shadow: 'rgba(67,56,202,0.32)' },
  '농업생명과학대학': { from: '#052e16', mid: '#15803d', to: '#16a34a', accent: '#4ade80', shadow: 'rgba(22,163,74,0.32)' },
  '예술대학':         { from: '#500724', mid: '#be123c', to: '#e11d48', accent: '#fb7185', shadow: 'rgba(225,29,72,0.32)' },
  '사범대학':         { from: '#172554', mid: '#1e40af', to: '#1d4ed8', accent: '#60a5fa', shadow: 'rgba(29,78,216,0.32)' },
  '수의과대학':       { from: '#0d3331', mid: '#0f766e', to: '#0d9488', accent: '#2dd4bf', shadow: 'rgba(13,148,136,0.32)' },
  '생활과학대학':     { from: '#2e1065', mid: '#7e22ce', to: '#a855f7', accent: '#c084fc', shadow: 'rgba(168,85,247,0.32)' },
  '간호대학':         { from: '#083344', mid: '#0e7490', to: '#0891b2', accent: '#22d3ee', shadow: 'rgba(8,145,178,0.32)' },
  '약학대학':         { from: '#064e3b', mid: '#047857', to: '#10b981', accent: '#6ee7b7', shadow: 'rgba(16,185,129,0.32)' },
  '첨단기술융합대학': { from: '#1a0533', mid: '#7e22ce', to: '#9333ea', accent: '#c084fc', shadow: 'rgba(147,51,234,0.32)' },
  '독립학부':         { from: '#0f172a', mid: '#1e293b', to: '#334155', accent: '#94a3b8', shadow: 'rgba(51,65,85,0.32)' },
  '의과대학':         { from: '#450a0a', mid: '#b91c1c', to: '#dc2626', accent: '#f87171', shadow: 'rgba(220,38,38,0.32)' },
}
const DEFAULT_COLLEGE_COLOR = { from: '#1e3a8a', mid: '#1d4ed8', to: '#2563eb', accent: '#60a5fa', shadow: 'rgba(37,99,235,0.28)' }

// ── 페이지 전용 데코레이션 토큰 ──────────────────────────────────
// 일반 시각 토큰(pageBg/cardBg/border/text/headerBg/inputBg/logoFilter 등)은
// `THEME_TOKENS` 에서 가져온다. 여기에는 랜딩에서만 쓰는 우선순위 배지·강한
// 카드 섀도 등 "이 페이지 고유" 값만 남긴다 — 공유 인터페이스를 부풀리지 않는다.
const LANDING_DECO: Record<ThemeMode, {
  priorityBg:     readonly [string, string, string]
  priorityColors: readonly [string, string, string]
  cardShadow:     string
}> = {
  dark: {
    priorityBg:     ['rgba(37,99,235,0.12)', 'rgba(124,58,237,0.12)', 'rgba(8,145,178,0.12)'],
    priorityColors: ['#2563eb', '#7c3aed', '#0891b2'],
    cardShadow:     '0 8px 32px rgba(0,0,0,0.5)',
  },
  light: {
    priorityBg:     ['rgba(37,99,235,0.08)', 'rgba(124,58,237,0.08)', 'rgba(8,145,178,0.08)'],
    priorityColors: ['#2563eb', '#7c3aed', '#0891b2'],
    cardShadow:     '0 8px 32px rgba(0,0,0,0.10)',
  },
}

// ── 구역 정보 ─────────────────────────────────────────────────────

const ZONES = [
  { name: '북문',   zone: '북문', desc: '상권·교통 최고' },
  { name: '정문',   zone: '정문', desc: '수의대 인접' },
  { name: '서문',   zone: '서문', desc: '자연대 인접' },
  { name: '쪽문',   zone: '쪽문', desc: '공대·IT대 인접' },
  { name: '동문',   zone: '동문', desc: '경상·사회과학대 인접' },
  { name: '택문',   zone: '텍문', desc: '사범대·약대 인접' },
  { name: '나리문', zone: '동문', desc: '경상대 인접' },
  { name: '누리문', zone: '텍문', desc: '약대·간호대 인접' },
]

// ── 유틸 ─────────────────────────────────────────────────────────

function buildMapUrl(prefs: UserPrefs): string {
  const p = new URLSearchParams()
  if (prefs.zone)              p.set('zone', prefs.zone)
  if (prefs.priorities.length) p.set('p',    prefs.priorities.join(','))
  if (prefs.gate)              p.set('gate', prefs.gate)
  return `/map?${p.toString()}`
}

// ── 컴포넌트 ──────────────────────────────────────────────────────

export default function LandingPage({ prefs }: { prefs: UserPrefs }) {
  const mapUrl      = buildMapUrl(prefs)
  const topPriority = prefs.priorities.slice(0, 3)
  const gradeLabel  = prefs.grade ? `${prefs.grade}` : null
  const heroLabel   = [gradeLabel, prefs.dept].filter(Boolean).join(' · ') || null

  const theme = prefs.theme ?? 'light'
  const tok   = THEME_TOKENS[theme]
  const deco  = LANDING_DECO[theme]

  // 단과대 → 히어로 색상
  const college = prefs.dept
    ? (DEPARTMENTS.find((d) => d.name === prefs.dept)?.college ?? null)
    : null
  const col = (college ? COLLEGE_COLORS[college] : null) ?? DEFAULT_COLLEGE_COLOR

  const heroGradient = `linear-gradient(150deg, ${col.from} 0%, ${col.mid} 55%, ${col.to} 100%)`

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, fontFamily: 'inherit' }}>

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={32}
            height={32}
            style={{ objectFit: 'contain', filter: tok.logoFilter }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: tok.textPrimary, letterSpacing: '-0.02em' }}>
            KNUtheMAP
          </span>
        </div>
        <Link
          href="/settings/theme"
          aria-label="테마 설정"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: tok.textSecondary, textDecoration: 'none',
            padding: '6px 12px', borderRadius: 999,
            background: tok.inputBg, border: `1px solid ${tok.inputBorder}`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          설정
        </Link>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* ── 히어로 ───────────────────────────────────────────── */}
        <div style={{
          margin: '16px 0 14px',
          background: heroGradient,
          borderRadius: 22, padding: '24px 22px 20px', color: '#fff',
          boxShadow: `0 2px 4px rgba(0,0,0,0.06), 0 12px 40px ${col.shadow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 상단 유리 반사광 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.14) 0%, transparent 100%)',
            borderRadius: '22px 22px 0 0',
            pointerEvents: 'none',
          }} />
          {/* 노이즈 텍스처 */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            opacity: 0.035,
            pointerEvents: 'none',
            borderRadius: 22,
          }} />
          {/* 배경 로고 */}
          <Image
            src="/images/경북대 로고(현).png"
            alt=""
            aria-hidden
            width={160}
            height={160}
            style={{
              position: 'absolute', right: -18, bottom: -18,
              opacity: 0.08, objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              pointerEvents: 'none', userSelect: 'none',
            }}
          />
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 4, letterSpacing: '0.06em' }}>
            다시 오셨군요 👋
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.03em', lineHeight: 1.3 }}>
            {heroLabel ?? '경북대 주변 방 찾기'}
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 18px' }}>
            {prefs.gate ? `${prefs.gate} 기준 · 맞춤 건물을 추천해드려요` : '경북대 주변 방을 찾아드릴게요'}
          </p>

          {/* CTA 버튼 3개 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/rooms" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#fff', color: col.mid,
              borderRadius: 12, padding: '11px 0',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/><path d="M9 21V9"/>
              </svg>
              방 보기
            </Link>
            <Link href={mapUrl} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              borderRadius: 12, padding: '11px 0',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              건물 지도
            </Link>
          </div>
        </div>

        {/* ── 구역 바로가기 (가로 스크롤) ───────────────────────
            UX 개선:
            - 컨테이너 outer 에 좌우 mask-image fade → 스크롤 시 잘림이 어색하지 않고
              "더 있다" 는 어포던스가 됨
            - inner scroller 에 좌/우 16px 패딩 → 첫·마지막 카드가 가장자리에 칼날
              잘리는 느낌 제거
            - scroll-snap-type: x mandatory + 카드 scroll-snap-align: start
            - 설명은 nowrap 해제, 카드 폭 일관성 유지 위해 minWidth 조정
            - 페이지 컨테이너의 좌우 16px 패딩을 음의 마진으로 상쇄해서 마스크가 화면
              가장자리부터 시작하게 함 (모바일에서 풀-블리드 가로 스크롤) */}
        <div style={{ marginBottom: 14, marginInline: -16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 18px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary }}>구역 바로가기</span>
            <Link href={mapUrl} style={{ fontSize: 11, color: tok.textSecondary, textDecoration: 'none', fontWeight: 600 }}>
              전체 지도 →
            </Link>
          </div>
          <div style={{
            position: 'relative',
            // 좌우 12px fade 마스크 — 스크롤 가능 영역의 가장자리 잘림을 의도적 그라디언트로 전환
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)',
            maskImage:       'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)',
          }}>
            <div
              className="zone-shortcut-scroller"
              style={{
                display: 'flex', gap: 8,
                overflowX: 'auto', paddingBottom: 4,
                scrollSnapType: 'x mandatory',
                scrollPaddingInlineStart: 16,
                paddingInline: 16,
                scrollbarWidth: 'none',
              }}
            >
              {[...ZONES].sort((a, b) => {
                const preferred = prefs.gate ?? prefs.zone
                const aMatch = a.name === preferred ? -1 : 0
                const bMatch = b.name === preferred ? -1 : 0
                return aMatch - bMatch
              }).map((z) => {
                const isMyZone = z.name === (prefs.gate ?? prefs.zone)
                return (
                  <Link
                    key={z.name}
                    href={`/map?zone=${encodeURIComponent(z.zone)}${prefs.priorities.length ? `&p=${prefs.priorities.join(',')}` : ''}&gate=${encodeURIComponent(z.name)}`}
                    style={{
                      flex: '0 0 auto',
                      scrollSnapAlign: 'start',
                      background: isMyZone ? `${col.to}22` : tok.cardBg,
                      borderRadius: 14,
                      padding: '10px 14px',
                      border: isMyZone ? `1.5px solid ${col.to}` : `1px solid ${tok.cardBorder}`,
                      textDecoration: 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      minWidth: 96,
                      boxShadow: isMyZone ? `0 0 0 3px ${col.to}22` : deco.cardShadow,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: isMyZone ? col.to : tok.textPrimary }}>
                      {z.name}
                    </span>
                    <span style={{
                      fontSize: 10, color: tok.textTertiary,
                      textAlign: 'center', lineHeight: 1.3,
                    }}>
                      {z.desc}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── 방 조건 필터 ─────────────────────────────────────── */}
        <RoomFilterCard theme={theme} />

        {/* ── 내 계약 관리 ─────────────────────────────────────── */}
        <div style={{
          background: tok.cardBg, borderRadius: 20,
          border: `1px solid ${tok.cardBorder}`,
          boxShadow: deco.cardShadow,
          marginBottom: 14, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>내 계약 관리</span>
            <Link href="/me" style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
              마이페이지 →
            </Link>
          </div>
          <MyContractsCard hideHeader theme={theme} />
        </div>

        {/* ── 내 우선순위 ──────────────────────────────────────── */}
        {topPriority.length > 0 && (
          <div style={{
            background: tok.cardBg, borderRadius: 20, padding: '16px 20px',
            border: `1px solid ${tok.cardBorder}`,
            boxShadow: deco.cardShadow,
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>내 우선순위</span>
              <Link href="/?reset=1" style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
                변경
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topPriority.map((pid, i) => {
                const meta = FACTOR_META[pid]
                if (!meta) return null
                return (
                  <div key={pid} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: deco.priorityBg[i], borderRadius: 10, padding: '9px 12px',
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: deco.priorityColors[i], color: '#fff',
                      fontSize: 10, fontWeight: 800, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, flexShrink: 0, color: tok.textPrimary }}>{FACTOR_ICONS[pid] ?? meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: tok.textPrimary }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: tok.textSecondary }}>{meta.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {prefs.gate && (
              <div style={{
                marginTop: 8, padding: '9px 12px',
                background: tok.inputBg, borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14, color: tok.textSecondary }}>{GateIcon}</span>
                <span style={{ fontSize: 12, color: tok.textSecondary, fontWeight: 500 }}>
                  주로 쓰는 문: <strong style={{ color: tok.textPrimary }}>{prefs.gate}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── 방봐요 ────────────────────────────────────────────
            방 보러 갈 때 함께 가는 도구. 표준 체크리스트 + 사진 + 비교.
            방보기 모드의 일등 시민으로 노출 — 룸메이트 모드 랜딩(_roommate-landing)
            에는 노출하지 않는다 (확정된 결정). */}
        <Link
          href="/bangbwayo"
          aria-label="방봐요 — 방 보러 갈 때 함께 가는 도구"
          style={{
            display:      'block',
            marginBottom: 14,
            borderRadius: 20,
            overflow:     'hidden',
            border:       `1px solid ${tok.cardBorder}`,
            boxShadow:    deco.cardShadow,
            background:   `linear-gradient(135deg, ${col.from} 0%, ${col.mid} 60%, ${col.to} 100%)`,
            color:        '#fff',
            textDecoration: 'none',
            position:     'relative',
            padding:      '20px 22px 22px',
          }}
        >
          {/* 상단 유리 반사광 */}
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.16) 0%, transparent 100%)',
            borderRadius: '20px 20px 0 0',
            pointerEvents: 'none',
          }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: '0.06em' }}>
            ✦ 방봐요
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
            방 보러 갈 때 함께 가요
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.5 }}>
            표준 체크리스트로 기록하고, 한 화면에서 비교해요.
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 12,
            fontSize: 12, fontWeight: 700, color: '#fff',
            padding: '7px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            시작하기 →
          </span>
        </Link>

        {/* ── 룸메이트 모드 ──────────────────────────────────────
            클릭 시 viewMode 쿠키를 'roommate' 로 봉인한 뒤 /roommate 로
            302 리다이렉트한다. 단순 페이지 이동이 아니라 보기 모드를
            영구 전환하는 "자연스러운 모드 전환" 진입점.
            JS 없이도 동작 — 라우트 핸들러가 쿠키를 set 하고 redirect.
            세부: app/api/me/view-mode/enter-roommate/route.ts */}
        <Link
          href="/api/me/view-mode/enter-roommate"
          prefetch={false}
          aria-label="룸메이트 모드로 전환 — 룸메이트 매칭 시작하기"
          style={{
            display: 'block',
            marginBottom: 14,
            borderRadius: 20,
            overflow: 'hidden',
            border: `1px solid ${tok.cardBorder}`,
            boxShadow: deco.cardShadow,
            background: '#ffffff',
            lineHeight: 0,
          }}
        >
          <Image
            src="/images/roommate-cta.jpg"
            alt="룸메 구함 — 이층 침대 빈 자리에서 룸메이트를 찾고 있어요"
            width={1672}
            height={941}
            sizes="(max-width: 480px) calc(100vw - 32px), 448px"
            style={{ display: 'block', width: '100%', height: 'auto' }}
            priority={false}
          />
        </Link>

        {/* ── 하단 링크 ────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '4px 0', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/me" style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
            마이페이지
          </Link>
          <span style={{ color: tok.cardBorder, fontSize: 11 }}>·</span>
          <Link href="/?reset=1" style={{ fontSize: 11, color: tok.textTertiary, textDecoration: 'none', fontWeight: 500 }}>
            온보딩 다시 하기
          </Link>
        </div>

      </div>
    </div>
  )
}
