// 방/매물 타입 정의 — rooms 테이블 스키마 기준

export type ContractType = '월세' | '전세' | '매매'

export type RoomType =
  | '원룸'
  | '투룸'
  | '복층형원룸'
  | '오피스텔'
  | '아파트'
  | '빌라'
  | '단독주택'

export interface RoomOptions {
  induction?:       boolean
  washer?:          boolean
  bed?:             boolean
  refrigerator?:    boolean
  air_conditioner?: boolean
  desk?:            boolean
  closet?:          boolean
  tv?:              boolean
  microwave?:       boolean
  parking?:         boolean
  elevator?:        boolean
  pet_allowed?:     boolean
}

// 세입자 체크리스트 — 관리자가 매물 등록 시 체크
export interface RoomChecklist {
  water_pressure?:     boolean | null  // 수압 확인
  mold?:               boolean | null  // 곰팡이 없음
  window_seal?:        boolean | null  // 창문 단열
  heating?:            boolean | null  // 난방 정상
  internet?:           boolean | null  // 인터넷 설치
  intercom?:           boolean | null  // 인터폰 작동
  cctv?:               boolean | null  // CCTV 설치
  fire_extinguisher?:  boolean | null  // 소화기 비치
}

export interface Room {
  id:             string
  building_id:    string
  contract_type:  ContractType
  deposit:        number          // 보증금 (만원)
  monthly_rent:   number | null   // 월세 (만원). 전세·매매는 null
  area_m2:        number | null   // 전용면적 (㎡)
  floor:          number | null   // 층
  room_type:      RoomType
  description:    string | null
  images:         string[]
  options:        RoomOptions
  characteristics: string[]       // e.g. ['주차가능','반려동물가능','전세사기예방']
  checklist:      RoomChecklist
  contact_phone:  string | null
  contact_name:   string | null
  is_active:      boolean
  created_at:     string
  updated_at:     string
  // JOIN
  buildings?: {
    name:    string | null
    address: string | null
    lat:     number
    lng:     number
    zone:    string | null
  }
}

// ── 레이블 맵 ────────────────────────────────────────────────────────

export const OPTION_META: Record<keyof RoomOptions, { label: string; icon: string }> = {
  induction:       { label: '인덕션',    icon: '🍳' },
  washer:          { label: '세탁기',    icon: '🫧' },
  bed:             { label: '침대',      icon: '🛏️' },
  refrigerator:    { label: '냉장고',   icon: '🧊' },
  air_conditioner: { label: '에어컨',   icon: '❄️' },
  desk:            { label: '책상',      icon: '🪑' },
  closet:          { label: '옷장',      icon: '🪞' },
  tv:              { label: 'TV',         icon: '📺' },
  microwave:       { label: '전자레인지', icon: '📡' },
  parking:         { label: '주차',      icon: '🚗' },
  elevator:        { label: '엘리베이터', icon: '🛗' },
  pet_allowed:     { label: '반려동물',  icon: '🐾' },
}

export const CHECKLIST_META: Record<keyof RoomChecklist, string> = {
  water_pressure:    '수압 확인',
  mold:              '곰팡이 없음',
  window_seal:       '창문 단열',
  heating:           '난방 정상',
  internet:          '인터넷 설치',
  intercom:          '인터폰 작동',
  cctv:              'CCTV 설치',
  fire_extinguisher: '소화기 비치',
}

// ── 가격 포맷 헬퍼 ──────────────────────────────────────────────────

export function formatPrice(room: Room): string {
  if (room.contract_type === '월세') {
    return `월세 ${room.deposit}/${room.monthly_rent}`
  }
  if (room.contract_type === '전세') {
    return `전세 ${room.deposit}만`
  }
  return `매매 ${room.deposit}만`
}

export function formatArea(m2: number | null): string {
  if (!m2) return ''
  const pyeong = Math.round(m2 / 3.306)
  return `${pyeong}평`
}
