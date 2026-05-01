'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { ThemeTokens, ThemeMode } from '@/lib/theme-tokens'
import type { ChecklistItem, Rating } from '@/lib/bangbwayo-checklist'
import { tapHaptic, successHaptic } from '@/lib/hooks/useHaptic'

// ─────────────────────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────────────────────

interface Track {
  id:                    string
  set_id:                string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
  time_option:           '5min' | '15min' | '30min'
  deposit:               number | null
  monthly_rent:          number | null
  maintenance:           number | null
  floor:                 number | null
  contract_type:         '월세' | '전세' | '매매' | null
  overall_rating:        number | null
  overall_memo:          string | null
  status:                'draft' | 'saved' | 'closed' | 'included'
}

interface ResponseRow { checklist_item_key: string; rating: string | null; memo: string | null }
interface PhotoRow    { id: string; checklist_item_key: string | null; storage_path: string; url: string | null }
interface BuildingRow { id: string; name: string | null; address: string | null }

interface Props {
  tok:        ThemeTokens
  theme:      ThemeMode
  setId:      string
  track:      Track
  checklist:  readonly ChecklistItem[]
  responses:  ResponseRow[]
  photos:     PhotoRow[]
  building:   BuildingRow | null
}

// 카드 흐름 단계: 호수 → 항목 카드 N개 → 계약 → 마무리
// 호수 입력은 0번째 슬롯, 항목 카드는 1..N, 계약은 N+1, 마무리는 N+2
type StepKind =
  | { kind: 'unit' }
  | { kind: 'item'; index: number }
  | { kind: 'contract' }
  | { kind: 'finish' }

const RATING_ORDER: readonly Rating[] = ['good', 'fair', 'bad', 'unknown']

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────

export default function TrackCardFlow({
  tok, theme, setId, track,
  checklist, responses: initialResponses, photos: initialPhotos, building,
}: Props) {
  const router = useRouter()

  // 로컬 상태 — 자동 저장은 디바운스로 백그라운드.
  const [unitNumber,    setUnitNumber]    = useState(track.unit_number ?? '')
  const [responses,     setResponses]     = useState<Record<string, { rating: Rating | null; memo: string }>>(() => {
    const m: Record<string, { rating: Rating | null; memo: string }> = {}
    for (const r of initialResponses) {
      m[r.checklist_item_key] = {
        rating: (r.rating ?? null) as Rating | null,
        memo:   r.memo ?? '',
      }
    }
    return m
  })
  const [photos,        setPhotos]        = useState<PhotoRow[]>(initialPhotos)
  const [contract,      setContract]      = useState({
    deposit:        track.deposit       ?? '',
    monthly_rent:   track.monthly_rent  ?? '',
    maintenance:    track.maintenance   ?? '',
    floor:          track.floor         ?? '',
    contract_type:  track.contract_type ?? '월세',
  })
  const [overall, setOverall] = useState({
    rating: track.overall_rating ?? 0,
    memo:   track.overall_memo   ?? '',
  })
  const [matchedBuilding, setMatchedBuilding] = useState<BuildingRow | null>(building)

  // 자동 저장 인디케이터
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashSaved = useCallback(() => {
    setSaveState('saved')
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaveState('idle'), 1500)
  }, [])

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }, [])

  // 단계 — 호수 미입력이면 unit 부터, 있으면 첫 항목부터
  const initialStep: StepKind = track.unit_number
    ? { kind: 'item', index: 0 }
    : { kind: 'unit' }
  const [step, setStep] = useState<StepKind>(initialStep)

  const totalItems = checklist.length

  // 진행률 계산 — 호수=0, 항목=1..N, 계약=N+1, 마무리=N+2
  const totalSlots  = 1 + totalItems + 1 + 1
  const currentSlot =
    step.kind === 'unit'     ? 1 :
    step.kind === 'item'     ? 2 + step.index :
    step.kind === 'contract' ? 2 + totalItems :
                               2 + totalItems + 1
  const progress = currentSlot / totalSlots

  // ── 자동 저장 헬퍼 ─────────────────────────────────────────────────────
  const patchTrack = useCallback(async (update: Record<string, unknown>) => {
    setSaveState('saving')
    const res = await fetch(`/api/bangbwayo/sets/${setId}/tracks/${track.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(update),
    })
    if (!res.ok) { setSaveState('error'); return }
    flashSaved()
  }, [setId, track.id, flashSaved])

  const upsertResponse = useCallback(async (
    key: string, rating: Rating | null, memo: string,
  ) => {
    setSaveState('saving')
    const res = await fetch(`/api/bangbwayo/sets/${setId}/tracks/${track.id}/responses`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ checklist_item_key: key, rating, memo: memo || null }),
    })
    if (!res.ok) { setSaveState('error'); return }
    flashSaved()
  }, [setId, track.id, flashSaved])

  // ── 디바운스 자동 저장 — 단계가 바뀔 때 즉시 flush ──────────────────────
  // 마지막 응답·계약·호수 변경을 추적하고 일정 지연 후 PATCH/upsert.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const scheduleSave = useCallback((key: string, fn: () => void, delayMs = 700) => {
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(() => {
      fn()
      delete debounceTimers.current[key]
    }, delayMs)
  }, [])
  const flushAllPending = useCallback(() => {
    for (const k of Object.keys(debounceTimers.current)) {
      clearTimeout(debounceTimers.current[k])
      delete debounceTimers.current[k]
    }
  }, [])

  // ── 단계 이동 ──────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    tapHaptic()
    flushAllPending()
    setStep((s) => {
      if (s.kind === 'unit')    return { kind: 'item', index: 0 }
      if (s.kind === 'item') {
        const next = s.index + 1
        return next < totalItems
          ? { kind: 'item', index: next }
          : { kind: 'contract' }
      }
      if (s.kind === 'contract') return { kind: 'finish' }
      return s
    })
  }, [totalItems, flushAllPending])

  const goPrev = useCallback(() => {
    tapHaptic()
    flushAllPending()
    setStep((s) => {
      if (s.kind === 'finish')   return { kind: 'contract' }
      if (s.kind === 'contract') return { kind: 'item', index: totalItems - 1 }
      if (s.kind === 'item') {
        const prev = s.index - 1
        return prev >= 0
          ? { kind: 'item', index: prev }
          : { kind: 'unit' }
      }
      return s
    })
  }, [totalItems, flushAllPending])

  // ── 호수 변경 ──────────────────────────────────────────────────────────
  const onUnitChange = (v: string) => {
    setUnitNumber(v)
    scheduleSave('unit', () => patchTrack({ unit_number: v.trim() || null }))
  }

  // ── 응답 변경 ──────────────────────────────────────────────────────────
  const setRating = (key: string, rating: Rating) => {
    tapHaptic()
    setResponses((m) => ({ ...m, [key]: { rating, memo: m[key]?.memo ?? '' } }))
    scheduleSave(`r:${key}`, () => upsertResponse(key, rating, responses[key]?.memo ?? ''), 250)
  }
  const setMemo = (key: string, memo: string) => {
    setResponses((m) => ({ ...m, [key]: { rating: m[key]?.rating ?? null, memo } }))
    scheduleSave(`r:${key}`, () => upsertResponse(key, responses[key]?.rating ?? null, memo))
  }

  // ── 계약 변경 ──────────────────────────────────────────────────────────
  const setContractField = (field: keyof typeof contract, value: string | number | null) => {
    setContract((c) => ({ ...c, [field]: value as never }))
    scheduleSave(`contract:${field}`, () => patchTrack({ [field]: value === '' ? null : value }))
  }

  // ── 종합 인상 ──────────────────────────────────────────────────────────
  const setOverallRating = (n: number) => {
    setOverall((o) => ({ ...o, rating: n }))
    scheduleSave('overall_rating', () => patchTrack({ overall_rating: n || null }))
  }
  const setOverallMemo = (memo: string) => {
    setOverall((o) => ({ ...o, memo }))
    scheduleSave('overall_memo', () => patchTrack({ overall_memo: memo || null }))
  }

  // ── 사진 업로드 (낙관적 미리보기) ──────────────────────────────────────
  // 클릭과 동시에 로컬 blob URL 로 미리보기를 띄우고, 서버 응답 도착 시 실제 row 로 교체.
  // 사용자는 "올라가는 중" 빈 화면을 기다리지 않음.
  const [uploading, setUploading] = useState(false)
  const uploadPhoto = useCallback(async (file: File, itemKey: string | null) => {
    tapHaptic()
    setUploading(true)
    setSaveState('saving')

    // 1) 즉시 로컬 미리보기 추가 (낙관적 UI)
    const localId  = `local:${crypto.randomUUID()}`
    const localUrl = URL.createObjectURL(file)
    setPhotos((prev) => [
      ...prev,
      { id: localId, checklist_item_key: itemKey, storage_path: '', url: localUrl },
    ])

    try {
      // 2) 위치 권한 — 받을 수 있으면 좌표 동봉. 거부/실패해도 업로드 진행.
      const coord = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          ()    => resolve(null),
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 60_000 },
        )
      })

      const fd = new FormData()
      fd.append('file', file)
      if (itemKey) fd.append('checklist_item_key', itemKey)
      if (coord) {
        fd.append('exif_lat', String(coord.lat))
        fd.append('exif_lng', String(coord.lng))
      }
      fd.append('exif_taken_at', new Date().toISOString())

      const res = await fetch(
        `/api/bangbwayo/sets/${setId}/tracks/${track.id}/photos`,
        { method: 'POST', body: fd },
      )
      if (!res.ok) {
        // 실패 — 로컬 미리보기 제거
        setPhotos((prev) => prev.filter((p) => p.id !== localId))
        URL.revokeObjectURL(localUrl)
        setSaveState('error')
        return
      }
      const json = await res.json()

      // 3) 로컬 미리보기를 실제 photo 로 교체
      setPhotos((prev) => prev.map((p) =>
        p.id === localId ? { ...json.photo, url: json.photo.url ?? localUrl } : p,
      ))
      // blob URL 은 다음 틱에 해제 (Image 가 아직 잡고 있을 수 있음)
      setTimeout(() => URL.revokeObjectURL(localUrl), 1000)

      if (json.matchedBuilding && !matchedBuilding) {
        setMatchedBuilding({
          id:      json.matchedBuilding.id,
          name:    json.matchedBuilding.name,
          address: json.matchedBuilding.address,
        })
      }
      flashSaved()
    } finally {
      setUploading(false)
    }
  }, [setId, track.id, matchedBuilding, flashSaved])

  // ── 트랙 마무리 ────────────────────────────────────────────────────────
  const finishTrack = useCallback(async () => {
    successHaptic()
    flushAllPending()
    await patchTrack({ status: 'closed' })
    router.push(`/bangbwayo/sets/${setId}`)
    router.refresh()
  }, [flushAllPending, patchTrack, router, setId])

  const photosByKey = useMemo(() => {
    const m: Record<string, PhotoRow[]> = {}
    for (const p of photos) {
      const k = p.checklist_item_key ?? '_'
      m[k] = m[k] ?? []; m[k].push(p)
    }
    return m
  }, [photos])

  // ── 렌더 ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '8px 16px 24px' }}>

      {/* 진행 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 999, background: tok.inputBg, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, Math.round(progress * 100))}%`,
            height: '100%', background: tok.accentColor,
            transition: 'width .2s',
          }} />
        </div>
        <span style={{ fontSize: 11, color: tok.textTertiary, fontWeight: 600 }}>
          {currentSlot} / {totalSlots}
        </span>
        <SaveIndicator tok={tok} state={saveState} />
      </div>

      {/* 매칭된 건물 안내 */}
      {matchedBuilding?.name && (
        <div style={{
          marginBottom: 12, padding: '8px 12px', borderRadius: 10,
          background: tok.successBg, color: tok.successColor,
          fontSize: 12, fontWeight: 600,
        }}>
          📍 {matchedBuilding.name}
        </div>
      )}

      {/* 단계 본문 — `key` 가 단계마다 바뀌어 React 가 새 노드로 인식.
          `knu-card-in` 이 매번 페이드+슬라이드 인 애니메이션 트리거. */}
      <div
        key={
          step.kind === 'item' ? `item:${step.index}` :
          step.kind                                    // unit / contract / finish
        }
        className="knu-card-in"
      >
        {step.kind === 'unit' && (
          <UnitStep
            tok={tok}
            unitNumber={unitNumber}
            onUnitChange={onUnitChange}
            buildingName={matchedBuilding?.name ?? null}
            buildingAddress={matchedBuilding?.address ?? null}
          />
        )}

        {step.kind === 'item' && (
          <ItemCard
            tok={tok}
            theme={theme}
            item={checklist[step.index]}
            response={responses[checklist[step.index].key] ?? { rating: null, memo: '' }}
            photos={photosByKey[checklist[step.index].key] ?? []}
            onRating={(r) => setRating(checklist[step.index].key, r)}
            onMemo={(m)   => setMemo(checklist[step.index].key, m)}
            onUploadPhoto={(file) => uploadPhoto(file, checklist[step.index].key)}
            uploading={uploading}
          />
        )}

        {step.kind === 'contract' && (
          <ContractStep
            tok={tok}
            contract={contract}
            onChange={setContractField}
          />
        )}

        {step.kind === 'finish' && (
          <FinishStep
            tok={tok}
            overall={overall}
            onRating={setOverallRating}
            onMemo={setOverallMemo}
          />
        )}
      </div>

      {/* 하단 네비 */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 18,
      }}>
        <button
          type="button"
          onClick={goPrev}
          disabled={step.kind === 'unit'}
          className={step.kind === 'unit' ? undefined : 'knu-press'}
          style={{
            padding: '12px 16px', borderRadius: 12,
            background: tok.inputBg, color: tok.textSecondary,
            border: `1px solid ${tok.inputBorder}`,
            fontSize: 13, fontWeight: 600,
            cursor: step.kind === 'unit' ? 'default' : 'pointer',
            opacity: step.kind === 'unit' ? 0.4 : 1,
            transition: 'transform .1s',
          }}
        >
          이전
        </button>
        {step.kind !== 'finish' ? (
          <button
            type="button"
            onClick={goNext}
            className="knu-press"
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              background: tok.accentColor, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'transform .1s',
            }}
          >
            {step.kind === 'item' ? '다음' :
             step.kind === 'unit' ? '다음 — 첫 카드' :
             '계약 정보 다음 — 마무리'}
          </button>
        ) : (
          <button
            type="button"
            onClick={finishTrack}
            className="knu-press"
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              background: tok.successColor, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'transform .1s',
            }}
          >
            이 방 다 봤어요
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 자동 저장 인디케이터 — Notion/Primer 결의 조용한 신호
// ─────────────────────────────────────────────────────────────────────────────

function SaveIndicator({ tok, state }: { tok: ThemeTokens; state: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (state === 'idle') return <span style={{ width: 60 }} aria-hidden />

  const text =
    state === 'saving' ? '저장 중…' :
    state === 'saved'  ? '저장됨' :
    '저장 실패'

  const color =
    state === 'error' ? tok.dangerColor : tok.textTertiary

  return (
    <span aria-live="polite" style={{ fontSize: 11, color, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
      {text}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 호수 입력 단계
// ─────────────────────────────────────────────────────────────────────────────

function UnitStep({
  tok, unitNumber, onUnitChange, buildingName, buildingAddress,
}: {
  tok: ThemeTokens
  unitNumber: string
  onUnitChange: (v: string) => void
  buildingName: string | null
  buildingAddress: string | null
}) {
  return (
    <div style={{
      background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
      borderRadius: 18, padding: 22, boxShadow: tok.shadow,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: tok.accentColor,
        margin: 0, letterSpacing: '0.06em',
      }}>
        먼저
      </p>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: tok.textPrimary, margin: '4px 0 12px' }}>
        몇 호인지 알려주세요
      </h2>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: '0 0 16px', lineHeight: 1.5 }}>
        건물은 사진 좌표로 자동 매칭하지만, 호수는 헷갈리지 않게 직접 적어주세요.
      </p>
      <input
        value={unitNumber}
        onChange={(e) => onUnitChange(e.target.value)}
        placeholder="예: 304"
        inputMode="text"
        autoFocus
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          border: `1px solid ${tok.inputBorder}`,
          background: tok.inputBg,
          color: tok.inputColor,
          fontSize: 16, fontWeight: 600,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {(buildingName || buildingAddress) && (
        <p style={{ fontSize: 12, color: tok.textTertiary, margin: '10px 0 0' }}>
          {buildingName ?? buildingAddress}
        </p>
      )}
      <p style={{ fontSize: 11, color: tok.textTertiary, margin: '14px 0 0' }}>
        나중에 채워도 돼요. &lsquo;다음&rsquo;을 누르면 카드 흐름으로 넘어가요.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 항목 카드 — 가이드 + 사진 + 평가 + 메모 통합
// ─────────────────────────────────────────────────────────────────────────────

function ItemCard({
  tok, theme, item, response, photos, onRating, onMemo, onUploadPhoto, uploading,
}: {
  tok: ThemeTokens
  theme: ThemeMode
  item: ChecklistItem
  response: { rating: Rating | null; memo: string }
  photos: PhotoRow[]
  onRating: (r: Rating) => void
  onMemo:   (m: string) => void
  onUploadPhoto: (file: File) => void
  uploading: boolean
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{
      background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
      borderRadius: 18, padding: 22, boxShadow: tok.shadow,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: tok.accentColor,
        margin: 0, letterSpacing: '0.06em',
      }}>
        {item.intent}
      </p>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: tok.textPrimary, margin: '4px 0 12px' }}>
        {item.label}
      </h2>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: '0 0 14px', lineHeight: 1.6 }}>
        {item.whatToCheck}
      </p>

      {/* 사진 */}
      <div style={{
        marginTop: 4,
        padding: 12,
        borderRadius: 12,
        background: tok.inputBg,
        border: `1px dashed ${tok.inputBorder}`,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: tok.textTertiary, margin: '0 0 6px', letterSpacing: '0.04em' }}>
          📷 사진 가이드
        </p>
        <p style={{ fontSize: 12, color: tok.textSecondary, margin: '0 0 10px', lineHeight: 1.5 }}>
          {item.photoGuide}
        </p>

        {photos.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 6, marginBottom: 10,
          }}>
            {photos.map((p) => (
              <div key={p.id} style={{
                position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                background: tok.inputBg,
              }}>
                {p.url && (
                  <Image
                    src={p.url}
                    alt={item.label}
                    fill
                    sizes="80px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 입력 두 개 — 카메라 직접 호출 vs 갤러리 선택을 명확히 분리.
            iOS Safari·Android Chrome 모두 capture 속성으로 카메라가 즉시 열림. */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUploadPhoto(f)
            if (cameraRef.current) cameraRef.current.value = ''
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUploadPhoto(f)
            if (galleryRef.current) galleryRef.current.value = ''
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 12px',
              borderRadius: 10, border: 'none',
              background: tok.accentColor, color: '#fff',
              fontSize: 13, fontWeight: 700,
              cursor: uploading ? 'default' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            카메라
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${tok.inputBorder}`,
              background: tok.cardBg, color: tok.textPrimary,
              fontSize: 13, fontWeight: 700,
              cursor: uploading ? 'default' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            갤러리
          </button>
        </div>
        {uploading && (
          <p style={{ marginTop: 8, fontSize: 11, color: tok.textTertiary, textAlign: 'center' }}>
            올리는 중…
          </p>
        )}
      </div>

      {/* 평가 */}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: tok.textTertiary, margin: '0 0 8px', letterSpacing: '0.04em' }}>
          평가
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {RATING_ORDER.map((r) => {
            const active = response.rating === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => onRating(r)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: active ? `1.5px solid ${tok.accentColor}` : `1px solid ${tok.inputBorder}`,
                  background: active ? tok.accentBg : tok.inputBg,
                  color: active ? tok.accentColor : tok.textPrimary,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all .15s',
                }}
              >
                {item.ratingLabels[r]}
              </button>
            )
          })}
        </div>
      </div>

      {/* 메모 */}
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: tok.textTertiary, margin: '0 0 6px', letterSpacing: '0.04em' }}>
          메모 (선택)
        </p>
        <textarea
          value={response.memo}
          onChange={(e) => onMemo(e.target.value)}
          placeholder="기억나게 적어두세요"
          rows={2}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${tok.inputBorder}`,
            background: tok.inputBg,
            color: tok.inputColor,
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 다크 테마 image fallback */}
      {photos.length === 0 && theme === 'dark' && null}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 계약 조건 단계
// ─────────────────────────────────────────────────────────────────────────────

function ContractStep({
  tok, contract, onChange,
}: {
  tok: ThemeTokens
  contract: { deposit: number | string; monthly_rent: number | string; maintenance: number | string; floor: number | string; contract_type: '월세' | '전세' | '매매' }
  onChange: (field: 'deposit' | 'monthly_rent' | 'maintenance' | 'floor' | 'contract_type', value: string | number | null) => void
}) {
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${tok.inputBorder}`,
    background: tok.inputBg,
    color: tok.inputColor,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: tok.textTertiary,
    margin: '0 0 6px', letterSpacing: '0.04em',
  }
  const numChange = (field: 'deposit' | 'monthly_rent' | 'maintenance' | 'floor', v: string) => {
    if (v === '') onChange(field, null)
    else {
      const n = Number(v.replace(/[^\d-]/g, ''))
      if (Number.isFinite(n)) onChange(field, n)
    }
  }

  return (
    <div style={{
      background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
      borderRadius: 18, padding: 22, boxShadow: tok.shadow,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: tok.accentColor, margin: 0, letterSpacing: '0.06em' }}>
        들은 조건
      </p>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: tok.textPrimary, margin: '4px 0 14px' }}>
        가격은 셋의 일부예요
      </h2>

      {/* 계약 형태 */}
      <div style={{ marginBottom: 14 }}>
        <p style={labelStyle}>계약 형태</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['월세', '전세', '매매'] as const).map((t) => {
            const active = contract.contract_type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange('contract_type', t)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: active ? `1.5px solid ${tok.accentColor}` : `1px solid ${tok.inputBorder}`,
                  background: active ? tok.accentBg : tok.inputBg,
                  color: active ? tok.accentColor : tok.textPrimary,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >{t}</button>
            )
          })}
        </div>
      </div>

      {/* 보증금 / 월세 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <p style={labelStyle}>보증금 (만원)</p>
          <input
            value={contract.deposit === null ? '' : String(contract.deposit)}
            onChange={(e) => numChange('deposit', e.target.value)}
            inputMode="numeric"
            placeholder="1000"
            style={inputStyle}
          />
        </div>
        <div>
          <p style={labelStyle}>
            {contract.contract_type === '전세' || contract.contract_type === '매매' ? '거래가 (만원)' : '월세 (만원)'}
          </p>
          <input
            value={contract.monthly_rent === null ? '' : String(contract.monthly_rent)}
            onChange={(e) => numChange('monthly_rent', e.target.value)}
            inputMode="numeric"
            placeholder="45"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 관리비 / 층 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <p style={labelStyle}>관리비 (만원)</p>
          <input
            value={contract.maintenance === null ? '' : String(contract.maintenance)}
            onChange={(e) => numChange('maintenance', e.target.value)}
            inputMode="numeric"
            placeholder="7"
            style={inputStyle}
          />
        </div>
        <div>
          <p style={labelStyle}>층</p>
          <input
            value={contract.floor === null ? '' : String(contract.floor)}
            onChange={(e) => numChange('floor', e.target.value)}
            inputMode="numeric"
            placeholder="3"
            style={inputStyle}
          />
        </div>
      </div>

      <p style={{ fontSize: 11, color: tok.textTertiary, margin: '14px 0 0', lineHeight: 1.5 }}>
        들은 대로만 적어주세요. 정확하지 않아도 돼요 — 비교에만 쓰여요.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 마무리 — 종합 인상 (선택)
// ─────────────────────────────────────────────────────────────────────────────

function FinishStep({
  tok, overall, onRating, onMemo,
}: {
  tok: ThemeTokens
  overall: { rating: number; memo: string }
  onRating: (n: number) => void
  onMemo:   (m: string) => void
}) {
  return (
    <div style={{
      background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
      borderRadius: 18, padding: 22, boxShadow: tok.shadow,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: tok.accentColor, margin: 0, letterSpacing: '0.06em' }}>
        마지막
      </p>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: tok.textPrimary, margin: '4px 0 14px' }}>
        이 방 어땠어요?
      </h2>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = overall.rating >= n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onRating(overall.rating === n ? 0 : n)}
              aria-label={`별 ${n}`}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 10,
                border: `1px solid ${tok.inputBorder}`,
                background: active ? tok.accentBg : tok.inputBg,
                color: active ? tok.accentColor : tok.textTertiary,
                fontSize: 18, cursor: 'pointer',
              }}
            >
              ★
            </button>
          )
        })}
      </div>

      <textarea
        value={overall.memo}
        onChange={(e) => onMemo(e.target.value)}
        placeholder="한 줄 평 (선택)"
        rows={2}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: `1px solid ${tok.inputBorder}`,
          background: tok.inputBg,
          color: tok.inputColor,
          fontSize: 13,
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
