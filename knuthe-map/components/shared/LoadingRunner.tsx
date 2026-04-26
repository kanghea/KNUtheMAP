'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'

/**
 * 화면 전환·데이터 로딩 시 표시되는 12프레임 러닝 애니메이션.
 * 사용자가 터치/클릭하면 4프레임 거부(stop) 제스처를 1회 재생한 뒤 다시 러닝으로 복귀.
 *
 * ## 동작 원리 (running)
 * - 12장의 PNG 프레임을 같은 좌표에 absolute로 겹쳐 둔다.
 * - 각 프레임은 cycle 의 1/12 (= 8.3333%) 동안만 `opacity: 1`.
 * - `animation-delay` 를 i × (duration / 12) 만큼 양수로 주어 슬롯을 정렬.
 * - 키프레임은 `step-end` 타이밍 → 프레임 사이 보간 0, 완전한 하드 컷.
 *
 * ## 동작 원리 (tap)
 * - 4장의 PNG 프레임 (frame-01 ~ 04). cycle 1회만 재생 (`animation-iteration-count: 1`).
 * - 듀레이션 600ms = 한 프레임 150ms 노출.
 * - `setTimeout` 으로 600ms 뒤 mode 를 'run' 으로 복귀.
 *
 * ## 깜빡임 방지
 * - 모든 프레임을 plain `<img>` + `loading="eager"` + `fetchpriority="high"` 로 즉시 다운로드
 * - 각 `<img>` 에 `transform: translateZ(0)` 로 GPU 합성 강제
 * - 키프레임 timing-function `step-end` → opacity 보간 없이 정확한 0/1 토글
 *
 * ## 자산 위치
 * - 러닝: `public/images/loading-runner/frame-01..12.png` (256×256 RGBA)
 * - 거부: `public/images/loading-runner-tap/frame-01..04.png` (256×256 RGBA)
 */

export const RUNNER_FRAME_COUNT = 12
export const TAP_FRAME_COUNT = 4
export const TAP_DURATION_MS = 600

const RUN_PATH = '/images/loading-runner'
const TAP_PATH = '/images/loading-runner-tap'

interface FrameSetProps {
  /** 한 변(px) */
  size: number
  /** 1사이클 길이(초) */
  duration: number
}

function RunFrames({ size, duration }: FrameSetProps) {
  const frameDelaySec = duration / RUNNER_FRAME_COUNT
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        ['--knu-runner-duration' as string]: `${duration}s`,
      }}
    >
      {Array.from({ length: RUNNER_FRAME_COUNT }, (_, i) => {
        const n = i + 1
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`run-${n}`}
            src={`${RUN_PATH}/frame-${String(n).padStart(2, '0')}.png`}
            alt=""
            width={size}
            height={size}
            decoding="sync"
            loading="eager"
            // @ts-expect-error fetchpriority 는 React 19 표준이지만 일부 타입에서 누락
            fetchpriority="high"
            draggable={false}
            className="knu-runner-frame"
            style={{
              position: 'absolute',
              inset: 0,
              animationDelay: `${i * frameDelaySec}s`,
            }}
          />
        )
      })}
    </div>
  )
}

function TapFrames({ size, duration }: FrameSetProps) {
  const frameDelaySec = duration / TAP_FRAME_COUNT
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        ['--knu-tap-duration' as string]: `${duration}s`,
      }}
    >
      {Array.from({ length: TAP_FRAME_COUNT }, (_, i) => {
        const n = i + 1
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`tap-${n}`}
            src={`${TAP_PATH}/frame-${String(n).padStart(2, '0')}.png`}
            alt=""
            width={size}
            height={size}
            decoding="sync"
            loading="eager"
            // @ts-expect-error fetchpriority 는 React 19 표준이지만 일부 타입에서 누락
            fetchpriority="high"
            draggable={false}
            className="knu-tap-frame"
            style={{
              position: 'absolute',
              inset: 0,
              animationDelay: `${i * frameDelaySec}s`,
            }}
          />
        )
      })}
    </div>
  )
}

interface LoadingRunnerProps {
  /** 한 변(px). 기본 144 (오버레이 기본 크기와 동일) */
  size?: number
  /** 러닝 1사이클 길이(초). 기본 1 */
  duration?: number
  /** 탭 비활성화 (단순 표시 전용으로 쓰고 싶을 때). 기본 false */
  noInteract?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * 인라인 러닝 러너 (탭 시 거부 제스처).
 * 페이지 안 임의 위치에 그대로 박아 쓸 수 있다.
 * 페이지 전환·데이터 로딩 오버레이로 쓰려면 `<LoadingRunnerOverlay>` 사용.
 */
export function LoadingRunner({
  size = 144,
  duration = 1,
  noInteract = false,
  className,
  style,
}: LoadingRunnerProps) {
  const [mode, setMode] = useState<'run' | 'tap'>('run')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // unmount 시 타이머 정리 — setMode 가 unmounted 컴포넌트에 호출되지 않게.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleTap = useCallback(() => {
    if (noInteract) return
    if (timerRef.current) return  // 이미 탭 진행 중이면 무시
    setMode('tap')
    timerRef.current = setTimeout(() => {
      setMode('run')
      timerRef.current = null
    }, TAP_DURATION_MS)
  }, [noInteract])

  const interactive = !noInteract
  const tapDurationSec = TAP_DURATION_MS / 1000

  return (
    <div
      role={interactive ? 'button' : 'status'}
      aria-label={interactive ? '러너 톡톡 (거부 제스처)' : '로딩 중'}
      tabIndex={interactive ? 0 : -1}
      onClick={interactive ? handleTap : undefined}
      onKeyDown={interactive
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTap() } }
        : undefined}
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: interactive ? 'pointer' : 'default',
        // 부모 오버레이가 pointer-events: none 이라도 본인은 클릭 받음
        pointerEvents: interactive ? 'auto' : 'none',
        // 탭 피드백
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {mode === 'run' ? (
        <RunFrames size={size} duration={duration} />
      ) : (
        <TapFrames size={size} duration={tapDurationSec} />
      )}
    </div>
  )
}

interface LoadingRunnerOverlayProps extends LoadingRunnerProps {
  /** 표시 여부 (false 면 렌더하지 않음). 기본 true */
  show?: boolean
  /** z-index. 기본 2147483647 (브라우저 최대값) */
  zIndex?: number
}

/**
 * 표준 로딩 오버레이.
 * **항상 화면 정중앙 + 최상단 z-index** 에 떠 있다.
 *
 * 사용처:
 * - `loading.tsx` (페이지 전환 SSR 단계) — `<LoadingRunnerOverlay />` 그대로
 * - 클라이언트 컴포넌트의 데이터 로딩 — `<LoadingRunnerOverlay show={loading} />`
 *
 * 외곽 wrapper 는 pointer-events: none → 배경 페이지 클릭 가능.
 * 내부 LoadingRunner 는 pointer-events: auto → 캐릭터 자체는 탭 받음.
 */
export function LoadingRunnerOverlay({
  show = true,
  size = 144,
  duration = 1,
  noInteract = false,
  zIndex = 2147483647,
  className,
  style,
}: LoadingRunnerOverlayProps) {
  if (!show) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex,
        pointerEvents: 'none',
      }}
    >
      <LoadingRunner
        size={size}
        duration={duration}
        noInteract={noInteract}
        className={className}
        style={style}
      />
    </div>
  )
}
