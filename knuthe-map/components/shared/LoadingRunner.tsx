import type { CSSProperties } from 'react'

/**
 * 화면 전환·데이터 로딩 시 표시되는 12프레임 러닝 애니메이션.
 *
 * ## 동작 원리
 * - 12장의 PNG 프레임을 같은 좌표에 absolute로 겹쳐 둔다.
 * - 각 프레임은 cycle 의 1/12 (= 8.3333%) 동안만 `opacity: 1`.
 * - `animation-delay` 를 i × (duration / 12) 만큼 양수로 주어 슬롯을 정렬.
 * - 키프레임은 `step-end` 타이밍 → 프레임 사이 보간 0, 완전한 하드 컷.
 * - 키프레임/타이밍 함수는 `app/globals.css` 의 `.knu-runner-frame` + `@keyframes knu-runner-frame` 정의.
 *
 * ## 깜빡임 방지
 * - 모든 프레임을 plain `<img>` + `loading="eager"` + `fetchPriority="high"` 로 즉시 다운로드
 * - 각 `<img>` 에 `transform: translateZ(0)` 로 GPU 합성 강제 → 프레임 전환 시 리페인트 방지
 * - 키프레임 timing-function `step-end` → opacity 보간 없이 정확한 0/1 토글
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
 * `public/images/loading-runner/frame-01.png` ~ `frame-12.png` (256×256 RGBA)
 */

export const RUNNER_FRAME_COUNT = 12
const RUNNER_BASE_PATH = '/images/loading-runner'

interface LoadingRunnerProps {
  /** 한 변(px). 기본 144 (오버레이 기본 크기와 동일) */
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
 * 페이지 전환·데이터 로딩 오버레이로 쓰려면 `<LoadingRunnerOverlay>` 사용.
 */
export function LoadingRunner({
  size = 144,
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
          // plain <img> 사용 이유:
          //  - next/image 는 lazy-loading·placeholder 처리로 첫 사이클 깜빡임 가능
          //  - 12장 모두 즉시 디코드해야 하드 컷이 매끄러움
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={`${RUNNER_BASE_PATH}/frame-${fileNum}.png`}
            alt=""
            width={size}
            height={size}
            decoding="sync"
            loading="eager"
            // @ts-expect-error fetchPriority 는 React 19 표준이지만 일부 타입에서 누락
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

interface LoadingRunnerOverlayProps extends LoadingRunnerProps {
  /** 표시 여부 (false 면 렌더하지 않음). 기본 true */
  show?: boolean
  /** z-index. 기본 2147483647 (브라우저 최대값) — 어떤 모달/네비/맵 위에도 떠 있게 */
  zIndex?: number
}

/**
 * 표준 로딩 오버레이.
 * **항상 화면 정중앙 + 최상단 z-index** 에 떠 있다 (페이지마다 위치가 달라지지 않음).
 *
 * 사용처:
 * - `loading.tsx` (페이지 전환 SSR 단계) — `<LoadingRunnerOverlay />` 그대로
 * - 클라이언트 컴포넌트의 데이터 로딩 — `<LoadingRunnerOverlay show={loading} />`
 *
 * pointer-events: none 이라 위에 떠 있어도 하단 UI 의 클릭을 막지 않는다.
 */
export function LoadingRunnerOverlay({
  show = true,
  size = 144,
  duration = 1,
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
        className={className}
        style={style}
      />
    </div>
  )
}
