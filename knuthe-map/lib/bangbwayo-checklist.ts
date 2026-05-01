/**
 * 방봐요 — 표준 체크리스트 마스터 데이터
 *
 * 기획서 §5 의 "표준화" 약속.
 *   · 같은 시간 옵션을 고른 사용자끼리는 항상 같은 항목을 본다.
 *   · 항목 큐레이션은 별도 문서에서 결정. 이 파일은 그 마스터 데이터의 코드 사본.
 *   · 신입생·재학생·자취 경험자 검증을 거친 후 갱신될 v0 안.
 *
 * MVP 는 5분 트랙만 — 다음 사이클에서 15/30분 트랙 추가.
 *
 * 항목 키(`key`)는 DB(`bangbwayo_responses.checklist_item_key`,
 * `bangbwayo_photos.checklist_item_key`)와 동일해야 한다. 키는 변경하지 말고
 * 항목 자체가 바뀔 때는 새 키로 추가하는 방향이 안전하다.
 */

export type Rating = 'good' | 'fair' | 'bad' | 'unknown'

export type TimeOption = '5min' | '15min' | '30min'

export interface ChecklistItem {
  /** DB 저장 키 — 변경 금지. 항목 변경 시 새 키 추가 권장. */
  key:        string

  /** 카드 진행 순서 (셋 단위 동선) */
  order:      number

  /** 카드 헤더 라벨 */
  label:      string

  /** 항목 의도 한 줄 요약 — 카드 상단 부제 */
  intent:     string

  /**
   * 어떻게 확인하는지 — 사용자가 그 자리에서 무엇을 만지고/보아야 하는지.
   * 가이드 카피의 톤은 "친근하지만 잔소리 X" (기획서 §9.2).
   */
  whatToCheck: string

  /**
   * 어떤 사진을 찍어야 하는지 — 데이터 균질화의 핵심 (기획서 §2.4).
   * 같은 부위·같은 각도로 모여야 건물 페이지에 일관된 시각 자료가 쌓인다.
   */
  photoGuide:  string

  /** 이 항목의 4단 척도에 표시할 라벨 — 항목별로 의미를 명확히. */
  ratingLabels: Record<Rating, string>
}

// ─────────────────────────────────────────────────────────────────────────────
// 5분 트랙 (MVP)
//
// 동선: 현관 → 방 가운데 → 책상 자리 → 창가 → (창가에서 듣기) → 화장실
//
// 7항목 — 다단계 폼 sweet spot (3~7) 안에서 가장 신호 높은 항목들.
// "있으면 좋고 없으면 그만"이 아니라 "이걸 모르면 후회한다" 수준.
// ─────────────────────────────────────────────────────────────────────────────

export const CHECKLIST_5MIN: readonly ChecklistItem[] = [
  {
    key:    'first_impression',
    order:  1,
    label:  '첫인상·냄새',
    intent: '들어가자마자 코로 한 번',
    whatToCheck:
      '문 열고 3초 멈춰 깊게 들이쉬어 보세요. 곰팡이·하수구·담배 냄새가 있는지. ' +
      '환기시켜둔 방은 냄새가 가려질 수 있어요.',
    photoGuide:
      '현관에서 방 안쪽을 향해 한 장. (전체 분위기 기록용)',
    ratingLabels: {
      good:    '아무 냄새 없음',
      fair:    '살짝 거슬림',
      bad:     '들어가자마자 인상 찌푸려짐',
      unknown: '잘 모르겠다',
    },
  },
  {
    key:    'light',
    order:  2,
    label:  '채광',
    intent: '천장등 끄고 자연광 보기',
    whatToCheck:
      '방 가운데 서서 천장등을 잠시 끄고 해가 어느 정도 들어오는지 봅니다. ' +
      '오후 늦게 본 방은 다음 날 아침이 어떨지 가늠하기 어려워요.',
    photoGuide:
      '천장등을 끈 상태에서 창문 쪽을 향해 한 장. (현재 자연광량 기록)',
    ratingLabels: {
      good:    '잘 듬',
      fair:    '보통',
      bad:     '거의 안 듬',
      unknown: '잘 모르겠다',
    },
  },
  {
    key:    'outlets',
    order:  3,
    label:  '콘센트',
    intent: '책상·침대 자리에 있는지',
    whatToCheck:
      '책상이 들어갈 자리·침대 머리맡·주방에 콘센트가 있는지. ' +
      '개수보다 위치가 중요해요 — 침대 머리맡에 없으면 매일 문어발.',
    photoGuide:
      '책상 둘 자리의 벽면을 한 장. (콘센트 위치 보이게)',
    ratingLabels: {
      good:    '자리마다 있음',
      fair:    '부족하지만 가능',
      bad:     '문어발 필수',
      unknown: '잘 모르겠다',
    },
  },
  {
    key:    'window',
    order:  4,
    label:  '창문·방충망',
    intent: '잠금쇠·찢김·바깥 풍경',
    whatToCheck:
      '창문을 직접 열어보고 방충망을 손으로 살짝 만져 찢김을 확인. ' +
      '잠금쇠가 있는지, 옆 건물과 거리는 어떤지.',
    photoGuide:
      '창문을 연 상태에서 방충망과 바깥 풍경이 같이 보이게 한 장.',
    ratingLabels: {
      good:    '문제 없음',
      fair:    '약간 신경 쓰임',
      bad:     '찢김 또는 잠금쇠 없음',
      unknown: '잘 모르겠다',
    },
  },
  {
    key:    'noise',
    order:  5,
    label:  '방음',
    intent: '30초 가만히 듣기',
    whatToCheck:
      '창가에서 30초 동안 가만히 들어보세요. 차 소리·옆집 TV·복도 발소리. ' +
      '부동산이 말하는 동안엔 안 들리니 잠깐 양해 구하기.',
    photoGuide:
      '(선택) 방문을 닫은 모습 한 장. — 시각보다 메모로 들린 소리를 기록.',
    ratingLabels: {
      good:    '거의 안 들림',
      fair:    '생활소음 정도',
      bad:     '대화소리까지 들림',
      unknown: '잘 모르겠다',
    },
  },
  {
    key:    'mold',
    order:  6,
    label:  '곰팡이·누수 자국',
    intent: '천장 모서리·창틀 실리콘',
    whatToCheck:
      '화장실 천장 모서리 4곳과 창틀 실리콘을 봅니다. ' +
      '도배 새로 한 방이라도 천장은 못 가리는 경우가 많아요. 검정 점·노란 얼룩이 신호.',
    photoGuide:
      '화장실 천장 모서리 한 곳을 가깝게. (각도: 아래에서 위로)',
    ratingLabels: {
      good:    '전혀 없음',
      fair:    '작은 자국',
      bad:     '여러 곳 또는 넓게',
      unknown: '잘 모르겠다',
    },
  },
  {
    key:    'water_pressure',
    order:  7,
    label:  '수압',
    intent: '샤워기·세면대 동시에',
    whatToCheck:
      '샤워기와 세면대를 동시에 틀어 보세요. 한쪽만 틀면 약한 곳도 셉니다. ' +
      '물 색이 처음에 누런지도 확인.',
    photoGuide:
      '둘 다 틀어놓은 상태에서 세면대 수도꼭지 가깝게 한 장.',
    ratingLabels: {
      good:    '강함',
      fair:    '보통',
      bad:     '샤워기 약해짐',
      unknown: '잘 모르겠다',
    },
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// 시간 옵션 → 체크리스트 매핑
// ─────────────────────────────────────────────────────────────────────────────

export function getChecklistFor(timeOption: TimeOption): readonly ChecklistItem[] {
  switch (timeOption) {
    case '5min':
      return CHECKLIST_5MIN
    case '15min':
    case '30min':
      // MVP 미구현 — 다음 사이클에서 추가. 임시로 5분 트랙 반환하지 않고 빈 배열.
      // (`getChecklistFor` 호출자는 항상 비어있지 않은 배열을 가정하지 않을 것.)
      return []
  }
}

export function findChecklistItem(
  timeOption: TimeOption,
  key: string,
): ChecklistItem | undefined {
  return getChecklistFor(timeOption).find((it) => it.key === key)
}

// ─────────────────────────────────────────────────────────────────────────────
// 시간 옵션 메타 — 시작 화면에서 사용
// ─────────────────────────────────────────────────────────────────────────────

export interface TimeOptionMeta {
  value:       TimeOption
  label:       string         // 사용자에게 보일 라벨
  description: string         // 한 줄 설명
  itemCount:   number         // 항목 수 (참고)
  available:   boolean        // MVP 활성 여부
}

export const TIME_OPTIONS: readonly TimeOptionMeta[] = [
  {
    value:       '5min',
    label:       '5분 — 빠르게 훑기',
    description: '핵심만 7가지',
    itemCount:   CHECKLIST_5MIN.length,
    available:   true,
  },
  {
    value:       '15min',
    label:       '15분 — 꼼꼼히',
    description: '준비 중',
    itemCount:   0,
    available:   false,
  },
  {
    value:       '30min',
    label:       '30분 — 아주 자세히',
    description: '준비 중',
    itemCount:   0,
    available:   false,
  },
] as const
