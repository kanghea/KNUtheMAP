export interface Department {
  college: string
  name: string
  zone: string   // matches zones.name in DB
}

export const DEPARTMENTS: Department[] = [
  // 공과대학 → 북문
  { college: '공과대학', name: '건축학부',           zone: '북문' },
  { college: '공과대학', name: '토목공학부',          zone: '북문' },
  { college: '공과대학', name: '기계공학부',          zone: '북문' },
  { college: '공과대학', name: '전기공학부',          zone: '북문' },
  { college: '공과대학', name: '화학공학부',          zone: '북문' },
  { college: '공과대학', name: '고분자공학과',        zone: '북문' },
  { college: '공과대학', name: '섬유시스템공학과',    zone: '북문' },
  { college: '공과대학', name: '환경공학과',          zone: '북문' },

  // IT대학 → 북문
  { college: 'IT대학', name: '컴퓨터학부',           zone: '북문' },
  { college: 'IT대학', name: '전자공학부',            zone: '북문' },
  { college: 'IT대학', name: '모바일공학전공',        zone: '북문' },
  { college: 'IT대학', name: '정보보호학과',          zone: '북문' },

  // 자연과학대학 → 북문
  { college: '자연과학대학', name: '수학과',          zone: '북문' },
  { college: '자연과학대학', name: '물리학과',        zone: '북문' },
  { college: '자연과학대학', name: '화학과',          zone: '북문' },
  { college: '자연과학대학', name: '통계학과',        zone: '북문' },
  { college: '자연과학대학', name: '생명과학부',      zone: '북문' },

  // 경상대학 → 쪽문
  { college: '경상대학', name: '경제통상학부',        zone: '쪽문' },
  { college: '경상대학', name: '경영학부',            zone: '쪽문' },
  { college: '경상대학', name: '회계학과',            zone: '쪽문' },

  // 사회과학대학 → 쪽문
  { college: '사회과학대학', name: '사회학과',        zone: '쪽문' },
  { college: '사회과학대학', name: '정치외교학과',    zone: '쪽문' },
  { college: '사회과학대학', name: '심리학과',        zone: '쪽문' },
  { college: '사회과학대학', name: '언론정보학과',    zone: '쪽문' },
  { college: '사회과학대학', name: '지리학과',        zone: '쪽문' },
  { college: '사회과학대학', name: '문헌정보학과',    zone: '쪽문' },

  // 법과대학 → 쪽문
  { college: '법과대학', name: '법학부',              zone: '쪽문' },

  // 인문대학 → 정문
  { college: '인문대학', name: '국어국문학과',        zone: '정문' },
  { college: '인문대학', name: '영어영문학과',        zone: '정문' },
  { college: '인문대학', name: '불어불문학과',        zone: '정문' },
  { college: '인문대학', name: '독어독문학과',        zone: '정문' },
  { college: '인문대학', name: '중어중문학과',        zone: '정문' },
  { college: '인문대학', name: '일어일문학과',        zone: '정문' },
  { college: '인문대학', name: '역사학부',            zone: '정문' },
  { college: '인문대학', name: '철학과',              zone: '정문' },
  { college: '인문대학', name: '고고인류학과',        zone: '정문' },

  // 사범대학 → 정문
  { college: '사범대학', name: '교육학과',            zone: '정문' },
  { college: '사범대학', name: '윤리교육과',          zone: '정문' },
  { college: '사범대학', name: '국어교육과',          zone: '정문' },
  { college: '사범대학', name: '영어교육과',          zone: '정문' },
  { college: '사범대학', name: '수학교육과',          zone: '정문' },
  { college: '사범대학', name: '체육교육과',          zone: '정문' },
  { college: '사범대학', name: '생물교육과',          zone: '정문' },

  // 예술대학 → 정문
  { college: '예술대학', name: '미술학과',            zone: '정문' },
  { college: '예술대학', name: '디자인학과',          zone: '정문' },

  // 농업생명과학대학 → 동문
  { college: '농업생명과학대학', name: '식물생명과학부', zone: '동문' },
  { college: '농업생명과학대학', name: '응용생명과학부', zone: '동문' },
  { college: '농업생명과학대학', name: '농업토목생물산업공학부', zone: '동문' },
  { college: '농업생명과학대학', name: '식품공학부',   zone: '동문' },
  { college: '농업생명과학대학', name: '산림과학조경학부', zone: '동문' },
  { college: '농업생명과학대학', name: '농경제유통학부', zone: '동문' },

  // 수의과대학 → 동문
  { college: '수의과대학', name: '수의학과',          zone: '동문' },

  // 생태환경대학 → 동문
  { college: '생태환경대학', name: '생태환경시스템학부', zone: '동문' },

  // 의과대학 → 칠곡
  { college: '의과대학', name: '의학과',              zone: '칠곡' },

  // 간호대학 → 칠곡
  { college: '간호대학', name: '간호학과',            zone: '칠곡' },

  // 약학대학 → 칠곡
  { college: '약학대학', name: '약학부',              zone: '칠곡' },
]

export function getZoneByDept(deptName: string): string | null {
  return DEPARTMENTS.find((d) => d.name === deptName)?.zone ?? null
}

// 단과대 목록 (중복 제거, 순서 유지)
export const COLLEGES = [...new Set(DEPARTMENTS.map((d) => d.college))]
