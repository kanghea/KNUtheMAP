// AgeDistribution — 연식 분포 + 인사이트 카드

// ── 수학 유틸 ──────────────────────────────────────────────────────

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax)
  return sign * y
}
function normalCDF(x: number, μ: number, σ: number) {
  return 0.5 * (1 + erf((x - μ) / (σ * Math.sqrt(2))))
}
function normalPDF(x: number, μ: number, σ: number) {
  return Math.exp(-0.5 * ((x - μ) / σ) ** 2) / (σ * Math.sqrt(2 * Math.PI))
}

// ── 등급 정의 ──────────────────────────────────────────────────────

const GRADES = [
  { max: 10,       label: '신축',    emoji: '✨', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  { max: 20,       label: '준신축',  emoji: '🏠', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  { max: 30,       label: '보통',    emoji: '🏡', color: 'rgba(255,255,255,0.65)', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)' },
  { max: 40,       label: '노후',    emoji: '🔧', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  { max: Infinity, label: '구형',    emoji: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
]
function getGrade(age: number) {
  return GRADES.find((g) => age <= g.max)!
}

// ── 인사이트 텍스트 생성 ───────────────────────────────────────────

function buildInsight(currentAge: number, μ: number, σ: number, pct: number, zone: string, n: number): string {
  const diff = Math.abs(Math.round(currentAge - μ))

  if (pct <= 0.15) {
    return `${zone}에서 신축에 가까운 건물입니다. 구역 평균보다 ${diff}년 더 새로 지어졌으며, 관리 상태가 상대적으로 양호할 가능성이 높습니다.`
  }
  if (pct >= 0.85) {
    return `${zone} ${n}개 건물 중 오래된 편에 속합니다. 구역 평균보다 ${diff}년 더 경과했으니, 입주 전 배관·단열·전기 상태를 꼭 확인하세요.`
  }
  if (pct >= 0.65) {
    return `구역 평균(${Math.round(μ)}년)보다 ${diff}년 더 오래된 건물입니다. 계약 전 최근 수리 이력을 확인해 보는 것이 좋습니다.`
  }
  if (pct <= 0.35) {
    return `구역 평균(${Math.round(μ)}년)보다 ${diff}년 더 새로 지어진 건물입니다. ${zone} 내에서 비교적 상태가 양호한 편에 속합니다.`
  }
  return `${zone} 평균(${Math.round(μ)}년)과 비슷한 연식의 건물입니다. 준공 후 ${currentAge}년이 지났으니, 실제 관리 상태를 직접 확인해 보세요.`
}

// ── Tok ───────────────────────────────────────────────────────────

type Tok = {
  pageBg: string; cardBg: string; cardBgAlt: string
  border: string; borderSoft: string
  textPrimary: string; textSecondary: string; textTertiary: string
  accent: string; accentBg: string
  starEmpty: string
}

// ── Props ──────────────────────────────────────────────────────────

interface Props {
  ages:       number[]
  currentAge: number
  zone:       string
  builtYear:  number        // 실제 준공 연도
  tok:        Tok
}

export default function AgeDistribution({ ages, currentAge, zone, builtYear, tok }: Props) {
  if (ages.length < 5) return null

  const μ = ages.reduce((s, a) => s + a, 0) / ages.length
  const σ = Math.sqrt(ages.reduce((s, a) => s + (a - μ) ** 2, 0) / ages.length)
  if (σ < 0.5) return null

  const pct   = normalCDF(currentAge, μ, σ)
  const grade = getGrade(currentAge)

  // '보통' 등급은 테마에 맞는 색상 사용
  const gradeColor = grade.label === '보통' ? tok.textTertiary : grade.color

  // 구역 순위
  const newerCount = ages.filter((a) => a < currentAge).length

  // 비슷한 연식 (±7년) 건물 수
  const similarCount = ages.filter((a) => Math.abs(a - currentAge) <= 7).length

  const insight = buildInsight(currentAge, μ, σ, pct, zone, ages.length)

  // ── 히스토그램 버킷 (5년 단위) ───────────────────────────────────

  const BUCKET = 5
  const minAge = Math.floor(Math.min(...ages) / BUCKET) * BUCKET
  const maxAge = Math.ceil(Math.max(...ages) / BUCKET) * BUCKET
  const buckets: { start: number; end: number; count: number }[] = []
  for (let s = minAge; s < maxAge; s += BUCKET) {
    buckets.push({
      start: s, end: s + BUCKET,
      count: ages.filter((a) => a >= s && a < s + BUCKET).length,
    })
  }
  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  // ── SVG 좌표계 ────────────────────────────────────────────────────

  const W = 480, H = 170
  const ML = 28, MR = 12, MT = 18, MB = 36
  const PW = W - ML - MR
  const PH = H - MT - MB
  const baseY = MT + PH

  const xRange = maxAge - minAge || 1
  const tx = (x: number) => ML + ((x - minAge) / xRange) * PW
  const ty = (count: number) => MT + (1 - count / maxCount) * PH

  // 벨커브 (연속 포인트)
  const N = 300
  const xMinC = μ - 3.8 * σ
  const xMaxC = μ + 3.8 * σ
  const maxPDF = normalPDF(μ, μ, σ)
  const curvePts: string[] = Array.from({ length: N + 1 }, (_, i) => {
    const x = xMinC + (i / N) * (xMaxC - xMinC)
    const svgX = tx(x)
    const svgY = MT + (1 - normalPDF(x, μ, σ) / maxPDF) * PH
    return `${i === 0 ? 'M' : 'L'}${svgX.toFixed(1)},${svgY.toFixed(1)}`
  })
  const curvePath = curvePts.join(' ')

  // 현재 건물 SVG X
  const curX = tx(currentAge)
  const meanX = tx(μ)

  // 사분위 영역 (25~75%)
  const q25X = tx(μ - 0.674 * σ)
  const q75X = tx(μ + 0.674 * σ)

  // 축 레이블: 10년 단위
  const axisTicks: number[] = []
  for (let y = Math.ceil(minAge / 10) * 10; y <= maxAge; y += 10) axisTicks.push(y)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* ── 헤더 ────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: tok.textPrimary }}>건물 연식 분포</h3>
          <p className="text-xs mt-0.5" style={{ color: tok.textTertiary }}>{zone} · {ages.length}개 건물 기준</p>
        </div>
        <span
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
          style={{ background: grade.bg, color: gradeColor, border: `1px solid ${grade.border}` }}
        >
          {grade.emoji} {grade.label}
        </span>
      </div>

      {/* ── 인사이트 텍스트 ──────────────────────────────────────── */}
      <div
        className="mx-5 mb-4 px-4 py-3 rounded-xl text-xs leading-relaxed"
        style={{ background: grade.bg, borderLeft: `3px solid ${gradeColor}`, color: gradeColor }}
      >
        {insight}
      </div>

      {/* ── SVG 차트 ─────────────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 170 }}>

          {/* 중간 50% 밴드 (IQR) */}
          <rect
            x={q25X} y={MT}
            width={Math.max(0, q75X - q25X)} height={PH}
            fill={tok.accentBg} rx="0"
          />

          {/* 히스토그램 막대 */}
          {buckets.map((b) => {
            if (b.count === 0) return null
            const bx = tx(b.start)
            const bw = Math.max(0, tx(b.end) - bx - 1)
            const by = ty(b.count)
            const bh = baseY - by
            const midAge = (b.start + b.end) / 2
            const g = getGrade(midAge)
            const barColor = g.label === '보통' ? tok.textTertiary : g.color
            // 현재 건물이 이 버킷에 속하면 강조
            const isCurrent = currentAge >= b.start && currentAge < b.end
            return (
              <rect
                key={b.start}
                x={bx} y={by} width={bw} height={bh}
                fill={isCurrent ? gradeColor : barColor}
                opacity={isCurrent ? 0.85 : 0.22}
                rx="2"
              />
            )
          })}

          {/* 벨 커브 */}
          <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinejoin="round" opacity="0.7" />

          {/* X축 */}
          <line x1={ML} y1={baseY} x2={W - MR} y2={baseY} stroke={tok.border} strokeWidth="1" />

          {/* 평균선 */}
          <line
            x1={meanX} y1={MT} x2={meanX} y2={baseY}
            stroke={tok.textTertiary} strokeWidth="1" strokeDasharray="3,2"
          />
          <text x={meanX} y={MT - 4} textAnchor="middle" fontSize="8.5" fill={tok.textTertiary} fontWeight="600">
            구역 평균
          </text>

          {/* 현재 건물 수직선 */}
          <line
            x1={curX} y1={MT - 2} x2={curX} y2={baseY}
            stroke={gradeColor} strokeWidth="2" strokeDasharray="5,2.5"
          />

          {/* 현재 건물 점 (커브 위) */}
          <circle
            cx={curX}
            cy={MT + (1 - normalPDF(currentAge, μ, σ) / maxPDF) * PH}
            r="5"
            fill={gradeColor}
            stroke={tok.pageBg}
            strokeWidth="2"
          />

          {/* 현재 건물 레이블 */}
          {(() => {
            const labelW = 52
            const lx = Math.max(ML, Math.min(W - MR - labelW, curX - labelW / 2))
            return (
              <g>
                <rect x={lx} y={MT - 19} width={labelW} height={16} rx="4" fill={gradeColor} />
                <text
                  x={lx + labelW / 2} y={MT - 8}
                  textAnchor="middle" fontSize="9.5" fill="white" fontWeight="700"
                >
                  이 건물 · {currentAge}년
                </text>
              </g>
            )
          })()}

          {/* 축 레이블 */}
          {axisTicks.map((y) => (
            <g key={y}>
              <line x1={tx(y)} y1={baseY} x2={tx(y)} y2={baseY + 4} stroke={tok.border} strokeWidth="1" />
              <text x={tx(y)} y={baseY + 15} textAnchor="middle" fontSize="9" fill={tok.textTertiary}>{y}년</text>
            </g>
          ))}

          {/* Y축 보조선 + 레이블 (25%, 50%, 75%, 100%) */}
          {[0.25, 0.5, 0.75, 1].map((r) => {
            const cy = MT + (1 - r) * PH
            return (
              <g key={r}>
                <line x1={ML} y1={cy} x2={W - MR} y2={cy} stroke={tok.border} strokeWidth="1" />
                <text x={ML - 3} y={cy + 3} textAnchor="end" fontSize="8" fill={tok.textTertiary}>
                  {Math.round(r * maxCount)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── 인사이트 카드 3개 ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-px" style={{ background: tok.border, borderTop: `1px solid ${tok.border}` }}>
        {/* 준공 연도 */}
        <div className="px-4 py-3.5 text-center" style={{ background: tok.cardBg }}>
          <p className="text-xs mb-1" style={{ color: tok.textTertiary }}>준공 연도</p>
          <p className="text-base font-bold" style={{ color: tok.textPrimary }}>{builtYear}년</p>
          <p className="text-[11px] mt-0.5" style={{ color: tok.textTertiary }}>{currentAge}년 경과</p>
        </div>

        {/* 구역 순위 */}
        <div className="px-4 py-3.5 text-center" style={{ background: tok.cardBg }}>
          <p className="text-xs mb-1" style={{ color: tok.textTertiary }}>구역 내 순위</p>
          <p className="text-base font-bold" style={{ color: gradeColor }}>
            {pct <= 0.5
              ? `신축 상위 ${Math.round(pct * 100)}%`
              : `노후 상위 ${Math.round((1 - pct) * 100)}%`}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: tok.textTertiary }}>
            {ages.length}개 건물 중
          </p>
        </div>

        {/* 비슷한 연식 */}
        <div className="px-4 py-3.5 text-center" style={{ background: tok.cardBg }}>
          <p className="text-xs mb-1" style={{ color: tok.textTertiary }}>비슷한 연식</p>
          <p className="text-base font-bold" style={{ color: tok.textPrimary }}>{similarCount}개</p>
          <p className="text-[11px] mt-0.5" style={{ color: tok.textTertiary }}>±7년 이내 건물</p>
        </div>
      </div>

      {/* ── 평균 대비 요약 ────────────────────────────────────────── */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: tok.cardBgAlt }}>
        <span className="text-xs" style={{ color: tok.textTertiary }}>
          구역 평균 <strong style={{ color: tok.textPrimary }}>{μ.toFixed(1)}년</strong>
          {' · '}표준편차 <strong style={{ color: tok.textPrimary }}>{σ.toFixed(1)}년</strong>
        </span>
        <span className="text-xs font-semibold" style={{ color: gradeColor }}>
          {currentAge > μ
            ? `구역 평균보다 ${Math.round(currentAge - μ)}년 더 오래된 건물`
            : currentAge < μ
            ? `구역 평균보다 ${Math.round(μ - currentAge)}년 더 새 건물`
            : '구역 평균과 연식이 같은 건물'}
        </span>
      </div>
    </div>
  )
}
