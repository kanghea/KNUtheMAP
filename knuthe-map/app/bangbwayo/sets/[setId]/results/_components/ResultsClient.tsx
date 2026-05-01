'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ThemeTokens } from '@/lib/theme-tokens'
import type { Rating } from '@/lib/bangbwayo-checklist'
import type { ResultTrack } from '../page'

// ─────────────────────────────────────────────────────────────────────────────
// 결과물 클라이언트 — 가로 스와이프 + CSS 3D 틸트
//
// 각 트랙이 카드 1장. 자이로 또는 스크롤·드래그 방향으로 카드가 미세하게
// 회전(rotateX/Y) 한다. 깊이 추정은 다음 사이클이지만, perspective 만으로도
// "블렌더 같은 입체감" 의 결을 충분히 낸다.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  tok:    ThemeTokens
  tracks: ResultTrack[]
}

const RATING_TINT: Record<Rating, { dot: string; label: string }> = {
  good:    { dot: 'rgb(34,197,94)',  label: '좋음' },
  fair:    { dot: 'rgb(251,191,36)', label: '보통' },
  bad:     { dot: 'rgb(239,68,68)',  label: '나쁨' },
  unknown: { dot: 'rgba(148,163,184,0.6)', label: '모름' },
}

export default function ResultsClient({ tok, tracks }: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const scrollerRef = useRef<HTMLDivElement>(null)

  // 자이로 — 모바일에서 자연스러운 입체감.
  // iOS Safari 는 사용자 제스처로 권한 요청 필요. 일단 자동 시도, 실패 시 스크롤로만 동작.
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      // gamma: 좌우 -90~90, beta: 앞뒤 -180~180
      const y =  Math.max(-8, Math.min(8, e.gamma / 6))
      const x = -Math.max(-6, Math.min(6, (e.beta - 30) / 8))
      setTilt({ x, y })
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [])

  return (
    <div style={{ marginTop: 8 }}>
      <div
        ref={scrollerRef}
        style={{
          display:           'flex',
          gap:               14,
          padding:           '12px 16px 24px',
          overflowX:         'auto',
          scrollSnapType:    'x mandatory',
          scrollbarWidth:    'none',
          perspective:       '1200px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tracks.map((rt) => (
          <div
            key={rt.track.id}
            style={{
              flex:           '0 0 88%',
              maxWidth:       420,
              scrollSnapAlign:'center',
              transformStyle: 'preserve-3d',
              transform:      `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition:     'transform .18s ease-out',
            }}
          >
            <TrackResultCard tok={tok} rt={rt} />
          </div>
        ))}
      </div>

      {/* 페이지 점 */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
        {tracks.map((rt) => (
          <span key={rt.track.id} style={{
            width: 4, height: 4, borderRadius: 999,
            background: tok.textTertiary, opacity: 0.5,
          }} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 트랙 한 장 카드
// ─────────────────────────────────────────────────────────────────────────────

function TrackResultCard({ tok, rt }: { tok: ThemeTokens; rt: ResultTrack }) {
  const { track, responses, photos, checklist, label: title } = rt

  // 항목 → 응답 맵
  const respByKey: Record<string, Rating | null> = {}
  for (const r of responses) respByKey[r.checklist_item_key] = (r.rating ?? null) as Rating | null

  // 항목 → 첫 사진
  const photoByKey: Record<string, string | null> = {}
  for (const p of photos) {
    if (!p.checklist_item_key) continue
    if (!photoByKey[p.checklist_item_key]) photoByKey[p.checklist_item_key] = p.url
  }
  const firstPhoto = photos[0]?.url ?? null

  return (
    <div style={{
      background:    tok.cardBg,
      border:        `1px solid ${tok.cardBorder}`,
      borderRadius:  20,
      boxShadow:     tok.shadow,
      overflow:      'hidden',
      backfaceVisibility: 'hidden',
    }}>
      {/* 대표 사진 (있으면) */}
      <div style={{
        position: 'relative',
        width:    '100%',
        aspectRatio: '4 / 3',
        background: tok.inputBg,
      }}>
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={title}
            fill
            sizes="(max-width: 520px) 88vw, 420px"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tok.textTertiary, fontSize: 12,
          }}>
            사진 없음
          </div>
        )}
        {track.overall_rating ? (
          <span style={{
            position:    'absolute',
            top:         12, right: 12,
            background:  'rgba(0,0,0,0.5)',
            color:       '#fff',
            padding:     '4px 10px',
            borderRadius: 999,
            fontSize:    11, fontWeight: 700,
          }}>
            ★ {track.overall_rating}
          </span>
        ) : null}
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>
          {title}
        </h3>
        {(track.deposit !== null || track.monthly_rent !== null) && (
          <p style={{ fontSize: 13, fontWeight: 600, color: tok.textSecondary, margin: '4px 0 12px' }}>
            {priceLabel(track)}
          </p>
        )}
        {track.overall_memo && (
          <p style={{ fontSize: 12, color: tok.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>
            {track.overall_memo}
          </p>
        )}

        {/* 항목 평가 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 4 }}>
          {checklist.map((item) => {
            const r = respByKey[item.key] ?? 'unknown'
            const tint = RATING_TINT[r as Rating] ?? RATING_TINT.unknown
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: tok.inputBg,
                  border: `1px solid ${tok.inputBorder}`,
                }}
              >
                <span aria-hidden style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: tint.dot, flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: tok.textPrimary, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: tok.textTertiary, flexShrink: 0 }}>
                  {tint.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function priceLabel(t: { deposit: number | null; monthly_rent: number | null; maintenance: number | null; contract_type: string | null }): string {
  const parts: string[] = []
  if (t.deposit !== null && t.monthly_rent !== null) {
    if (t.contract_type === '전세' || t.contract_type === '매매') {
      parts.push(`${t.contract_type} ${t.monthly_rent.toLocaleString()}만`)
    } else {
      parts.push(`${t.deposit.toLocaleString()}/${t.monthly_rent.toLocaleString()}`)
    }
  } else if (t.deposit !== null) {
    parts.push(`보증금 ${t.deposit.toLocaleString()}만`)
  } else if (t.monthly_rent !== null) {
    parts.push(`${t.contract_type ?? '월세'} ${t.monthly_rent.toLocaleString()}만`)
  }
  if (t.maintenance) parts.push(`관리비 ${t.maintenance}만`)
  return parts.join(' · ')
}

