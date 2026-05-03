'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ThemeTokens } from '@/lib/theme-tokens'
import type { Rating } from '@/lib/bangbwayo-checklist'
import { RadarChart } from '@/components/bangbwayo/RadarChart'
import { buildRadarData, colorForTrack } from '@/lib/bangbwayo-radar'
import type { ResultTrack } from '../page'

// ─────────────────────────────────────────────────────────────────────────────
// 결과물 클라이언트 — 가로 스와이프 트랙 카드 + 비교 레이더
//
// 레이아웃:
//   1) 가로 스와이프 영역 (각 트랙 1장)
//   2) 비교 레이더 카드 (스와이프 아래) — 트랙 선택 칩 + N차원 차트
//
// 트랙 선택: 기본 전체 선택. 사용자가 칩을 탭해 토글 — 색상 dot 과 라벨이
// 일체화된 모바일 친화 컨트롤. 선택된 트랙이 2개 미만이면 차트 자체를 숨기고
// 칩만 노출 (다시 추가하라는 시각 신호).
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  tok:    ThemeTokens
  setId:  string
  tracks: ResultTrack[]
  /** 거리 축 계산 기준 문 (학과 주문). null 이면 거리 축 비표시. */
  targetGateName?: string | null
}

const RATING_TINT: Record<Rating, { dot: string; label: string }> = {
  good:    { dot: 'rgb(34,197,94)',  label: '좋음' },
  fair:    { dot: 'rgb(251,191,36)', label: '보통' },
  bad:     { dot: 'rgb(239,68,68)',  label: '나쁨' },
  unknown: { dot: 'rgba(148,163,184,0.6)', label: '모름' },
}

export default function ResultsClient({ tok, setId, tracks, targetGateName = null }: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const scrollerRef = useRef<HTMLDivElement>(null)

  // 트랙 선택 — 기본 전체 선택. 칩 클릭으로 토글.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(tracks.map((t) => t.track.id))
  )
  const toggleTrack = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)
      return next
    })
  }

  // 트랙 → 색 (인덱스 기반, 토글과 무관하게 동일 트랙은 동일 색)
  const colorByTrackId = useMemo(() => {
    const map = new Map<string, string>()
    tracks.forEach((rt, i) => map.set(rt.track.id, colorForTrack(i, tracks.length)))
    return map
  }, [tracks])

  // 레이더 데이터 — 선택된 트랙 ≥ 2 일 때만
  const radar = useMemo(() => {
    if (tracks.length < 2) return null
    const baseChecklist = tracks[0].checklist
    if (baseChecklist.length === 0) return null
    const selected = tracks.filter((t) => selectedIds.has(t.track.id))
    if (selected.length < 2) return null
    return buildRadarData({
      checklist: baseChecklist,
      withDistance: !!targetGateName,
      targetGateName,
      tracks: selected.map((rt) => ({
        label:     rt.label,
        color:     colorByTrackId.get(rt.track.id) ?? '#2563eb',
        responses: rt.responses,
        lat:       rt.lat,
        lng:       rt.lng,
      })),
    })
  }, [tracks, selectedIds, targetGateName, colorByTrackId])

  // 자이로 — 모바일에서 자연스러운 입체감.
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      const y =  Math.max(-8, Math.min(8, e.gamma / 6))
      const x = -Math.max(-6, Math.min(6, (e.beta - 30) / 8))
      setTilt({ x, y })
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [])

  const showCompareCard = tracks.length >= 2

  return (
    <div style={{ marginTop: 8 }}>
      {/* ── 1) 스와이프 영역 ─────────────────────────────────────── */}
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
          <Link
            key={rt.track.id}
            href={`/bangbwayo/sets/${setId}/tracks/${rt.track.id}?step=unit`}
            className="knu-press"
            style={{
              flex:           '0 0 88%',
              maxWidth:       420,
              scrollSnapAlign:'center',
              transformStyle: 'preserve-3d',
              transform:      `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition:     'transform .18s ease-out',
              textDecoration: 'none',
              display:        'block',
            }}
          >
            <TrackResultCard tok={tok} rt={rt} />
          </Link>
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

      {/* ── 2) 비교 레이더 카드 (스와이프 아래) ─────────────────── */}
      {showCompareCard && (
        <section
          aria-label="트랙 비교 레이더"
          style={{
            margin: '16px 16px 0',
            padding: '14px 16px 12px',
            borderRadius: 18,
            background: tok.cardBg,
            border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
              한 눈에 비교
            </h2>
            <span style={{ fontSize: 11, color: tok.textTertiary, fontWeight: 500 }}>
              {selectedIds.size}/{tracks.length}개 방
            </span>
          </div>

          {/* ── 트랙 선택 칩 ─────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
            marginBottom: 10,
          }}>
            {tracks.map((rt) => {
              const active = selectedIds.has(rt.track.id)
              const color  = colorByTrackId.get(rt.track.id) ?? '#2563eb'
              return (
                <button
                  key={rt.track.id}
                  type="button"
                  onClick={() => toggleTrack(rt.track.id)}
                  aria-pressed={active}
                  className="knu-press"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 600,
                    color: active ? tok.textPrimary : tok.textTertiary,
                    background: active ? tok.inputBg : 'transparent',
                    border: `1px solid ${active ? tok.inputBorder : tok.cardBorder}`,
                    cursor: 'pointer',
                    transition: 'opacity .15s, background .15s, color .15s',
                    maxWidth: '60%',
                  }}
                >
                  <span aria-hidden style={{
                    width: 10, height: 10, borderRadius: 999,
                    background: active ? color : 'transparent',
                    border: `1.5px solid ${active ? color : tok.cardBorder}`,
                    boxShadow: active ? `0 0 0 1px ${color}33` : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}>
                    {rt.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── 차트 또는 안내 ──────────────────────────────────── */}
          {radar ? (
            <RadarChart axes={radar.axes} series={radar.series} tok={tok} size={300} />
          ) : (
            <div style={{
              padding: '24px 12px',
              textAlign: 'center',
              fontSize: 12, color: tok.textTertiary,
              background: tok.inputBg,
              borderRadius: 12,
              border: `1px dashed ${tok.cardBorder}`,
            }}>
              비교하려면 위 칩에서 <strong style={{ color: tok.textSecondary }}>두 개 이상</strong>의 방을 선택해 주세요.
            </div>
          )}

          <p style={{
            margin: '8px 0 0', fontSize: 10, color: tok.textTertiary, lineHeight: 1.5,
          }}>
            가장자리에 가까울수록 좋음.
            {targetGateName && (
              <>
                {' '}<strong style={{ color: tok.textSecondary }}>거리</strong>는
                내 학과의 주문(<strong style={{ color: tok.textSecondary }}>{targetGateName}</strong>) 기준
                도보 분 (30분 이상은 0).
              </>
            )}
            {' '}응답·좌표 없는 항목은 중심으로 표시돼요.
          </p>
        </section>
      )}
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
