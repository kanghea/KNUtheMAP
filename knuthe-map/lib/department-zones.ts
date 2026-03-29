export interface Department {
  college: string
  name: string
  zone: string   // matches zones.name in DB
}

export const DEPARTMENTS: Department[] = [
  // 인문대학 → 정문
  { college: '인문대학', name: '국어국문학과',    zone: '정문' },
  { college: '인문대학', name: '영어영문학과',    zone: '정문' },
  { college: '인문대학', name: '사학과',          zone: '정문' },
  { college: '인문대학', name: '철학과',          zone: '정문' },
  { college: '인문대학', name: '불어불문학과',    zone: '정문' },
  { college: '인문대학', name: '독어독문학과',    zone: '정문' },
  { college: '인문대학', name: '중어중문학과',    zone: '정문' },
  { college: '인문대학', name: '고고인류학과',    zone: '정문' },
  { college: '인문대학', name: '일어일문학과',    zone: '정문' },
  { college: '인문대학', name: '한문학과',        zone: '정문' },
  { college: '인문대학', name: '노어노문학과',    zone: '정문' },

  // 사회과학대학 → 쪽문
  { college: '사회과학대학', name: '정치외교학과',         zone: '쪽문' },
  { college: '사회과학대학', name: '사회학과',             zone: '쪽문' },
  { college: '사회과학대학', name: '지리학과',             zone: '쪽문' },
  { college: '사회과학대학', name: '문헌정보학과',         zone: '쪽문' },
  { college: '사회과학대학', name: '심리학과',             zone: '쪽문' },
  { college: '사회과학대학', name: '사회복지학부',         zone: '쪽문' },
  { college: '사회과학대학', name: '미디어커뮤니케이션학과', zone: '쪽문' },

  // 자연과학대학 → 북문
  { college: '자연과학대학', name: '수학과',          zone: '북문' },
  { college: '자연과학대학', name: '물리학과',        zone: '북문' },
  { college: '자연과학대학', name: '화학과',          zone: '북문' },
  { college: '자연과학대학', name: '생물학과',        zone: '북문' },
  { college: '자연과학대학', name: '생명공학부',      zone: '북문' },
  { college: '자연과학대학', name: '통계학과',        zone: '북문' },
  { college: '자연과학대학', name: '지구시스템과학부', zone: '북문' },

  // 경상대학 → 쪽문
  { college: '경상대학', name: '경제통상학부', zone: '쪽문' },
  { college: '경상대학', name: '경영학부',     zone: '쪽문' },

  // 공과대학 → 북문
  { college: '공과대학', name: '금속재료공학과',    zone: '북문' },
  { college: '공과대학', name: '신소재공학과',      zone: '북문' },
  { college: '공과대학', name: '기계공학부',        zone: '북문' },
  { college: '공과대학', name: '건축학부',          zone: '북문' },
  { college: '공과대학', name: '토목공학과',        zone: '북문' },
  { college: '공과대학', name: '응용화학공학부',    zone: '북문' },
  { college: '공과대학', name: '고분자공학과',      zone: '북문' },
  { college: '공과대학', name: '섬유시스템공학과',  zone: '북문' },
  { college: '공과대학', name: '환경공학과',        zone: '북문' },
  { college: '공과대학', name: '에너지공학부',      zone: '북문' },

  // IT대학 → 북문
  { college: 'IT대학', name: '전자공학부',  zone: '북문' },
  { college: 'IT대학', name: '컴퓨터학부',  zone: '북문' },
  { college: 'IT대학', name: '전기공학과',  zone: '북문' },

  // 농업생명과학대학 → 동문
  { college: '농업생명과학대학', name: '응용생명과학부',          zone: '동문' },
  { college: '농업생명과학대학', name: '식물의학과',              zone: '동문' },
  { college: '농업생명과학대학', name: '식품공학부',              zone: '동문' },
  { college: '농업생명과학대학', name: '산림과학·조경학부',       zone: '동문' },
  { college: '농업생명과학대학', name: '원예과학과',              zone: '동문' },
  { college: '농업생명과학대학', name: '식품자원경제학과',        zone: '동문' },
  { college: '농업생명과학대학', name: '바이오섬유소재학과',      zone: '동문' },
  { college: '농업생명과학대학', name: '농업토목공학과',          zone: '동문' },
  { college: '농업생명과학대학', name: '스마트생물산업기계공학과', zone: '동문' },
  { college: '농업생명과학대학', name: '농산업학과',              zone: '동문' },

  // 예술대학 → 정문
  { college: '예술대학', name: '음악학과',  zone: '정문' },
  { college: '예술대학', name: '국악학과',  zone: '정문' },
  { college: '예술대학', name: '미술학과',  zone: '정문' },
  { college: '예술대학', name: '디자인학과', zone: '정문' },

  // 사범대학 → 정문
  { college: '사범대학', name: '교육학과',          zone: '정문' },
  { college: '사범대학', name: '국어교육과',        zone: '정문' },
  { college: '사범대학', name: '영어교육과',        zone: '정문' },
  { college: '사범대학', name: '유럽어교육학부',    zone: '정문' },
  { college: '사범대학', name: '수학교육과',        zone: '정문' },
  { college: '사범대학', name: '물리교육과',        zone: '정문' },
  { college: '사범대학', name: '화학교육과',        zone: '정문' },
  { college: '사범대학', name: '생물교육과',        zone: '정문' },
  { college: '사범대학', name: '역사교육과',        zone: '정문' },
  { college: '사범대학', name: '지리교육과',        zone: '정문' },
  { college: '사범대학', name: '일반사회교육과',    zone: '정문' },
  { college: '사범대학', name: '윤리교육과',        zone: '정문' },
  { college: '사범대학', name: '지구과학교육과',    zone: '정문' },
  { college: '사범대학', name: '가정교육과',        zone: '정문' },
  { college: '사범대학', name: '정보·컴퓨터교육과', zone: '정문' },
  { college: '사범대학', name: '체육교육과',        zone: '정문' },

  // 수의과대학 → 동문
  { college: '수의과대학', name: '수의예과', zone: '동문' },

  // 생활과학대학 → 정문
  { college: '생활과학대학', name: '아동학부',    zone: '정문' },
  { college: '생활과학대학', name: '의류학과',    zone: '정문' },
  { college: '생활과학대학', name: '식품영양학과', zone: '정문' },

  // 간호대학 → 정문
  { college: '간호대학', name: '간호학과', zone: '정문' },

  // 약학대학 → 북문
  { college: '약학대학', name: '약학과', zone: '북문' },

  // 첨단기술융합대학 → 북문
  { college: '첨단기술융합대학', name: '자율학부1', zone: '북문' },
  { college: '첨단기술융합대학', name: '자율학부2', zone: '북문' },

  // 독립학부
  { college: '독립학부', name: '행정학부',        zone: '쪽문' },
  { college: '독립학부', name: '자율전공학부',    zone: '정문' },
  { college: '독립학부', name: '공학첨단자율학부', zone: '북문' },

  // 의과대학 → 칠곡 (북구 칠곡 별도 캠퍼스)
  { college: '의과대학', name: '의학과', zone: '칠곡' },
]

export function getZoneByDept(deptName: string): string | null {
  return DEPARTMENTS.find((d) => d.name === deptName)?.zone ?? null
}

// 단과대 목록 (중복 제거, 순서 유지)
export const COLLEGES = [...new Set(DEPARTMENTS.map((d) => d.college))]
