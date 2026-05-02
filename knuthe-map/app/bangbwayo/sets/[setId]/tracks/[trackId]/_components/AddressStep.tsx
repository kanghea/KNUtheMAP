'use client'

/**
 * 주소 확인 단계 — 사진 좌표 기반 자동 매칭/역지오코딩 결과를 사용자에게
 * 검증받는 단계.
 *   · 매칭된 건물이 있으면 카드로 보여주고 "다른 건물이에요" 로 빠져나갈 길 제공.
 *   · 그렇지 않으면 (역지오코딩 결과 또는 빈 값으로) 직접 입력 + 자동완성.
 *   · 사진이 없는 경우에도 이 단계가 항상 흐름의 끝에 등장 — 마무리 직전 마지막 검증.
 *
 * `next/dynamic` 으로 lazy-load 되어 unit/item 단계의 첫 hydrate 비용에서
 * 빠진다 (위성 이미지 + 검색 useEffect + suggestions UI 가 별도 chunk).
 */

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ThemeTokens } from '@/lib/theme-tokens'
import type { BuildingRow } from './_types'

/**
 * Naver Cloud Static Map 프록시 URL — 위성 + 빨간 핀 한 점.
 * 인증 키가 서버에서만 붙어야 하므로 `/api/bangbwayo/static-map` 라우트가
 * 대신 Naver 를 호출하고 PNG 만 흘려준다. 같은 좌표·사이즈면 무한 캐시.
 */
function satelliteUrl(lat: number, lng: number, w = 600, h = 280, level = 17): string {
  const qs = new URLSearchParams({
    lat:   String(lat),
    lng:   String(lng),
    w:     String(w),
    h:     String(h),
    level: String(level),
  })
  return `/api/bangbwayo/static-map?${qs.toString()}`
}

function SatellitePreview({
  tok, lat, lng, caption,
}: {
  tok: ThemeTokens
  lat: number
  lng: number
  caption?: string
}) {
  const url = satelliteUrl(lat, lng)
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '600 / 280',
      background: tok.inputBg,
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${tok.cardBorder}`,
      marginBottom: 14,
    }}>
      <Image
        src={url}
        alt="현재 위치의 위성 사진"
        fill
        sizes="(max-width: 520px) 100vw, 520px"
        unoptimized
        style={{ objectFit: 'cover' }}
      />
      {caption && (
        <div style={{
          position: 'absolute', left: 10, bottom: 10,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: 11, fontWeight: 600,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}>
          {caption}
        </div>
      )}
    </div>
  )
}

/**
 * 추천 건물 — `/api/buildings/search` 응답 한 행.
 */
interface BuildingSuggestion {
  id:      string
  name:    string | null
  address: string | null
  lat:     number | null
  lng:     number | null
}

export default function AddressStep({
  tok,
  addressText,
  onAddressChange,
  matchedBuilding,
  onClearMatchedBuilding,
  onPickBuildingSuggestion,
  hasPhotos,
  previewCoord,
}: {
  tok: ThemeTokens
  addressText: string
  onAddressChange: (v: string) => void
  matchedBuilding: BuildingRow | null
  onClearMatchedBuilding: () => void
  onPickBuildingSuggestion: (b: BuildingRow) => void
  hasPhotos: boolean
  previewCoord: { lat: number; lng: number } | null
}) {
  const cardStyle: React.CSSProperties = {
    background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
    borderRadius: 18, padding: 22, boxShadow: tok.shadow,
  }

  // ── 추천 건물 검색 (입력 모드에서만) ─────────────────────────────────────
  // ContractForm 의 `/api/buildings/search` 패턴을 그대로 재사용 — 같은
  // buildings 테이블에서 이름/주소 ilike 매칭. 인증 없이 호출 가능.
  const [suggestions, setSuggestions] = useState<BuildingSuggestion[]>([])
  const [searching,   setSearching]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 매칭된 건물이 없는 입력 모드에서만 자동완성 동작.
  const inputMode = !matchedBuilding
  const trimmedQuery = addressText.trim()

  useEffect(() => {
    if (!inputMode || trimmedQuery.length < 2) {
      setSuggestions([])
      setSearching(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/buildings/search?q=${encodeURIComponent(trimmedQuery)}&limit=6`)
        if (res.ok) {
          const data = await res.json()
          const arr: BuildingSuggestion[] = Array.isArray(data)
            ? data
            : (data?.buildings ?? [])
          setSuggestions(arr.slice(0, 6))
        } else {
          setSuggestions([])
        }
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [trimmedQuery, inputMode])

  const handlePickSuggestion = (s: BuildingSuggestion) => {
    setSuggestions([])
    onPickBuildingSuggestion({
      id:      s.id,
      name:    s.name,
      address: s.address,
      lat:     s.lat,
      lng:     s.lng,
    })
  }

  if (matchedBuilding) {
    return (
      <div style={cardStyle}>
        {previewCoord && (
          <SatellitePreview
            tok={tok}
            lat={previewCoord.lat}
            lng={previewCoord.lng}
            caption="사진 위치 기준"
          />
        )}
        <p style={{ fontSize: 11, fontWeight: 700, color: tok.accentColor, margin: 0, letterSpacing: '0.06em' }}>
          주소 확인
        </p>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: tok.textPrimary, margin: '4px 0 12px' }}>
          이 건물이 맞나요?
        </h2>
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: tok.successBg, color: tok.successColor,
          marginBottom: 12,
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
            📍 {matchedBuilding.name ?? '이름 미상'}
          </p>
          {matchedBuilding.address && (
            <p style={{ fontSize: 12, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              {matchedBuilding.address}
            </p>
          )}
        </div>
        <p style={{ fontSize: 13, color: tok.textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
          사진 좌표로 자동 매칭된 건물이에요. 위성 사진과 비교해 맞으면 그대로 다음으로.
        </p>
        <button
          type="button"
          onClick={onClearMatchedBuilding}
          className="knu-press"
          style={{
            display: 'block', width: '100%',
            padding: '11px 12px', borderRadius: 10,
            border: `1px solid ${tok.inputBorder}`,
            background: tok.inputBg, color: tok.textPrimary,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'transform .1s',
          }}
        >
          이 건물이 아니에요 — 직접 입력
        </button>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {previewCoord && (
        <SatellitePreview
          tok={tok}
          lat={previewCoord.lat}
          lng={previewCoord.lng}
          caption="사진 위치 기준"
        />
      )}
      <p style={{ fontSize: 11, fontWeight: 700, color: tok.accentColor, margin: 0, letterSpacing: '0.06em' }}>
        주소 확인
      </p>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: tok.textPrimary, margin: '4px 0 12px' }}>
        이 주소가 맞나요?
      </h2>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
        {addressText.trim()
          ? previewCoord
            ? '사진 위치로 추정한 주소예요. 위성 사진과 비교해 다르면 수정해 주세요.'
            : '추정한 주소예요. 다르면 수정해 주세요.'
          : hasPhotos
            ? '사진에서 위치를 찾지 못했어요. 도로명주소를 직접 입력해 주세요.'
            : '사진이 없어 자동으로 채울 수 없어요. 도로명주소를 직접 입력해 주세요.'}
      </p>
      <input
        type="text"
        value={addressText}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="건물명 또는 도로명/지번 주소"
        autoComplete="off"
        inputMode="text"
        style={{
          width: '100%',
          padding: '12px 14px', borderRadius: 10,
          border: `1px solid ${tok.inputBorder}`,
          background: tok.inputBg, color: tok.inputColor,
          // iOS Safari 가 16px 미만 input 포커스 시 자동 확대 — 16px 로 차단.
          fontSize: 16, outline: 'none',
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />

      {/* ── 추천 건물 ───────────────────────────────────────────
          타이핑 후 280ms 디바운스 — buildings 테이블 ilike 매칭 결과.
          탭하면 building_id 까지 연결되어 매칭 카드로 전환된다. */}
      {searching && trimmedQuery.length >= 2 && suggestions.length === 0 && (
        <p style={{ fontSize: 12, color: tok.textTertiary, margin: '8px 0 0' }}>
          검색 중…
        </p>
      )}
      {suggestions.length > 0 && (
        <div style={{
          marginTop: 8,
          border: `1px solid ${tok.cardBorder}`,
          borderRadius: 12,
          overflow: 'hidden',
          background: tok.inputBg,
        }}>
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handlePickSuggestion(s)}
              className="knu-press"
              style={{
                width: '100%', textAlign: 'left',
                padding: '12px 14px',
                background: 'none', border: 'none',
                borderBottom: i < suggestions.length - 1 ? `1px solid ${tok.cardBorder}` : 'none',
                cursor: 'pointer', display: 'block',
                transition: 'transform .1s',
              }}
            >
              <div style={{
                fontSize: 14, fontWeight: 600, color: tok.textPrimary,
                lineHeight: 1.3,
              }}>
                {s.name?.trim() || '(이름 없음)'}
              </div>
              {s.address && (
                <div style={{
                  fontSize: 12, color: tok.textTertiary,
                  marginTop: 2, lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.address}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: tok.textTertiary, margin: '10px 0 0', lineHeight: 1.5 }}>
        주소는 결과물 카드에 함께 보여요. 비워둬도 괜찮아요.
      </p>
    </div>
  )
}
