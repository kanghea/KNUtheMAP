export type ZoneHighlight = {
  icon: string
  label: string
}

export type ZoneData = {
  name: string
  shortName: string
  area: string
  description: string
  highlights: ZoneHighlight[]
  pros: string[]
  cons: string[]
  nearbyFacilities: string[]
  imageColor: string
}

export const ZONE_DATA: Record<string, ZoneData> = {
  '북문구역': {
    name: '북문구역',
    shortName: '북문',
    area: '산격동',
    description: '경북대 북문 인근 산격동 일대. 대학생 상권이 가장 발달한 구역으로 편의시설과 대중교통이 풍부하고 학교까지 도보 5분 이내로 접근 가능하다.',
    highlights: [
      { icon: '🚌', label: '대중교통 편리' },
      { icon: '🏪', label: '상권 발달' },
      { icon: '🍽️', label: '식당·카페 다양' },
      { icon: '🏫', label: '학교 5분 거리' },
    ],
    pros: [
      '버스·지하철 접근성 최고',
      '편의점·마트 풍부',
      '음식점·카페 다양',
      '학교까지 도보 5분 이내',
    ],
    cons: [
      '임대료 상대적으로 높음',
      '번화가 소음',
      '주차 어려움',
    ],
    nearbyFacilities: ['홈플러스', '칠성시장', 'CGV 칠성점', '버스·지하철 정류장'],
    imageColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  },
  '텍문구역': {
    name: '텍문구역',
    shortName: '텍문',
    area: '침산동',
    description: '공과대학·IT대학에 가장 가까운 구역. 조용하고 도보 통학에 최적화된 환경이며 임대료가 상대적으로 저렴하다.',
    highlights: [
      { icon: '🎯', label: '공대·IT대 인접' },
      { icon: '🚶', label: '도보 통학 편리' },
      { icon: '💸', label: '임대료 저렴' },
    ],
    pros: [
      '공대·IT대 도보 5분',
      '조용한 주거환경',
      '임대료 저렴',
    ],
    cons: [
      '편의시설 부족',
      '대중교통 다소 불편',
      '상권 제한적',
    ],
    nearbyFacilities: ['편의점', '학교 구내식당', '공과대학'],
    imageColor: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
  },
  '서문구역': {
    name: '서문구역',
    shortName: '서문',
    area: '대현동',
    description: '경북대 서문 방면의 조용한 주거 구역. 청년문화공간과 소규모 카페들이 생겨나고 있으며 전반적으로 한적한 편이다.',
    highlights: [
      { icon: '🌿', label: '조용한 주거지' },
      { icon: '🎨', label: '청년문화공간' },
      { icon: '☕', label: '소규모 카페' },
    ],
    pros: [
      '조용한 환경',
      '청년문화공간 접근',
      '임대료 저렴',
    ],
    cons: [
      '편의시설 부족',
      '상권 발달 미흡',
      '대중교통 불편',
    ],
    nearbyFacilities: ['청년문화공간', '소규모 카페', '편의점'],
    imageColor: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
  },
  '쪽문구역': {
    name: '쪽문구역',
    shortName: '쪽문',
    area: '대현동',
    description: '경북대 쪽문 인근 카페거리가 형성된 구역. 수의과대학 인접으로 수의대생들이 주로 거주하며 카페와 음식점이 집중되어 있다.',
    highlights: [
      { icon: '☕', label: '카페거리 인접' },
      { icon: '🏥', label: '수의대 인접' },
      { icon: '🌿', label: '조용한 편' },
    ],
    pros: [
      '카페 밀집',
      '수의대 도보 접근',
      '조용한 편',
    ],
    cons: [
      '다른 단과대까지 거리 있음',
      '상권 제한적',
    ],
    nearbyFacilities: ['카페거리', '편의점', '수의과대학'],
    imageColor: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
  },
  '정문구역': {
    name: '정문구역',
    shortName: '정문',
    area: '대현동',
    description: '경북대 정문 인근 자취방 밀집 구역. 대현동 공원·벚꽃길과 가깝고 낭만적인 분위기로 인기가 높다.',
    highlights: [
      { icon: '🌸', label: '공원·벚꽃길' },
      { icon: '🏠', label: '자취방 밀집' },
      { icon: '🌿', label: '조용한 편' },
    ],
    pros: [
      '공원·벚꽃길 인접',
      '자취방 선택지 풍부',
      '편의시설 적당',
      '낭만적 분위기',
    ],
    cons: [
      '임대료 다소 높음',
      '북문 번화가까지 거리 있음',
    ],
    nearbyFacilities: ['대현동 공원', '편의점', '카페', '버스정류장'],
    imageColor: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
  },
  '동문구역': {
    name: '동문구역',
    shortName: '동문',
    area: '복현동',
    description: '경북대 동문 방면 복현동 일대. 법과대학·경상대학·사범대학과 인접하여 해당 단과대 학생들이 주로 거주한다.',
    highlights: [
      { icon: '📚', label: '법대·경상대 인접' },
      { icon: '🏗️', label: '신축 공급 증가' },
      { icon: '🌲', label: '한적한 주거지' },
    ],
    pros: [
      '법대·경상대·사범대 가까움',
      '신축 건물 많음',
      '한적한 환경',
    ],
    cons: [
      '북문까지 거리 있음',
      '상권 제한적',
      '대중교통 다소 불편',
    ],
    nearbyFacilities: ['편의점', '카페', '버스정류장'],
    imageColor: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
  },
  '경북대학교': {
    name: '경북대학교',
    shortName: '캠퍼스',
    area: '북구',
    description: '경북대학교 캠퍼스 내부 구역. 도서관, 학생회관, 각종 편의시설이 있으며 캠퍼스 내 이동에 최적화된 공간이다.',
    highlights: [
      { icon: '🎓', label: '캠퍼스 내부' },
      { icon: '📖', label: '도서관 인접' },
    ],
    pros: ['학교 시설 이용 편리', '캠퍼스 내 이동 편리'],
    cons: ['거주 불가 (상업용 건물만)'],
    nearbyFacilities: ['도서관', '학생회관', '구내식당', '체육관'],
    imageColor: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)',
  },
}
