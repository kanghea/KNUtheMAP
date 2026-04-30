// 룸메이트 홈 히어로용 SVG 일러스트.
//
// 두 룸메이트 캐릭터를 추상적으로 표현 — 머리(원), 어깨(사다리꼴), 사이의 하트.
// 배경엔 별·말풍선·점 패턴으로 풍부함을 더한다.
//
// 다크/라이트 모두에서 동일한 보라 톤(브랜드)으로 보이도록 자체 색을 갖되,
// 부모 컨테이너의 어두운 배경 위에 얹는 것을 전제로 만들었다.

interface Props {
  /** 너비. 부모 컨테이너에 맞춰 자동 stretch */
  width?: number | string
  /** 높이. 기본 168 */
  height?: number | string
}

export function RoommateHeroArt({ width = '100%', height = 168 }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 360 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="두 룸메이트가 마주 보는 일러스트"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* 캐릭터 A — 보라 그라디언트 */}
        <linearGradient id="rmA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6C63FF" />
        </linearGradient>
        {/* 캐릭터 B — 핑크-퍼플 그라디언트 */}
        <linearGradient id="rmB" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#F472B6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        {/* 하트 그라디언트 */}
        <linearGradient id="rmHeart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.7" />
        </linearGradient>
        {/* 부드러운 글로우 */}
        <radialGradient id="rmGlow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%"  stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 배경 점 패턴 */}
      <g opacity="0.45">
        {[
          [40, 40], [86, 28], [320, 36], [340, 88],
          [22, 130], [60, 168], [310, 160], [298, 110],
          [180, 22], [240, 14],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.4 : 1.6}
            fill="#fff" opacity={0.55} />
        ))}
      </g>

      {/* 별 (sparkle) — 4점 별 */}
      <g opacity="0.85">
        <path d="M52 70 L54 64 L56 70 L62 72 L56 74 L54 80 L52 74 L46 72 Z"
          fill="#fff" opacity="0.9" />
        <path d="M306 64 L308 60 L310 64 L314 66 L310 68 L308 72 L306 68 L302 66 Z"
          fill="#fff" opacity="0.8" />
        <path d="M180 168 L182 162 L184 168 L190 170 L184 172 L182 178 L180 172 L174 170 Z"
          fill="#fff" opacity="0.9" />
      </g>

      {/* 중앙 글로우 */}
      <ellipse cx="180" cy="120" rx="120" ry="64" fill="url(#rmGlow)" />

      {/* 캐릭터 A (왼쪽) */}
      <g transform="translate(80, 70)">
        {/* 어깨/몸통 */}
        <path d="M -34 78 Q -34 36 0 36 Q 34 36 34 78 Z"
          fill="url(#rmA)" />
        {/* 머리 */}
        <circle cx="0" cy="20" r="26" fill="url(#rmA)" />
        {/* 눈 */}
        <circle cx="-8"  cy="22" r="2.2" fill="#fff" />
        <circle cx="10"  cy="22" r="2.2" fill="#fff" />
        {/* 입 (작은 미소) */}
        <path d="M -6 30 Q 0 34 6 30" stroke="#fff" strokeWidth="1.6"
          strokeLinecap="round" fill="none" />
        {/* 머리 위 별 액세서리 */}
        <circle cx="-18" cy="2" r="3" fill="#FBBF24" />
      </g>

      {/* 캐릭터 B (오른쪽) */}
      <g transform="translate(280, 70)">
        <path d="M -34 78 Q -34 36 0 36 Q 34 36 34 78 Z"
          fill="url(#rmB)" />
        <circle cx="0" cy="20" r="26" fill="url(#rmB)" />
        <circle cx="-8"  cy="22" r="2.2" fill="#fff" />
        <circle cx="10"  cy="22" r="2.2" fill="#fff" />
        <path d="M -6 30 Q 0 34 6 30" stroke="#fff" strokeWidth="1.6"
          strokeLinecap="round" fill="none" />
        {/* 머리 위 동그라미 액세서리 */}
        <circle cx="18" cy="2" r="3" fill="#34D399" />
      </g>

      {/* 사이의 점선 (연결) */}
      <path d="M 122 100 Q 180 60 238 100"
        stroke="#fff" strokeWidth="1.4" strokeDasharray="3 5"
        opacity="0.6" fill="none" />

      {/* 중앙 하트 */}
      <g transform="translate(180, 86)">
        <path
          d="M 0 12
             C -16 -4, -22 -22, -8 -22
             C -2 -22,  0 -16, 0 -12
             C 0 -16,   2 -22,  8 -22
             C 22 -22, 16 -4,  0 12 Z"
          fill="url(#rmHeart)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.2"
        />
        {/* 하트 하이라이트 */}
        <ellipse cx="-4" cy="-14" rx="3" ry="2" fill="#fff" opacity="0.7" />
      </g>

      {/* 떠있는 작은 하트들 */}
      <g opacity="0.6">
        <path d="M 122 50
                 c -3 -3, -5 -7, 0 -7
                 c 0 0, 0 -4, 4 -4
                 c 4 0, 4 4, 4 4
                 c 5 0, 3 4, 0 7 Z"
          fill="#fff" />
        <path d="M 232 56
                 c -2 -2, -3 -5, 0 -5
                 c 0 0, 0 -3, 3 -3
                 c 3 0, 3 3, 3 3
                 c 3 0, 2 3, 0 5 Z"
          fill="#fff" />
      </g>
    </svg>
  )
}
