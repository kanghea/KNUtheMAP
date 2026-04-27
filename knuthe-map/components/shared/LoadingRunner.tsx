'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'

/**
 * 화면 전환·데이터 로딩 시 표시되는 12프레임 러닝 애니메이션.
 * 사용자가 터치/클릭하면 4프레임 거부(stop) 제스처를 1회 재생한 뒤 다시 러닝으로 복귀.
 * 로딩이 완료된 시점에는 4프레임 종료(end) 모션을 1회 재생하고 사라진다.
 *
 * ## 동작 원리 (running)
 * - 12장의 PNG 프레임을 같은 좌표에 absolute로 겹쳐 둔다.
 * - 각 프레임의 슬롯은 cycle 의 1/12 (= 8.3333%).
 * - `animation-delay` 를 i × (duration / 12) 만큼 양수로 주어 슬롯을 정렬.
 * - 키프레임은 짧은 fade-in → hold → fade-out 으로 다음 프레임과 ~1%
 *   cross-fade. 셀 애니메이션 룩은 유지하면서 12fps judder 만 부드럽게.
 *
 * ## 동작 원리 (tap)
 * - 4장의 PNG 프레임 (frame-01 ~ 04). cycle 1회만 재생 (`animation-iteration-count: 1`).
 * - 듀레이션 600ms = 한 프레임 150ms 노출.
 * - `setTimeout` 으로 600ms 뒤 mode 를 'run' 으로 복귀.
 *
 * ## 동작 원리 (end)
 * - 4장의 PNG 프레임 (frame-01 ~ 04, 캐릭터가 맨홀로 사라지는 컷).
 * - cycle 1회만 재생, 듀레이션 600ms.
 * - `<LoadingRunnerOverlay show={...}>` 가 show: true → false 전환을 감지하면
 *   playEnd=true 로 이 모드 진입, 600ms 뒤 onEndComplete 콜백으로 unmount.
 * - 자산이 누락된 경우 첫 프레임 onError 가 발화되어 즉시 unmount (깨진 이미지 안 보임).
 *
 * ## 깜빡임 방지
 * - 모든 프레임을 plain `<img>` + `loading="eager"` + `fetchpriority="high"` 로 즉시 다운로드
 * - 각 `<img>` 에 `transform: translateZ(0)` 로 GPU 합성 강제
 * - 키프레임 timing-function `linear` + 슬롯 안 fade-in/hold/fade-out 으로
 *   합성 전환만 부드럽게 (재페인트 X, GPU 만 opacity 보간)
 *
 * ## 자산 위치
 * - 러닝: `public/images/loading-runner/frame-01..12.png` (256×256 RGBA)
 * - 거부: `public/images/loading-runner-tap/frame-01..04.png` (256×256 RGBA)
 * - 종료: `public/images/loading-runner-end/frame-01..04.png` (256×256 RGBA)
 */

export const RUNNER_FRAME_COUNT = 12
export const TAP_FRAME_COUNT = 4
export const END_FRAME_COUNT = 4
export const TAP_DURATION_MS = 600
export const END_DURATION_MS = 600

const RUN_PATH = '/images/loading-runner'
const TAP_PATH = '/images/loading-runner-tap'
const END_PATH = '/images/loading-runner-end'

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

interface EndFramesProps extends FrameSetProps {
  /** 첫 프레임 onError → 자산 누락. 즉시 onSkip 호출. */
  onSkip?: () => void
}

function EndFrames({ size, duration, onSkip }: EndFramesProps) {
  const frameDelaySec = duration / END_FRAME_COUNT
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        ['--knu-end-duration' as string]: `${duration}s`,
      }}
    >
      {Array.from({ length: END_FRAME_COUNT }, (_, i) => {
        const n = i + 1
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`end-${n}`}
            src={`${END_PATH}/frame-${String(n).padStart(2, '0')}.png`}
            alt=""
            width={size}
            height={size}
            decoding="sync"
            loading="eager"
            // @ts-expect-error fetchpriority 는 React 19 표준이지만 일부 타입에서 누락
            fetchpriority="high"
            draggable={false}
            onError={i === 0 ? onSkip : undefined}
            className="knu-end-frame"
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
  /** true 가 되는 순간 'end' 모드로 전환, 600ms 후 onEndComplete 호출. 기본 false */
  playEnd?: boolean
  /** end 애니메이션 끝났을 때 (또는 자산 누락으로 스킵 시) 콜백 */
  onEndComplete?: () => void
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
  playEnd = false,
  onEndComplete,
  className,
  style,
}: LoadingRunnerProps) {
  const [mode, setMode] = useState<'run' | 'tap' | 'end'>('run')
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endCbRef    = useRef(onEndComplete)
  useEffect(() => { endCbRef.current = onEndComplete }, [onEndComplete])

  // unmount 시 타이머 정리 — setMode 가 unmounted 컴포넌트에 호출되지 않게.
  useEffect(() => () => {
    if (timerRef.current)    clearTimeout(timerRef.current)
    if (endTimerRef.current) clearTimeout(endTimerRef.current)
  }, [])

  // playEnd 트리거 → 'end' 모드 1회 재생, 끝나면 onEndComplete
  useEffect(() => {
    if (playEnd) {
      // 진행 중 탭이 있으면 정리
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      setMode('end')
      if (endTimerRef.current) clearTimeout(endTimerRef.current)
      endTimerRef.current = setTimeout(() => {
        endTimerRef.current = null
        endCbRef.current?.()
      }, END_DURATION_MS)
    } else {
      // playEnd 가 다시 false 가 되면 (로딩 재개) 러닝으로 복귀
      if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null }
      setMode('run')
    }
  }, [playEnd])

  const handleTap = useCallback(() => {
    if (noInteract) return
    if (mode === 'end') return  // 종료 모션 진행 중엔 탭 무시
    if (timerRef.current) return  // 이미 탭 진행 중이면 무시
    setMode('tap')
    timerRef.current = setTimeout(() => {
      setMode('run')
      timerRef.current = null
    }, TAP_DURATION_MS)
  }, [noInteract, mode])

  // 자산 누락으로 'end' 가 깨질 때 즉시 onEndComplete (overlay 즉시 unmount)
  const handleEndAssetMissing = useCallback(() => {
    if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null }
    endCbRef.current?.()
  }, [])

  const interactive = !noInteract && mode !== 'end'
  const tapDurationSec = TAP_DURATION_MS / 1000
  const endDurationSec = END_DURATION_MS / 1000

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
      ) : mode === 'tap' ? (
        <TapFrames size={size} duration={tapDurationSec} />
      ) : (
        <EndFrames size={size} duration={endDurationSec} onSkip={handleEndAssetMissing} />
      )}
    </div>
  )
}

interface LoadingRunnerOverlayProps extends LoadingRunnerProps {
  /** 표시 여부 (false 면 렌더하지 않음). 기본 true */
  show?: boolean
  /** z-index. 기본 2147483647 (브라우저 최대값) */
  zIndex?: number
  /** show: true → false 전환 시 종료(end) 모션 1회 재생 후 unmount. 기본 true */
  closingAnimation?: boolean
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
 *
 * `show: true → false` 전환 시 캐릭터가 4프레임 종료(end) 모션을 1회 재생하고
 * 사라진다. 자산이 누락된 경우 즉시 unmount (깨진 이미지 안 보임).
 * 종료 모션이 필요 없으면 `closingAnimation={false}`.
 *
 * ## Next.js `loading.tsx` 강제 unmount 처리
 * Next.js 가 라우트 전환 완료 시 `loading.tsx` 트리를 한 번에 unmount 하면
 * `show` 가 true → false 전환을 거치지 못하고 컴포넌트가 즉시 사라져
 * 종료 모션이 재생되지 않는다.
 * 이를 보완하기 위해 unmount 시점에 `show` 가 여전히 true 였다면
 * 컴포넌트가 사라지기 직전 `<body>` 에 종료 모션 4프레임을 그대로 입힌
 * "잔류 노드" 를 임시로 떼어 둔 뒤 600ms 후 자동 제거한다.
 * (React 트리 밖이라 라우트가 unmount 되어도 살아남는다.)
 */
export function LoadingRunnerOverlay({
  show = true,
  size = 144,
  duration = 1,
  noInteract = false,
  zIndex = 2147483647,
  closingAnimation = true,
  className,
  style,
}: LoadingRunnerOverlayProps) {
  // show 가 true → false 로 바뀌면 즉시 unmount 하지 않고 종료 모션 1회 재생
  const [closing, setClosing]   = useState(false)
  const wasShownRef             = useRef(show)
  // unmount 잔류 노드 생성용으로 마지막 props 를 ref 에 보관
  const showRef                 = useRef(show)
  const closingAnimRef          = useRef(closingAnimation)
  const sizeRef                 = useRef(size)
  const zIndexRef               = useRef(zIndex)
  // 인-컴포넌트 종료 모션이 이미 재생되었는지 (= 잔류 노드 불필요)
  const playedEndRef            = useRef(false)

  useEffect(() => { showRef.current        = show             }, [show])
  useEffect(() => { closingAnimRef.current = closingAnimation }, [closingAnimation])
  useEffect(() => { sizeRef.current        = size             }, [size])
  useEffect(() => { zIndexRef.current      = zIndex           }, [zIndex])

  useEffect(() => {
    if (wasShownRef.current && !show) {
      // 표시 중이었는데 false 로 → 닫힘 시작
      if (closingAnimation) setClosing(true)
    }
    if (!wasShownRef.current && show) {
      // 다시 켜지면 닫힘 취소
      setClosing(false)
    }
    wasShownRef.current = show
  }, [show, closingAnimation])

  // 새 오버레이가 마운트되면 이전 잔류 노드 제거 (연속 라우트 전환 시 캐릭터 중첩 방지)
  useEffect(() => {
    removeEndAnimationResiduals()
  }, [])

  // 강제 unmount 시 (Next.js loading.tsx 트리 제거 등) 종료 모션 잔류 노드 생성
  useEffect(() => () => {
    if (showRef.current && closingAnimRef.current && !playedEndRef.current) {
      createEndAnimationResidual({
        size:   sizeRef.current,
        zIndex: zIndexRef.current,
      })
    }
  }, [])

  const handleEndComplete = useCallback(() => {
    playedEndRef.current = true
    setClosing(false)
  }, [])

  if (!show && !closing) return null

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
        playEnd={closing}
        onEndComplete={handleEndComplete}
        className={className}
        style={style}
      />
    </div>
  )
}

const RESIDUAL_CLASS = 'knu-loading-runner-end-residual'

/**
 * React 트리 밖에서 종료(end) 모션 4프레임을 한 번만 재생하는 DOM 노드를
 * `<body>` 에 직접 붙였다 600ms 후 떼어 낸다.
 * Next.js `loading.tsx` 강제 unmount 처럼 React 가 컴포넌트를 즉시 제거해
 * 컴포넌트 안 종료 모션을 재생할 시간이 없는 상황에서 호출.
 */
function createEndAnimationResidual({
  size,
  zIndex,
}: {
  size:   number
  zIndex: number
}) {
  if (typeof document === 'undefined') return

  const container = document.createElement('div')
  container.className = RESIDUAL_CLASS
  container.style.position      = 'fixed'
  container.style.top           = '50%'
  container.style.left          = '50%'
  container.style.transform     = 'translate(-50%, -50%)'
  container.style.zIndex        = String(zIndex)
  container.style.pointerEvents = 'none'
  container.style.width         = `${size}px`
  container.style.height        = `${size}px`
  container.style.setProperty('--knu-end-duration', `${END_DURATION_MS / 1000}s`)

  const frameDelaySec = (END_DURATION_MS / 1000) / END_FRAME_COUNT
  let assetMissing = false

  for (let i = 0; i < END_FRAME_COUNT; i++) {
    const n = i + 1
    const img = document.createElement('img')
    img.src       = `${END_PATH}/frame-${String(n).padStart(2, '0')}.png`
    img.alt       = ''
    img.width     = size
    img.height    = size
    img.draggable = false
    img.loading   = 'eager'
    img.decoding  = 'sync'
    ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high'
    img.className = 'knu-end-frame'
    img.style.position       = 'absolute'
    img.style.inset          = '0'
    img.style.animationDelay = `${i * frameDelaySec}s`
    if (i === 0) {
      img.onerror = () => {
        // 자산 누락: 잔류 노드 즉시 제거 (깨진 이미지 안 보임)
        assetMissing = true
        container.remove()
      }
    }
    container.appendChild(img)
  }

  document.body.appendChild(container)

  // 종료 모션 + 약간의 여유 (16ms × 2 ≈ 1프레임 +) 후 제거
  setTimeout(() => {
    if (!assetMissing) container.remove()
  }, END_DURATION_MS + 50)
}

function removeEndAnimationResiduals() {
  if (typeof document === 'undefined') return
  document.querySelectorAll(`.${RESIDUAL_CLASS}`).forEach(el => el.remove())
}
