'use client'

// 방봐요 — 트랙 비교용 N차원 레이더 차트.
//
// SVG 로 직접 그려 외부 차트 라이브러리 의존성 0. 세로·다크/라이트 양쪽 모두 동작.
// 시리즈 N 개 오버레이 가능 — 결과물 페이지에서 트랙 N 개의 응답 점수를 한 화면에
// 비교한다.
//
// 점수 스케일: 0~1 (호출자가 정규화하여 전달). 0=중심, 1=가장자리.
// rating → score 매핑은 호출부에서 처리 (lib/bangbwayo-radar.ts).

import type { ThemeTokens } from '@/lib/theme-tokens'

export interface RadarAxis {
  /** DB 키 (디버그·식별) */
  key:   string
  /** 차트에 표시될 짧은 라벨 — 보통 5자 이내 */
  label: string
}

export interface RadarSeries {
  /** 범례용 트랙 라벨 (예: "○○빌라 304호") */
  label:  string
  /** 폴리곤 색상 (HEX 또는 HSL). fill 은 자동으로 알파 적용 */
  color:  string
  /** axes 순서대로 0~1. axes.length 와 같은 길이여야 함 */
  values: number[]
}

interface Props {
  axes:    RadarAxis[]
  series:  RadarSeries[]
  /** 차트 정사각 변 길이 (px). 라벨 영역 포함. 기본 280 */
  size?:   number
  /** 격자 단계 수. 기본 4 (25/50/75/100%) */
  rings?:  number
  tok:     ThemeTokens
}

/**
 * SVG 레이더 차트.
 * - 다각형 격자: rings 단계
 * - 축선: 중심 → 각 꼭짓점
 * - 라벨: 각 꼭짓점 외부, 자동 정렬 (좌/우/상/하)
 * - 시리즈: stroke + fill (alpha 0.18)
 *
 * 접근성: title/aria-label 로 시리즈 라벨 + 값 요약 제공.
 */
export function RadarChart({ axes, series, size = 280, rings = 4, tok }: Props) {
  if (axes.length < 3) return null  // 의미 있는 폴리곤은 3축 이상

  const cx     = size / 2
  const cy     = size / 2
  const radius = (size / 2) * 0.72   // 라벨 공간 확보

  // 각 축의 각도 (12 시 방향 = -π/2 부터 시계방향)
  const angles = axes.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / axes.length)

  function point(angleRad: number, r: number): [number, number] {
    return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)]
  }

  // 격자 다각형 좌표 — rings 단계
  const ringPolygons = Array.from({ length: rings }, (_, ringIdx) => {
    const step = (ringIdx + 1) / rings
    const pts  = angles.map((a) => point(a, radius * step))
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  })

  // 축선 좌표
  const axisLines = angles.map((a) => point(a, radius))

  // 라벨 위치 — 다각형 바깥쪽으로 약간 떨어뜨림
  const labelOffsetR = radius + 18
  const labelPositions = angles.map((a) => {
    const [x, y] = point(a, labelOffsetR)
    // 텍스트 정렬: 좌/우/상/하 자동 결정 — cos/sin 부호로 판단
    const cosV = Math.cos(a)
    const sinV = Math.sin(a)
    const anchor: 'start' | 'middle' | 'end' =
      cosV > 0.3 ? 'start' :
      cosV < -0.3 ? 'end' : 'middle'
    // dy 미세 조정 — 위쪽(sin<0)은 약간 위로, 아래쪽은 약간 아래로
    const dy = sinV < -0.3 ? -2 : sinV > 0.3 ? 12 : 4
    return { x, y, anchor, dy }
  })

  // 시리즈별 폴리곤
  const seriesPolygons = series.map((s) => {
    const pts = s.values.map((v, i) => {
      const r = Math.max(0, Math.min(1, v)) * radius
      return point(angles[i], r)
    })
    return {
      ...s,
      pointsAttr: pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
      points:     pts,
    }
  })

  // 접근성용 요약
  const ariaLabel =
    series.length === 0
      ? `${axes.length}차원 비교 차트 (데이터 없음)`
      : `${axes.length}차원 비교 차트, ${series.length}개 트랙: ${series.map((s) => s.label).join(', ')}`

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height={size}
        role="img"
        aria-label={ariaLabel}
        style={{ display: 'block', margin: '0 auto', maxWidth: size }}
      >
        {/* 격자 다각형 — 안→밖 (가장 바깥이 100%) */}
        {ringPolygons.map((pts, i) => {
          const opacity = 0.04 + (0.04 * (i + 1)) / rings
          return (
            <polygon
              key={i}
              points={pts}
              fill={tok.textPrimary}
              fillOpacity={opacity}
              stroke={tok.cardBorder}
              strokeWidth={0.8}
            />
          )
        })}

        {/* 축선 */}
        {axisLines.map(([x, y], i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={x.toFixed(1)} y2={y.toFixed(1)}
            stroke={tok.cardBorder}
            strokeWidth={0.8}
          />
        ))}

        {/* 시리즈 폴리곤 */}
        {seriesPolygons.map((s, i) => (
          <g key={i}>
            <polygon
              points={s.pointsAttr}
              fill={s.color}
              fillOpacity={0.18}
              stroke={s.color}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            {/* 꼭짓점 점 */}
            {s.points.map(([x, y], j) => (
              <circle
                key={j}
                cx={x.toFixed(1)} cy={y.toFixed(1)}
                r={2.5}
                fill={s.color}
              />
            ))}
          </g>
        ))}

        {/* 축 라벨 */}
        {labelPositions.map((p, i) => (
          <text
            key={i}
            x={p.x.toFixed(1)}
            y={(p.y + p.dy).toFixed(1)}
            textAnchor={p.anchor}
            fontSize={11}
            fontWeight={600}
            fill={tok.textSecondary}
          >
            {axes[i].label}
          </text>
        ))}
      </svg>
    </div>
  )
}
