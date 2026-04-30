'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface Props {
  tok: ThemeTokens
  /** 현재 보기 모드 — 카드 카피·CTA 라벨 결정 */
  currentMode: 'rooms' | 'roommate'
  /**
   * 카드 상단에 깔리는 일러스트 이미지(선택).
   * - 너비: 가용 너비를 꽉 채운다 (`width: '100%'`)
   * - 비율: `imageWidth` / `imageHeight` 로 결정
   * 미지정 시 텍스트만 보여주는 horizontal 레이아웃으로 폴백.
   */
  imageSrc?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  /** 이미지 영역의 배경색. 흰 일러스트가 다크 테마에서 어색해지는 걸 방지. */
  imageBg?: string
}

// 룸메이트 정체성 색
const ROOMMATE_ACCENT = '#6C63FF'
// 방보기 모드(파랑) 액션 색
const ROOMS_ACCENT    = '#2563eb'

/**
 * 홈에 박히는 "모드 전환" 카드.
 *
 * `/me` 의 `<ModeToggle>` 과 동일한 API(`/api/me/view-mode` POST)를 호출하지만
 * 시각 언어가 다르다:
 *  - 룸메이트 모드 홈 → "방을 찾으세요? 방보기 모드로" + 일러스트
 *  - 방보기 모드 홈   → "룸메이트 찾기? 룸메이트 모드로" (텍스트만)
 *
 * 전환 후엔 `router.refresh()` 로 SSR 트리를 다시 받아 PrefsIsland nav,
 * 페이지 분기까지 즉시 갱신한다.
 */
export function ModeSwitchCard({
  tok,
  currentMode,
  imageSrc,
  imageAlt,
  imageWidth = 1672,
  imageHeight = 941,
  imageBg = '#ffffff',
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [busy,  setBusy]  = useState(false)
  // 이미지 로드 실패 시 텍스트 전용 레이아웃으로 폴백 (graceful degradation).
  const [imageBroken, setImageBroken] = useState(false)

  const target       = currentMode === 'roommate' ? 'rooms' : 'roommate'
  const targetLabel  = target === 'rooms' ? '방보기' : '룸메이트'
  const targetAccent = target === 'rooms' ? ROOMS_ACCENT : ROOMMATE_ACCENT

  // 카피
  const title    = currentMode === 'roommate'
    ? '경북대 주변 방을 찾고 계세요?'
    : '룸메이트도 함께 찾아볼까요?'
  const subtitle = currentMode === 'roommate'
    ? '방보기 모드로 전환하면 매물 지도와 필터를 볼 수 있어요'
    : '룸메이트 모드로 전환하면 호환도 매칭이 시작돼요'

  const handleSwitch = async () => {
    if (busy || isPending) return
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/me/view-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: target }),
      })
      if (!res.ok) {
        // 룸메이트 모드 진입은 프로필이 필요 — 401/4xx면 온보딩으로
        if (target === 'roommate' && (res.status === 401 || res.status === 404)) {
          router.push('/onboarding/roommate')
          return
        }
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? '모드 전환에 실패했어요')
        return
      }
      startTransition(() => { router.refresh() })
    } catch {
      setError('네트워크 오류가 발생했어요')
    } finally {
      setBusy(false)
    }
  }

  const inProgress = busy || isPending
  const showImage  = !!imageSrc && !imageBroken

  return (
    <div style={{
      position: 'relative',
      background: tok.cardBg,
      border: `1px solid ${tok.cardBorder}`,
      borderRadius: 20,
      boxShadow: tok.shadow,
      overflow: 'hidden',
    }}>
      {/* ── 일러스트 영역 (선택) ─────────────────────────────────
          이미지가 있으면 카드 상단에 가로 가득 채워 깐다.
          다크/라이트 모두에서 일러스트가 또렷이 보이도록 흰 backdrop 강제. */}
      {showImage && (
        <div style={{
          position: 'relative',
          background: imageBg,
          borderBottom: `1px solid ${tok.cardBorder}`,
          aspectRatio: `${imageWidth} / ${imageHeight}`,
        }}>
          <Image
            src={imageSrc!}
            alt={imageAlt ?? '방 구하기 일러스트 — 방보기 모드로 전환하기'}
            width={imageWidth}
            height={imageHeight}
            sizes="(max-width: 480px) calc(100vw - 32px), 448px"
            style={{ display: 'block', width: '100%', height: 'auto' }}
            onError={() => setImageBroken(true)}
            priority={false}
          />
          {/* 우상단 모서리 — 전환할 모드의 색상 칩 */}
          <span aria-hidden style={{
            position: 'absolute', top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999,
            background: `${targetAccent}`,
            color: '#fff', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18" /><polyline points="14 5 21 12 14 19" />
            </svg>
            방보기
          </span>
        </div>
      )}

      <div style={{ position: 'relative', padding: '18px 20px' }}>
        {/* 우측 그라디언트 장식 — 텍스트만 모드일 때만 보이도록 (이미지 모드와 시각 충돌 방지) */}
        {!showImage && (
          <div aria-hidden style={{
            position: 'absolute', top: -24, right: -24, width: 110, height: 110,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${targetAccent}33 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        {showImage ? (
          // 이미지 모드 — 일러스트 아래에 카피만 (아이콘 없음, 가독성)
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: 14, fontWeight: 800, color: tok.textPrimary,
              margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em',
            }}>
              {title}
            </p>
            <p style={{
              fontSize: 12, color: tok.textTertiary, margin: '4px 0 0',
              lineHeight: 1.55,
            }}>
              {subtitle}
            </p>
          </div>
        ) : (
          // 텍스트 모드 — 좌측 화살표 아이콘 + 카피 (기존 horizontal 레이아웃)
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            position: 'relative', marginBottom: 14,
          }}>
            <span style={{
              flexShrink: 0,
              width: 40, height: 40, borderRadius: 12,
              background: `${targetAccent}1f`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={targetAccent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h13" /><polyline points="12 3 16 7 12 11" />
                <path d="M21 17H8" /><polyline points="12 21 8 17 12 13" />
              </svg>
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: tok.textPrimary,
                margin: 0, lineHeight: 1.35,
              }}>
                {title}
              </p>
              <p style={{
                fontSize: 11, color: tok.textTertiary, margin: '3px 0 0',
                lineHeight: 1.5,
              }}>
                {subtitle}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSwitch}
          disabled={inProgress}
          aria-busy={inProgress || undefined}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 12,
            background: inProgress ? `${targetAccent}aa` : targetAccent,
            color: '#fff',
            fontSize: 13, fontWeight: 700,
            border: 'none',
            cursor: inProgress ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .15s, transform .1s',
          }}
        >
          {inProgress ? (
            <>
              <span aria-hidden style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff',
                animation: 'knu-spin 0.8s linear infinite',
              }} />
              전환 중…
            </>
          ) : (
            <>
              {targetLabel} 모드로 전환
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </>
          )}
        </button>

        {error && (
          <p role="alert" style={{
            margin: '10px 0 0', fontSize: 12, color: tok.dangerColor,
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
