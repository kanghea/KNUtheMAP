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
  imageUrl?: string   // 실제 구역 사진 URL (없으면 imageColor 그라디언트 사용)
  colleges: string[]  // 해당 구역과 가까운 단과대 목록
}

export const ZONE_DATA: Record<string, ZoneData> = {
  '북문': {
    name: '북문',
    shortName: '북문',
    area: '산격동',
    description: '경북대 북문 인근 산격동 일대. 인문대·농생대·예술대와 가까우며 대학생 상권이 가장 발달한 구역이다. 버스·지하철 접근성이 뛰어나고 편의시설이 밀집해 있어 학교 생활의 중심지 역할을 한다.',
    highlights: [
      { icon: '🚌', label: '대중교통 편리' },
      { icon: '🏪', label: '상권 발달' },
      { icon: '🍽️', label: '식당·카페 다양' },
      { icon: '🏫', label: '인문대·농생대 인접' },
    ],
    pros: [
      '버스·지하철 접근성 최고',
      '편의점·마트·음식점 풍부',
      '인문대·농생대·예술대 도보 접근',
      '생활 인프라 최상',
    ],
    cons: [
      '임대료 상대적으로 높음',
      '번화가 소음',
      '주차 어려움',
    ],
    nearbyFacilities: ['홈플러스 칠성점', '칠성시장', 'CGV 칠성점', '지하철 3호선 칠성시장역', '버스정류장'],
    imageColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Kyungpook_National_University_North_Gate_bus_stop_on_February_20th,_2016.jpg',
    colleges: ['인문대학', '농업생명과학대학', '예술대학'],
  },
  '텍문': {
    name: '텍문',
    shortName: '텍문',
    area: '침산동',
    description: '경북대 텍문(택문) 인근 침산동 일대. 사범대학·약학대학·간호대학과 가장 가까운 구역으로, 조용한 주거환경과 저렴한 임대료가 특징이다. 캠퍼스 서북쪽에 위치해 도보 통학이 편리하다.',
    highlights: [
      { icon: '📚', label: '사범대·약대·간호대 인접' },
      { icon: '🚶', label: '도보 통학 편리' },
      { icon: '💸', label: '임대료 저렴' },
      { icon: '🌙', label: '조용한 주거지' },
    ],
    pros: [
      '사범대·약대·간호대 도보 5분',
      '조용한 주거환경',
      '임대료 저렴',
      '한적한 분위기',
    ],
    cons: [
      '편의시설 부족',
      '대중교통 다소 불편',
      '상권 제한적',
    ],
    nearbyFacilities: ['편의점', '학교 구내식당', '사범대학', '약학대학', '간호대학'],
    imageColor: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Kyungpook_National_University_College_of_Nursing.JPG',
    colleges: ['사범대학', '약학대학', '간호대학'],
  },
  '서문': {
    name: '서문',
    shortName: '서문',
    area: '대현동',
    description: '경북대 서문 방면의 조용한 주거 구역. 자연과학대학과 가장 가까우며 수영장문 이용이 편리하다. 대현동 서쪽에 위치해 한적한 편이며 임대료가 저렴하고 소규모 카페와 식당이 있다.',
    highlights: [
      { icon: '🔬', label: '자연과학대 인접' },
      { icon: '🌿', label: '조용한 주거지' },
      { icon: '💸', label: '임대료 저렴' },
    ],
    pros: [
      '자연과학대 도보 접근',
      '수영장문·서문 모두 가까움',
      '조용한 환경',
      '임대료 저렴',
    ],
    cons: [
      '편의시설 부족',
      '상권 발달 미흡',
      '대중교통 불편',
    ],
    nearbyFacilities: ['소규모 카페', '편의점', '자연과학대학', '경북대 수영장'],
    imageColor: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Snowy_landscape_in_Welfare_Building,_KNU.jpg',
    colleges: ['자연과학대학'],
  },
  '쪽문': {
    name: '쪽문',
    shortName: '쪽문',
    area: '대현동',
    description: '경북대 쪽문 인근 대현동 일대. 공과대학·IT대학과 가장 가까우며 쪽문 앞 카페거리가 형성된 구역이다. 카페·음식점이 집중되어 있고 뉴쪽문까지 이용 가능해 공대·IT대 학생들이 주로 거주한다.',
    highlights: [
      { icon: '⚙️', label: '공대·IT대 인접' },
      { icon: '☕', label: '카페거리 인접' },
      { icon: '🌿', label: '조용한 편' },
    ],
    pros: [
      '공대·IT대 도보 5~10분',
      '쪽문 앞 카페거리',
      '뉴쪽문 이용 가능',
      '조용한 편',
    ],
    cons: [
      '다른 단과대까지 거리 있음',
      '상권 다소 제한적',
    ],
    nearbyFacilities: ['쪽문 카페거리', '편의점', '공과대학', 'IT대학'],
    imageColor: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Geunmanjeong_in_KNU_on_March_22nd,_2016.jpg',
    colleges: ['공과대학', 'IT대학'],
  },
  '정문': {
    name: '정문',
    shortName: '정문',
    area: '대현동',
    description: '경북대 정문 인근 자취방 밀집 구역. 수의과대학과 가장 가깝고 대현동 공원·벚꽃길과 인접해 낭만적인 분위기로 인기가 높다. 정문 주변에 자취방 선택지가 풍부하며 각종 편의시설도 갖춰져 있다.',
    highlights: [
      { icon: '🌸', label: '공원·벚꽃길' },
      { icon: '🐾', label: '수의대 인접' },
      { icon: '🏠', label: '자취방 밀집' },
    ],
    pros: [
      '공원·벚꽃길 인접',
      '수의대 도보 접근',
      '자취방 선택지 풍부',
      '편의시설 적당',
    ],
    cons: [
      '임대료 다소 높음',
      '북문 번화가까지 거리 있음',
    ],
    nearbyFacilities: ['대현동 공원', '편의점', '카페', '버스정류장', '수의과대학'],
    imageColor: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Ilcheongdam_pond_in_KNU_on_April_9th,_2016.jpg',
    colleges: ['수의과대학'],
  },
  '동문': {
    name: '동문',
    shortName: '동문',
    area: '복현동',
    description: '경북대 동문·나리문 방면 복현동 일대. 경상대학·사회과학대학·생활과학대학·행정학부와 인접하여 해당 단과대 학생들이 주로 거주한다. 신축 건물 공급이 늘고 있으며 나리문까지 활용 가능하다.',
    highlights: [
      { icon: '📊', label: '경상대·사회과학대 인접' },
      { icon: '🏗️', label: '신축 공급 증가' },
      { icon: '🌲', label: '한적한 주거지' },
    ],
    pros: [
      '경상대·사회과학대·생활과학대 가까움',
      '동문·나리문 모두 이용 가능',
      '신축 건물 많음',
      '한적한 환경',
    ],
    cons: [
      '북문까지 거리 있음',
      '상권 제한적',
      '대중교통 다소 불편',
    ],
    nearbyFacilities: ['편의점', '카페', '버스정류장', '경상대학', '사회과학대학'],
    imageColor: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Global_Plaza_and_Main_Library_on_March_30th,_2016.jpg',
    colleges: ['경상대학', '사회과학대학', '생활과학대학', '행정학부'],
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
    colleges: [],
  },
}
