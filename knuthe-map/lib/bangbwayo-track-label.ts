/**
 * 방봐요 — 트랙 라벨 생성 헬퍼
 *
 * 트랙(방 한 개)의 시각적 식별자를 만든다. 우선순위:
 *   1. 건물명 + 호수    — "○○빌라 304호" (가장 명확)
 *   2. 건물명만         — "○○빌라"     (호수 미입력)
 *   3. 짧은 주소 + 호수 — "복현로 12 304호" (자동 매칭 실패 시 수동 주소)
 *   4. 짧은 주소만      — "복현로 12"
 *   5. 호수만           — "304호"      (건물 정보 전무)
 *   6. 주소 없음        — "방 N"        (마지막 폴백)
 *
 * 자체 피드백:
 *   · 사용자에게 "방 1, 방 2"로 보이는 건 정보가 0일 때만이어야 함.
 *   · 짧은 주소: 도로명주소의 마지막 두 토큰 (`buildings.address` 패턴 따름).
 */

export interface TrackLabelInput {
  unit_number:           string | null
  building_address_text: string | null
  order_index:           number
}

export interface BuildingLabelInput {
  name:    string | null
  address: string | null
}

function shortAddress(addr: string | null | undefined): string | null {
  if (!addr) return null
  const trimmed = addr.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\s+/)
  return parts.length >= 2 ? parts.slice(-2).join(' ') : trimmed
}

/**
 * 트랙의 표시용 라벨.
 *
 * @param t        트랙 (`unit_number`, `building_address_text`, `order_index`)
 * @param building 매칭된 건물 (`name`, `address`) — 없으면 null
 */
export function formatTrackLabel(
  t: TrackLabelInput,
  building: BuildingLabelInput | null,
): string {
  const buildingPart =
    building?.name?.trim() ||
    shortAddress(building?.address) ||
    shortAddress(t.building_address_text) ||
    null

  const unit = t.unit_number?.trim() || null

  if (buildingPart && unit) return `${buildingPart} ${unit}호`
  if (buildingPart)         return buildingPart
  if (unit)                 return `${unit}호`
  return `방 ${t.order_index + 1}`
}
