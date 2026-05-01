// 방봐요 — 셋 카드 한 줄 (메인 "지난 투어" / 마이페이지 "방봐요로 본 방들" 공용).
//
// 시각 구성:
//   [썸네일 56×56] [라벨·트랙 미리보기·도트 5개] [상태칩] [chevron]
//
// `SetCardSummary` 만 받아 그리는 dumb 컴포넌트 — 데이터 빌드는 호출자.

import Link from 'next/link'
import Image from 'next/image'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { IconChevronRight } from '@/components/shared/icons'
import type { SetCardSummary } from '@/lib/bangbwayo-set-summary'

interface Props {
  tok:     ThemeTokens
  summary: SetCardSummary
  href:    string
}

// 도트 색 — 실제 시그널 색이라 다크/라이트 무관 일관 (THEME_TOKENS 토큰 활용)
function dotColor(kind: SetCardSummary['ratingDots'][number], tok: ThemeTokens): string {
  switch (kind) {
    case 'good':    return tok.successColor
    case 'fair':    return tok.accentColor
    case 'bad':     return tok.dangerColor
    case 'unknown': return tok.textTertiary
    case 'empty':   return tok.cardBorder
  }
}

function chipBg(tint: SetCardSummary['statusTint'], tok: ThemeTokens): string {
  if (tint === 'success') return tok.successBg
  if (tint === 'accent')  return tok.accentBg
  return tok.inputBg
}
function chipColor(tint: SetCardSummary['statusTint'], tok: ThemeTokens): string {
  if (tint === 'success') return tok.successColor
  if (tint === 'accent')  return tok.accentColor
  return tok.textSecondary
}

export function SetCardRow({ tok, summary, href }: Props) {
  return (
    <Link
      href={href}
      className="knu-press"
      style={{
        textDecoration: 'none',
        display:        'flex',
        alignItems:     'center',
        gap:            12,
        padding:        '12px 16px',
        transition:     'transform .1s, background .15s',
      }}
    >
      {/* ── 썸네일 ────────────────────────────────────────────── */}
      <div style={{
        width:      56,
        height:     56,
        borderRadius: 12,
        flexShrink: 0,
        overflow:   'hidden',
        position:   'relative',
        background: summary.thumbnailUrl ? tok.inputBg :
          // 사진 없을 때: 셋 ID 끝 글자로 hue 결정 (일관·다양)
          `linear-gradient(135deg, ${tok.accentColor}33 0%, ${tok.accentBg} 100%)`,
        border: `1px solid ${tok.cardBorder}`,
      }}>
        {summary.thumbnailUrl ? (
          <Image
            src={summary.thumbnailUrl}
            alt=""
            fill
            sizes="56px"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          // 사진 없을 때 — 카메라 아이콘 폴백
          <span aria-hidden style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tok.accentColor, opacity: 0.5,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </span>
        )}
      </div>

      {/* ── 본문 ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: tok.textPrimary,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0, flexShrink: 1,
          }}>
            {summary.label}
          </span>
          <span style={{
            flexShrink: 0,
            fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 999,
            background: chipBg(summary.statusTint, tok),
            color:      chipColor(summary.statusTint, tok),
            letterSpacing: '0.02em',
          }}>
            {summary.statusLabel}
          </span>
        </div>

        <p style={{
          fontSize: 12, color: tok.textSecondary, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 6,
        }}>
          {summary.tracksPreview ?? '아직 본 방 없음'}
        </p>

        {/* 도트 5개 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {summary.ratingDots.map((kind, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                width: 6, height: 6, borderRadius: 999,
                background: dotColor(kind, tok),
                opacity: kind === 'empty' ? 0.5 : 1,
              }}
            />
          ))}
          <span style={{
            marginLeft: 4,
            fontSize: 10, color: tok.textTertiary, fontWeight: 600,
          }}>
            {summary.trackCount > 0 ? `방 ${summary.trackCount}개` : ''}
          </span>
        </div>
      </div>

      <IconChevronRight size={14} color={tok.textTertiary} />
    </Link>
  )
}
