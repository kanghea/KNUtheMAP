// 룸메이트 온보딩 상수 및 타입 정의

export interface RoommateProfile {
  // 섹션 1: 기본 정보
  birth_year: number
  student_id: number
  /** 학과 — DB 상으로는 users.dept 에 저장(roommate_profiles 컬럼 아님).
   *  온보딩 입력값 보관용으로 인터페이스에는 둔다. /api/roommate POST 가
   *  분리해 users.dept 로 동기화한다. */
  dept: string
  /** 성별 — roommate_profiles.gender (022 migration). 매칭 필터·동성 우선
   *  정책에 사용. */
  gender: 'male' | 'female'
  living_type: 'dormitory' | 'offcampus'
  dormitory: string | null

  // 섹션 2: 수면 패턴
  bedtime_start: string
  bedtime_end: string
  wakeup_start: string
  wakeup_end: string
  sleep_habits: string[]
  light_sleep: number
  sleep_light: string

  // 섹션 3: 위생·청결
  shower_duration: string
  shower_time: string[]
  hair_wash_time: string[]
  cleaning_freq: string
  cleanliness: number

  // 섹션 4: 생활 환경
  cold_sensitivity: number
  heat_sensitivity: number
  perfume_usage: string
  scent_sensitivity: string
  sound_pref: string
  smoking: string

  // 섹션 5: 습관
  drinking_freq: string
  drinking_amount: string
  gaming: string
  indoor_call: string
  exercise: string
  indoor_eating: string
  bug_tolerance: string

  // 섹션 6: 사회·관계
  sharing: string
  guest_policy: string
  relationship: number
  alarm_usage: string
  alarm_freq: string
  hometown_freq: string
  study_place: string

  // 섹션 7: 마무리
  mbti: string | null
  introduction: string
  wants_to_leave: string
}

export interface SwipeWeights {
  [key: string]: number
}

export const DORMITORIES = [
  '봉사관',
  '진리관',
  '화목관',
  '향토관',
  '첨성관',
  '누리관 (그린돔)',
  '누리관 (레드돔)',
  '보람관',
  '선의관',
  '기독생활센터(기학관)',
  '명의관',
  '기타·모름',
] as const

export const BIRTH_YEARS = Array.from({ length: 10 }, (_, i) => 1999 + i) // 1999~2008
export const STUDENT_IDS = Array.from({ length: 10 }, (_, i) => 17 + i) // 17~26

export const GENDER_OPTIONS = [
  { value: 'male',   label: '남성' },
  { value: 'female', label: '여성' },
] as const

export const BEDTIMES = ['9시', '10시', '11시', '12시', '1시', '2시', '3시', '4시', '그 이후'] as const
export const WAKEUP_TIMES = ['4시', '5시', '6시', '7시', '8시', '9시', '10시', '11시', '그 이후'] as const
export const SLEEP_HABITS_OPTIONS = ['없음', '이갈이', '코골이', '잠꼬대', '몸부림'] as const
export const SLEEP_LIGHT_OPTIONS = [
  { value: 'none', label: '미사용' },
  { value: 'fluorescent', label: '형광등' },
  { value: 'stand', label: '스탠드' },
  { value: 'mood', label: '무드등' },
] as const

export const SHOWER_DURATIONS = ['5분', '10분', '15분', '20분', '25분', '30분', '35분', '40분', '그 이상'] as const
export const TIME_OF_DAY = [
  { value: 'morning', label: '아침' },
  { value: 'lunch', label: '점심' },
  { value: 'evening', label: '저녁' },
] as const

export const CLEANING_FREQ_OPTIONS = [
  { value: 'daily', label: '매일' },
  { value: '3-4week', label: '주 3~4번' },
  { value: '1-2week', label: '주 1~2번' },
] as const

export const PERFUME_OPTIONS = [
  { value: 'none', label: '미사용' },
  { value: 'sometimes', label: '가끔' },
  { value: 'daily', label: '매일' },
] as const

export const SCENT_OPTIONS = [
  { value: 'sensitive', label: '민감' },
  { value: 'none', label: '상관없음' },
] as const

export const SOUND_OPTIONS = [
  { value: 'earphone', label: '이어폰' },
  { value: 'speaker', label: '스피커' },
  { value: 'flexible', label: '유동적' },
] as const

export const SMOKING_OPTIONS = [
  { value: 'smoker', label: '흡연' },
  { value: 'nonsmoker', label: '비흡연' },
] as const

export const DRINKING_FREQ_OPTIONS = [
  { value: 'none', label: '안 마심' },
  { value: 'level1', label: '가끔' },
  { value: 'level2', label: '자주' },
  { value: 'daily', label: '매일' },
] as const

export const DRINKING_AMOUNT_OPTIONS = [
  { value: 'none', label: '못 마심' },
  { value: 'level1', label: '조금' },
  { value: 'level2', label: '보통' },
  { value: 'good', label: '잘 마심' },
] as const

export const FREQUENCY_OPTIONS = [
  { value: 'none', label: '안 함' },
  { value: 'sometimes', label: '가끔 함' },
  { value: 'daily', label: '매일 함' },
] as const

export const INDOOR_CALL_OPTIONS = [
  { value: 'often', label: '많이 함' },
  { value: 'short', label: '짧은 통화만' },
  { value: 'none', label: '안 함' },
] as const

export const INDOOR_EATING_OPTIONS = [
  { value: 'dislike', label: '싫음' },
  { value: 'no_smell', label: '냄새 안 나면' },
  { value: 'snack', label: '과자만' },
  { value: 'any', label: '상관없음' },
] as const

export const BUG_OPTIONS = [
  { value: 'hate', label: '극혐' },
  { value: 'cant_catch', label: '못 잡음' },
  { value: 'can_catch', label: '잡음' },
  { value: 'like', label: '좋아함' },
] as const

export const SHARING_OPTIONS = [
  { value: 'dislike', label: '싫음' },
  { value: 'ask_first', label: '사전 허락' },
  { value: 'any', label: '상관없음' },
] as const

export const GUEST_OPTIONS = [
  { value: 'any', label: '상관없음' },
  { value: 'known_only', label: '나도 아는 사람만' },
  { value: 'ask_first', label: '사전 허락' },
  { value: 'dislike', label: '싫음' },
] as const

export const ALARM_USAGE_OPTIONS = [
  { value: 'yes', label: '함' },
  { value: 'no', label: '안 함' },
] as const

export const ALARM_FREQ_OPTIONS = [
  { value: 'until_wake', label: '깰 때까지' },
  { value: 'once', label: '한 번' },
] as const

export const HOMETOWN_FREQ_OPTIONS = [
  { value: 'weekly', label: '주말마다' },
  { value: 'biweekly', label: '2주' },
  { value: 'monthly', label: '매달' },
  { value: 'sixweeks', label: '한달 반' },
  { value: 'vacation', label: '방학만' },
] as const

export const STUDY_PLACE_OPTIONS = [
  { value: 'dorm', label: '기숙사' },
  { value: 'library', label: '도서관' },
  { value: 'studyroom', label: '자습실' },
  { value: 'flexible', label: '유동적' },
] as const

export const WANTS_TO_LEAVE_OPTIONS = [
  { value: 'yes', label: '있다' },
  { value: 'no', label: '없다' },
] as const

export const MBTI_LETTERS = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const

// 4단계 척도 카드 레이블
export const SCALE_LABELS = {
  light_sleep: ['깊은 잠', '보통', '약간 예민', '매우 예민'],
  cleanliness: ['느긋', '보통', '깔끔', '완벽주의'],
  cold_sensitivity: ['안 추워함', '약간', '추워함', '많이 탐'],
  heat_sensitivity: ['안 더워함', '약간', '더워함', '많이 탐'],
  relationship: ['학교 사람', '아는 사이', '친한 사이', '절친'],
} as const

// 스와이프 비교 쌍
export const SWIPE_PAIRS = [
  {
    left: { key: 'sleep', label: '취침/기상 시간이\n비슷한 사람' },
    right: { key: 'cleanliness', label: '청결 수준이\n비슷한 사람' },
  },
  {
    left: { key: 'smoking', label: '흡연 여부가\n같은 사람' },
    right: { key: 'sleep_habits', label: '잠버릇이\n적은 사람' },
  },
  {
    left: { key: 'temperature', label: '온도 선호가\n비슷한 사람' },
    right: { key: 'sound', label: '소음·소리 습관이\n비슷한 사람' },
  },
  {
    left: { key: 'guest', label: '친구 초대 정책이\n맞는 사람' },
    right: { key: 'sharing', label: '물건 공유 태도가\n맞는 사람' },
  },
  {
    left: { key: 'drinking', label: '음주 빈도가\n비슷한 사람' },
    right: { key: 'alarm', label: '알람 습관이\n비슷한 사람' },
  },
] as const

// localStorage 키
export const ROOMMATE_STORAGE_KEY = 'knuthe_roommate_draft'

export function saveRoommateDraft(profile: Partial<RoommateProfile>, weights: SwipeWeights) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ROOMMATE_STORAGE_KEY, JSON.stringify({ profile, weights }))
}

export function loadRoommateDraft(): { profile: Partial<RoommateProfile>; weights: SwipeWeights } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(ROOMMATE_STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function clearRoommateDraft() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ROOMMATE_STORAGE_KEY)
}
