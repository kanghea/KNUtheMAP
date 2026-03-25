'use client'

// Abramowitz & Stegun erf approximation (max error 1.5e-7)
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-ax * ax)
  return sign * y
}

function normalCDF(x: number, μ: number, σ: number): number {
  return 0.5 * (1 + erf((x - μ) / (σ * Math.sqrt(2))))
}

function normalPDF(x: number, μ: number, σ: number): number {
  return Math.exp(-0.5 * ((x - μ) / σ) ** 2) / (σ * Math.sqrt(2 * Math.PI))
}

interface Props {
  ages:        number[]
  currentAge:  number
  zone:        string
}

export default function AgeDistribution({ ages, currentAge, zone }: Props) {
  if (ages.length < 5) return null

  const μ = ages.reduce((s, a) => s + a, 0) / ages.length
  const σ = Math.sqrt(ages.reduce((s, a) => s + (a - μ) ** 2, 0) / ages.length)

  if (σ < 0.5) {
    return (
      <div className="border border-gray-200 rounded-xl px-5 py-4">
        <p className="text-sm text-gray-500 text-center py-2">
          같은 구역 건물들이 모두 비슷한 연식입니다. ({Math.round(μ)}년)
        </p>
      </div>
    )
  }

  const pct    = normalCDF(currentAge, μ, σ)
  const isOld  = pct >= 0.5
  const rankPct = isOld ? Math.round((1 - pct) * 100) : Math.round(pct * 100)
  const rankLabel = isOld ? `노후 상위 ${rankPct}%` : `신축 상위 ${100 - rankPct}%`
  const rankColor = isOld
    ? pct >= 0.85 ? '#ef4444' : pct >= 0.6 ? '#f59e0b' : '#6b7280'
    : '#22c55e'

  // SVG 좌표계
  const W = 480, H = 160
  const ML = 8, MR = 8, MT = 30, MB = 40
  const PW = W - ML - MR
  const PH = H - MT - MB

  const xMin = μ - 3.8 * σ
  const xMax = μ + 3.8 * σ
  const tx = (x: number) => ML + ((x - xMin) / (xMax - xMin)) * PW
  const maxPDF = normalPDF(μ, μ, σ)
  const ty = (y: number) => MT + (1 - y / maxPDF) * PH
  const baseY = ty(0)

  // 커브 포인트 (200개)
  const N = 200
  const pts: [number, number][] = Array.from({ length: N + 1 }, (_, i) => {
    const x = xMin + (i / N) * (xMax - xMin)
    return [tx(x), ty(normalPDF(x, μ, σ))]
  })

  const curvePath = pts
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
    .join(' ')

  // 음영: xMin → currentAge (percentile 영역)
  const curSvgX = tx(currentAge)
  const shadePts = pts.filter(([px]) => px <= curSvgX)
  const shadePath =
    shadePts.length > 1
      ? `M${shadePts[0][0].toFixed(1)},${baseY} ` +
        shadePts.map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join(' ') +
        ` L${curSvgX.toFixed(1)},${baseY} Z`
      : ''

  // 축 레이블: μ±1σ, μ±2σ, μ
  const axisTicks = [-2, -1, 0, 1, 2].map((n) => ({
    svgX: tx(μ + n * σ),
    year: Math.round(μ + n * σ),
    label: n === 0 ? 'μ' : n > 0 ? `μ+${n}σ` : `μ${n}σ`,
  }))

  // 현재 건물 레이블 박스 위치 (경계 클램프)
  const labelBoxW = 44
  const labelBoxX = Math.max(ML, Math.min(W - MR - labelBoxW, curSvgX - labelBoxW / 2))

  return (
    <div className="border border-gray-200 rounded-xl px-5 pt-5 pb-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">같은 구역 건물 연식 분포</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {zone} · 표본 {ages.length}개 건물 기준
          </p>
        </div>
        <span className="text-sm font-bold shrink-0 ml-3" style={{ color: rankColor }}>
          {rankLabel}
        </span>
      </div>

      {/* SVG 차트 */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {/* 음영 (백분위 영역) */}
        {shadePath && (
          <path d={shadePath} fill={isOld ? '#fee2e2' : '#dcfce7'} opacity="0.85" />
        )}

        {/* 벨 커브 */}
        <path
          d={curvePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* X축 */}
        <line
          x1={ML} y1={baseY} x2={W - MR} y2={baseY}
          stroke="#e5e7eb" strokeWidth="1"
        />

        {/* μ 영역선 */}
        <line
          x1={tx(μ)} y1={MT} x2={tx(μ)} y2={baseY}
          stroke="#93c5fd" strokeWidth="1" strokeDasharray="3,2"
        />

        {/* 현재 건물 수직선 */}
        <line
          x1={curSvgX} y1={MT - 6} x2={curSvgX} y2={baseY}
          stroke={rankColor} strokeWidth="1.5" strokeDasharray="4,2"
        />

        {/* 현재 건물 점 */}
        <circle
          cx={curSvgX}
          cy={ty(normalPDF(currentAge, μ, σ))}
          r="4"
          fill={rankColor}
          stroke="white"
          strokeWidth="1.5"
        />

        {/* 현재 건물 레이블 박스 */}
        <rect
          x={labelBoxX} y={MT - 22}
          width={labelBoxW} height={15}
          rx="3"
          fill={rankColor}
        />
        <text
          x={labelBoxX + labelBoxW / 2}
          y={MT - 12}
          textAnchor="middle"
          fontSize="9"
          fill="white"
          fontWeight="700"
        >
          {currentAge}년
        </text>

        {/* 축 틱 */}
        {axisTicks.map(({ svgX, year, label }) => (
          <g key={label}>
            <line x1={svgX} y1={baseY} x2={svgX} y2={baseY + 4} stroke="#d1d5db" strokeWidth="1" />
            <text x={svgX} y={baseY + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">
              {year}년
            </text>
            <text x={svgX} y={baseY + 25} textAnchor="middle" fontSize="8" fill="#c4b5fd" fontStyle="italic">
              {label}
            </text>
          </g>
        ))}
      </svg>

      {/* 요약 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          구역 평균{' '}
          <strong className="text-gray-700">{μ.toFixed(1)}년</strong>
          {' · '}표준편차{' '}
          <strong className="text-gray-700">{σ.toFixed(1)}년</strong>
        </span>
        <span className="text-xs text-gray-500">
          이 건물:{' '}
          <span className="font-semibold" style={{ color: rankColor }}>
            {rankLabel}
          </span>
        </span>
      </div>
    </div>
  )
}
