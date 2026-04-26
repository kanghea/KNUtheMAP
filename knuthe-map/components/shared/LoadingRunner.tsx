import Image from 'next/image'
import type { CSSProperties } from 'react'

/**
 * 화면 전환 시 표시되는 12프레임 러닝 애니메이션.
 *
 * ## 동작 원리
 * - 12장의 PNG 프레임을 같은 좌표에 absolute로 겹쳐 둔다.
 * - 각 프레임은 cycle 의 1/12 (= 8.3333%) 동안만 `opacity: 1`.
 * - `animation-delay` 를 i × (duration / 12) 만큼 양수로 주어 슬롯을 정렬.
 * - 키프레임/타이밍 함수는 `app/globals.css` 의 `.knu-runner-frame` + `@keyframes knu-runner-frame` 정의.
 *
 * ## 프레임 시각 설계
 * 기본 1초 = 1000ms 기준, 한 프레임 = 83.333ms 노출.
 * 두 보폭(좌·우)이 1사이클 안에 모두 들어가므로 보행 케이던스 = 120 step/min.
 *
 * | idx | 시작(ms) | 끝(ms) | 포즈            |
 * |-----|---------:|-------:|-----------------|
 * | 1   |   0.000 |  83.33 | 컨택트(오른발) |
 * | 2   |  83.333 | 166.67 | 다운            |
 * | 3   | 166.667 | 250.00 | 패스 포지션     |
 * | 4   | 250.000 | 333.33 | 업              |
 * | 5   | 333.333 | 416.67 | 익스텐션(왼발) |
 * | 6   | 416.667 | 500.00 | 컨택트(왼발)   |
 * | 7   | 500.000 | 583.33 | 다운            |
 * | 8   | 583.333 | 666.67 | 패스 포지션     |
 * | 9   | 666.667 | 750.00 | 업              |
 * | 10  | 750.000 | 833.33 | 익스텐션(오른발) |
 * | 11  | 833.333 | 916.67 | 컨택트(오른발) |
 * | 12  | 916.667 |1000.00 | 다운(다음 사이클로) |
 *
 * ## 자산 위치
 * `public/images/loading-runner/frame-01.png` ~ `frame-12.png`
 * 자산 준비 가이드는 같은 폴더의 README.md 참조.
 */

export const RUNNER_FRAME_COUNT = 12
const RUNNER_BASE_PATH = '/images/loading-runner'

interface LoadingRunnerProps {
  /** 한 변(px). 기본 96 */
  size?: number
  /** 1사이클 길이(초). 기본 1 */
  duration?: number
  /** 디버그용으로 추가 클래스가 필요할 때 */
  className?: string
  /** 외곽 컨테이너 스타일 오버라이드 */
  style?: CSSProperties
}

/**
 * 인라인 러닝 러너.
 * 페이지 안 임의 위치에 그대로 박아 쓸 수 있다.
 * 페이지 전환 오버레이로 쓰려면 `<LoadingRunnerOverlay>` 사용.
 */
export function LoadingRunner({
  size = 96,
  duration = 1,
  className,
  style,
}: LoadingRunnerProps) {
  const frameDelaySec = duration / RUNNER_FRAME_COUNT
  return (
    <div
      role="status"
      aria-label="로딩 중"
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        // .knu-runner-frame 키프레임이 참조하는 CSS 변수
        ['--knu-runner-duration' as string]: `${duration}s`,
        ...style,
      }}
    >
      {Array.from({ length: RUNNER_FRAME_COUNT }, (_, i) => {
        const n = i + 1
        const fileNum = String(n).padStart(2, '0')
        return (
          <Image
            key={n}
            src={`${RUNNER_BASE_PATH}/frame-${fileNum}.png`}
            alt=""
            width={size}
            height={size}
            unoptimized
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

interface LoadingRunnerOverlayProps extends LoadingRunnerProps {
  /** 화면 어느 쪽에 띄울지. 기본 'bottom' */
  placement?: 'bottom' | 'center' | 'top'
  /** placement 기준 가장자리에서의 거리(px). 기본 32 */
  inset?: number
  /** z-index. 기본 50 (sticky 헤더 zIndex 10 보다 위) */
  zIndex?: number
}

/**
 * `loading.tsx` 표준 사용처.
 * 스켈레톤 위에 fixed 로 떠 있는 러닝 러너.
 * - 기본은 bottom-center → 헤더/콘텐츠와 겹치지 않으면서 페이지 전환을 알림
 * - pointer-events: none 이라 클릭을 막지 않음
 */
export function LoadingRunnerOverlay({
  size = 80,
  duration = 1,
  placement = 'bottom',
  inset = 32,
  zIndex = 50,
  className,
  style,
}: LoadingRunnerOverlayProps) {
  const positional: CSSProperties = (() => {
    if (placement === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    if (placement === 'top') {
      return { top: inset, left: '50%', transform: 'translateX(-50%)' }
    }
    return { bottom: inset, left: '50%', transform: 'translateX(-50%)' }
  })()

  return (
    <div
      style={{
        position: 'fixed',
        zIndex,
        pointerEvents: 'none',
        ...positional,
      }}
    >
      <LoadingRunner
        size={size}
        duration={duration}
        className={className}
        style={style}
      />
    </div>
  )
}
