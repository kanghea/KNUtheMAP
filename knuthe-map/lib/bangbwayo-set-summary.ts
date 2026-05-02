/**
 * 방봐요 — 셋 카드 요약 데이터 빌더
 *
 * `/bangbwayo` 메인의 "지난 투어" 카드와 마이페이지의 "방봐요로 본 방들" 카드가
 * 같은 시각 정보(첫 사진·시각 라벨·트랙 라벨 미리보기·응답 분포)를 보여준다.
 * 두 곳에서 동일한 결을 유지하도록 한 번에 가공해서 반환.
 *
 * 비공개 버킷이라 사진 signed URL 발급은 service role 이 필요 — 호출자가
 * `service` 클라이언트를 함께 넘긴다 (페이지 layer 에서 이미 만들어 쓰는 것 재사용).
 */

import { formatInTimeZone } from 'date-fns-tz'
import { ko }               from 'date-fns/locale'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatTrackLabel }    from './bangbwayo-track-label'
import { signPathsCached }     from './storage-signed-url-cache'

type SetStatus = 'active' | 'ended' | 'results_generated'

export interface SetCardSummary {
  id:                  string
  /** "5월 1일 (금) 오후 2:30" 또는 사용자 title 우선 */
  label:               string
  status:              SetStatus
  /** 진행 중·저장됨·결과물 완성 */
  statusLabel:         string
  /** 라벨 색조 — 'success'(진행 중), 'accent'(결과물 완성), 'muted'(저장됨) */
  statusTint:          'success' | 'accent' | 'muted'
  /** 트랙 라벨 한 줄 미리보기. "○○빌라 304호" / "○○빌라 304호 외 1개" / null(0개) */
  tracksPreview:       string | null
  trackCount:          number
  /** 5개 슬롯 응답 분포 — 'good'/'fair'/'bad'/'unknown'/'empty' 5개 */
  ratingDots:          ('good' | 'fair' | 'bad' | 'unknown' | 'empty')[]
  /** 첫 트랙의 첫 사진 signed URL — 없으면 null */
  thumbnailUrl:        string | null
}

export interface SetCardInputSet {
  id:                  string
  title:               string | null
  status:              SetStatus
  started_at:          string
  result_generated_at: string | null
}

export interface SetCardInputTrack {
  id:                    string
  set_id:                string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
}

export interface SetCardInputResponse {
  track_id: string
  rating:   'good' | 'fair' | 'bad' | 'unknown' | null
}

export interface SetCardInputPhoto {
  track_id:     string
  storage_path: string
  /** photos 테이블의 created_at — 첫 사진 결정용 */
  created_at:   string
}

export interface SetCardInputBuilding {
  id:      string
  name:    string | null
  address: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// 시각 라벨
// ─────────────────────────────────────────────────────────────────────────────

function setLabelFor(s: SetCardInputSet): string {
  // 사용자가 직접 적은 제목 우선
  const title = s.title?.trim()
  if (title) return title
  // 같은 날 여러 셋을 구분할 수 있도록 시각까지 포함
  // started_at 은 timestamptz(UTC). 서버 런타임이 UTC 라 그대로 format 하면
  // 한국 사용자에게 9시간 어긋난 시각이 보이므로 Asia/Seoul 로 변환해 출력.
  return formatInTimeZone(new Date(s.started_at), 'Asia/Seoul', 'M월 d일 (eee) a h:mm', { locale: ko })
}

// ─────────────────────────────────────────────────────────────────────────────
// 상태 칩 라벨
// ─────────────────────────────────────────────────────────────────────────────

function statusLabelFor(s: SetCardInputSet): { label: string; tint: SetCardSummary['statusTint'] } {
  if (s.status === 'active')           return { label: '진행 중',     tint: 'success' }
  if (s.result_generated_at)           return { label: '결과물 완성', tint: 'accent' }
  return                                      { label: '저장됨',     tint: 'muted'   }
}

// ─────────────────────────────────────────────────────────────────────────────
// 트랙 라벨 미리보기
// ─────────────────────────────────────────────────────────────────────────────

function tracksPreviewFor(
  tracks: SetCardInputTrack[],
  buildingMap: Record<string, SetCardInputBuilding>,
): string | null {
  if (tracks.length === 0) return null

  // order_index 가장 작은 트랙(가장 먼저 본 방)을 대표 라벨로
  const sorted = [...tracks].sort((a, b) => a.order_index - b.order_index)
  const first  = sorted[0]
  const b      = first.building_id ? (buildingMap[first.building_id] ?? null) : null
  const headLabel = formatTrackLabel(first, b)

  if (tracks.length === 1) return headLabel
  return `${headLabel} 외 ${tracks.length - 1}개`
}

// ─────────────────────────────────────────────────────────────────────────────
// 응답 분포 → 5개 도트
// ─────────────────────────────────────────────────────────────────────────────

function ratingDotsFor(responses: SetCardInputResponse[]): SetCardSummary['ratingDots'] {
  if (responses.length === 0) {
    return ['empty', 'empty', 'empty', 'empty', 'empty']
  }

  // good=3, fair=2, bad=1, unknown=0 가중. 평균을 5단계 슬롯으로 나눔.
  // 각 슬롯은 평균 점수 구간에 따라 색을 받는다.
  const counts = { good: 0, fair: 0, bad: 0, unknown: 0 }
  for (const r of responses) {
    if (r.rating === 'good')    counts.good++
    else if (r.rating === 'fair') counts.fair++
    else if (r.rating === 'bad')  counts.bad++
    else                          counts.unknown++
  }
  const total = responses.length

  // 비율을 5칸으로 나눔 — round 누적해서 합 5 보장
  const goodSlots = Math.round((counts.good / total) * 5)
  const fairSlots = Math.round((counts.fair / total) * 5)
  const badSlots  = Math.round((counts.bad  / total) * 5)
  let used = goodSlots + fairSlots + badSlots
  if (used > 5) used = 5
  const unknownSlots = Math.min(5 - used, counts.unknown > 0 ? 5 - used : 0)
  const emptySlots   = 5 - used - unknownSlots

  return [
    ...Array<'good'>(goodSlots).fill('good'),
    ...Array<'fair'>(fairSlots).fill('fair'),
    ...Array<'bad'>(badSlots).fill('bad'),
    ...Array<'unknown'>(unknownSlots).fill('unknown'),
    ...Array<'empty'>(emptySlots).fill('empty'),
  ].slice(0, 5)
}

// ─────────────────────────────────────────────────────────────────────────────
// signed URL 일괄 발급
// ─────────────────────────────────────────────────────────────────────────────

async function signFirstPhotos(
  service: SupabaseClient,
  /** setId → 첫 사진 storage_path */
  firstPhotoPaths: Record<string, string>,
): Promise<Record<string, string>> {
  const paths = Object.values(firstPhotoPaths)
  if (paths.length === 0) return {}

  // Lambda 인스턴스 메모리 LRU 캐시 — 같은 path 가 만료 전이면 storage
  // 왕복 없이 즉시 반환. 메인 페이지를 재방문할수록 비용이 0 에 가까워짐.
  const pathToUrl = await signPathsCached(service, 'bangbwayo-photos', paths)

  const setIdToUrl: Record<string, string> = {}
  for (const [setId, path] of Object.entries(firstPhotoPaths)) {
    const url = pathToUrl[path]
    if (url) setIdToUrl[setId] = url
  }
  return setIdToUrl
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 빌더
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildSetCardsArgs {
  service:    SupabaseClient   // signed URL 발급 (service role 필요)
  sets:       SetCardInputSet[]
  tracks:     SetCardInputTrack[]
  responses:  SetCardInputResponse[]
  photos:     SetCardInputPhoto[]
  buildings:  SetCardInputBuilding[]
}

export async function buildSetCards(args: BuildSetCardsArgs): Promise<SetCardSummary[]> {
  const { service, sets, tracks, responses, photos, buildings } = args

  // 인덱스 맵
  const buildingMap: Record<string, SetCardInputBuilding> = {}
  for (const b of buildings) buildingMap[b.id] = b

  const trackById: Record<string, SetCardInputTrack> = {}
  const tracksBySet: Record<string, SetCardInputTrack[]> = {}
  for (const t of tracks) {
    trackById[t.id] = t
    ;(tracksBySet[t.set_id] ??= []).push(t)
  }

  // 셋 → 응답들
  const responsesBySet: Record<string, SetCardInputResponse[]> = {}
  for (const r of responses) {
    const t = trackById[r.track_id]
    if (!t) continue
    ;(responsesBySet[t.set_id] ??= []).push(r)
  }

  // 셋 → 첫 사진 path (가장 작은 order_index 트랙의 가장 이른 created_at 사진)
  const firstPhotoBySet: Record<string, string> = {}
  for (const s of sets) {
    const setTracks = (tracksBySet[s.id] ?? []).sort((a, b) => a.order_index - b.order_index)
    for (const t of setTracks) {
      const tPhotos = photos
        .filter((p) => p.track_id === t.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
      if (tPhotos.length > 0) {
        firstPhotoBySet[s.id] = tPhotos[0].storage_path
        break
      }
    }
  }

  const setToSignedUrl = await signFirstPhotos(service, firstPhotoBySet)

  return sets.map((s) => {
    const setTracks = tracksBySet[s.id] ?? []
    const setResponses = responsesBySet[s.id] ?? []
    const status = statusLabelFor(s)
    return {
      id:            s.id,
      label:         setLabelFor(s),
      status:        s.status,
      statusLabel:   status.label,
      statusTint:    status.tint,
      tracksPreview: tracksPreviewFor(setTracks, buildingMap),
      trackCount:    setTracks.length,
      ratingDots:    ratingDotsFor(setResponses),
      thumbnailUrl:  setToSignedUrl[s.id] ?? null,
    }
  })
}
