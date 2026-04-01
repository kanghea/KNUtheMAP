// 우선순위 팩터 SVG 아이콘 매핑 (이모지 대체)
// pathLength="100" — path draw 애니메이션 호환

import React from 'react'

const svgProps = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.6,
  stroke: 'currentColor',
}

export const FACTOR_ICONS: Record<string, React.ReactNode> = {
  dist: (
    <svg {...svgProps}>
      <circle cx="12" cy="5" r="1" pathLength="100" />
      <path d="m10 22 4-12" pathLength="100" />
      <path d="m14 22-4-12" pathLength="100" />
      <path d="M14 9a2 2 0 0 0-2-2 2 2 0 0 0-2 2" pathLength="100" />
    </svg>
  ),
  age: (
    <svg {...svgProps}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" pathLength="100" />
      <path d="M20 3v4" pathLength="100" />
      <path d="M22 5h-4" pathLength="100" />
    </svg>
  ),
  size: (
    <svg {...svgProps}>
      <polyline points="15 3 21 3 21 9" pathLength="100" />
      <polyline points="9 21 3 21 3 15" pathLength="100" />
      <line x1="21" y1="3" x2="14" y2="10" pathLength="100" />
      <line x1="3" y1="21" x2="10" y2="14" pathLength="100" />
    </svg>
  ),
  security: (
    <svg {...svgProps}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" pathLength="100" />
      <path d="m9 12 2 2 4-4" pathLength="100" />
    </svg>
  ),
  nearby: (
    <svg {...svgProps}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" pathLength="100" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" pathLength="100" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" pathLength="100" />
      <path d="M2 7h20" pathLength="100" />
    </svg>
  ),
}

export const GateIcon = (
  <svg {...svgProps} width={16} height={16}>
    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" pathLength="100" />
    <path d="M2 20h20" pathLength="100" />
    <path d="M14 12v.01" pathLength="100" />
  </svg>
)
