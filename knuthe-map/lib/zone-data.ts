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
  '북문': {
    name: '북문',
    shortName: '북문',
    area: '산격동',
    description: '경북대 북문 인근 산격동 일대. 인문대·예술대·농대 학생들이 주로 거주하며, 경북대 주변에서 상권과 대중교통이 가장 발달한 구역이다. 카페·음식점·편의점이 즐비하고 버스·지하철 접근성이 뛰어나다.',
    highlights: [
      { icon: '🚌', label: '대중교통 최고' },
      { icon: '🏪', label: '상권 가장 발달' },
      { icon: '🍽️', label: '식당·카페 다양' },
      { icon: '🎨', label: '인문대·예술대 인접' },
    ],
    pros: [
      '버스·지하철 접근성 최고',
      '편의점·마트·음식점 풍부',
      '인문대·예술대·농대 도보 접근',
      '생활 편의시설 집중',
    ],
    cons: [
      '임대료 상대적으로 높음',
      '번화가 소음',
      '주차 어려움',
    ],
    nearbyFacilities: ['홈플러스', '칠성시장', 'CGV 칠성점', '버스·지하철 정류장'],
    imageColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  },
  '텍문': {
    name: '텍문',
    shortName: '텍문',
    area: '침산동',
    description: '경북대 텍문(택문) 인근 침산동 일대. 기숙사(참샘·향토·누리관)와 가깝고 조용한 주거환경이 특징이다. 북문·서문 대비 임대료가 저렴하며 차량 이용자에게 주차 편의성이 높다.',
    highlights: [
      { icon: '🏠', label: '조용한 주거환경' },
      { icon: '💸', label: '임대료 저렴' },
      { icon: '🏫', label: '기숙사 인근' },
      { icon: '🚗', label: '주차 용이' },
    ],
    pros: [
      '임대료 저렴',
      '조용한 주거환경',
      '기숙사·캠퍼스 도보 접근',
      '주차 편리',
    ],
    cons: [
      '편의시설 부족',
      '대중교통 다소 불편',
      '상권 제한적',
    ],
    nearbyFacilities: ['편의점', '경북대 기숙사', '구내식당'],
    imageColor: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
  },
  '서문': {
    name: '서문',
    shortName: '서문',
    area: '대현동',
    description: '경북대 서문 방면 대현동 일대. 공과대학·IT대학·약학대학·첨단기술융합대학이 인접해 공학 계열 학생들이 주로 거주한다. 서문~일청담 방면으로 자취방이 분포하며, 누리관 옆 약학대가 가깝다.',
    highlights: [
      { icon: '⚙️', label: '공대·IT대 인접' },
      { icon: '💊', label: '약학대 인근' },
      { icon: '🌿', label: '조용한 주거지' },
      { icon: '🔬', label: '첨단기술융합대 인접' },
    ],
    pros: [
      '공대·IT대·약대 도보 접근',
      '조용한 주거환경',
      '임대료 상대적으로 저렴',
    ],
    cons: [
      '편의시설 상대적으로 부족',
      '북문 상권까지 거리 있음',
      '대중교통 다소 불편',
    ],
    nearbyFacilities: ['일청담', '누리관', '편의점', '버스정류장'],
    imageColor: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
  },
  '쪽문': {
    name: '쪽문',
    shortName: '쪽문',
    area: '대현동',
    description: '경북대 쪽문 인근 카페거리가 형성된 구역. 코펜하겐 커피 등 개성 있는 카페들이 밀집해 학생들의 인기 장소로 자리잡았다. 조용하면서도 도심 접근성이 좋은 편이다.',
    highlights: [
      { icon: '☕', label: '카페거리 인접' },
      { icon: '🌿', label: '조용한 편' },
      { icon: '🏙️', label: '도심 접근 용이' },
    ],
    pros: [
      '개성 있는 카페 밀집',
      '조용한 편',
      '도심 접근 편리',
    ],
    cons: [
      '주요 단과대까지 거리 있음',
      '상권 다소 제한적',
    ],
    nearbyFacilities: ['카페거리', '편의점', '버스정류장'],
    imageColor: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
  },
  '정문': {
    name: '정문',
    shortName: '정문',
    area: '대현동',
    description: '경북대 정문 인근 자취방 밀집 구역. 자연과학대학과 수의과대학(그린캠퍼스)이 가깝고, 본관·중앙도서관·박물관 등 캠퍼스 중심 시설과 인접해 있다. 대현동 공원·벚꽃길 덕분에 봄철 낭만적인 분위기로 인기가 높다.',
    highlights: [
      { icon: '🔬', label: '자연대·수의대 인접' },
      { icon: '🌸', label: '공원·벚꽃길' },
      { icon: '🏠', label: '자취방 밀집' },
      { icon: '🏛️', label: '본관·도서관 인근' },
    ],
    pros: [
      '자연대·수의대 도보 접근',
      '공원·벚꽃길 인접',
      '자취방 선택지 풍부',
      '캠퍼스 중심 시설 가까움',
    ],
    cons: [
      '임대료 다소 높음',
      '북문 번화가까지 거리 있음',
    ],
    nearbyFacilities: ['대현동 공원', '편의점', '카페', '버스정류장'],
    imageColor: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
  },
  '동문': {
    name: '동문',
    shortName: '동문',
    area: '복현동',
    description: '경북대 동문 방면 복현동 일대. 경상대학·사회과학대학·사범대학·생활과학대학이 인접해 해당 단과대 학생들이 주로 거주한다. 신축 건물 공급이 늘고 있으며 복지관(학생식당·서점)도 이 구역에 위치한다.',
    highlights: [
      { icon: '📚', label: '경상·사범대 인접' },
      { icon: '🏗️', label: '신축 공급 증가' },
      { icon: '🌲', label: '한적한 주거지' },
      { icon: '🍽️', label: '복지관·학생식당 인근' },
    ],
    pros: [
      '경상대·사범대·사회과학대 가까움',
      '신축 건물 많음',
      '한적한 환경',
      '복지관·학생식당 도보 접근',
    ],
    cons: [
      '북문까지 거리 있음',
      '상권 제한적',
      '대중교통 다소 불편',
    ],
    nearbyFacilities: ['복지관(학생식당·서점)', '편의점', '카페', '버스정류장'],
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
