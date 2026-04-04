'use client'

import { type RoommateProfile, DORMITORIES, BIRTH_YEARS, STUDENT_IDS, BEDTIMES, WAKEUP_TIMES, SLEEP_HABITS_OPTIONS, SLEEP_LIGHT_OPTIONS, SHOWER_DURATIONS, TIME_OF_DAY, CLEANING_FREQ_OPTIONS, PERFUME_OPTIONS, SCENT_OPTIONS, SOUND_OPTIONS, SMOKING_OPTIONS, DRINKING_FREQ_OPTIONS, DRINKING_AMOUNT_OPTIONS, FREQUENCY_OPTIONS, INDOOR_CALL_OPTIONS, INDOOR_EATING_OPTIONS, BUG_OPTIONS, SHARING_OPTIONS, GUEST_OPTIONS, ALARM_USAGE_OPTIONS, ALARM_FREQ_OPTIONS, HOMETOWN_FREQ_OPTIONS, STUDY_PLACE_OPTIONS, WANTS_TO_LEAVE_OPTIONS, MBTI_LETTERS } from '@/lib/roommate-constants'
import { useState } from 'react'

interface Tok {
  bg: string; surface: string; textPrimary: string; textSecondary: string; textTertiary: string
  border: string; accent: string; cardBg: string; cardBorder: string
  cardActiveBg: string; cardActiveBorder: string; cardActiveGlow: string
}

interface Props {
  section: number  // 0~6
  profile: Partial<RoommateProfile>
  onChange: (updates: Partial<RoommateProfile>) => void
  tok: Tok
}

// ── 공통 위젯 ──

function ChipGroup({ options, value, onChange, tok, multi = false }: {
  options: readonly (string | { value: string; label: string })[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  tok: Tok
  multi?: boolean
}) {
  const vals = Array.isArray(value) ? value : [value]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const selected = vals.includes(v)
        return (
          <button key={v} onClick={() => {
            if (multi) {
              const arr = vals.includes(v) ? vals.filter(x => x !== v) : [...vals.filter(x => x !== '없음'), v]
              if (v === '없음') { onChange(['없음']); return }
              onChange(arr.length === 0 ? ['없음'] : arr)
            } else {
              onChange(v)
            }
          }} style={{
            padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
            background: selected ? tok.cardActiveBg : tok.cardBg,
            color: selected ? tok.accent : tok.textPrimary,
            cursor: 'pointer',
            transition: 'all .2s ease',
          }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function SliderInput({ value, onChange, tok, min = 1, max = 4, labels }: {
  value: number; onChange: (v: number) => void; tok: Tok
  min?: number; max?: number; labels?: string[]
}) {
  return (
    <div style={{ width: '100%' }}>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: tok.accent }}
      />
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {labels.map((l, i) => (
            <span key={i} style={{
              fontSize: 11, color: value === i + min ? tok.accent : tok.textTertiary,
              fontWeight: value === i + min ? 700 : 400,
              transition: 'color .2s ease',
            }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function FieldLabel({ text, tok }: { text: string; tok: Tok }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary, margin: '0 0 8px', transition: 'color .2s ease' }}>
      {text}
    </p>
  )
}

function FieldGroup({ children, tok }: { children: React.ReactNode; tok: Tok }) {
  return (
    <div style={{
      padding: '16px', borderRadius: 14, marginBottom: 16,
      background: tok.surface, border: `1px solid ${tok.border}`,
      transition: 'background .4s ease, border-color .4s ease',
    }}>
      {children}
    </div>
  )
}

function ScrollChips({ options, value, onChange, tok }: {
  options: readonly (number | string)[]
  value: number | string | null
  onChange: (v: string) => void
  tok: Tok
}) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {options.map((opt) => {
        const v = String(opt)
        const selected = String(value) === v
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            whiteSpace: 'nowrap', flexShrink: 0,
            border: `1.5px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
            background: selected ? tok.cardActiveBg : tok.cardBg,
            color: selected ? tok.accent : tok.textPrimary,
            cursor: 'pointer', transition: 'all .2s ease',
          }}>
            {typeof opt === 'number' ? `${opt}` : opt}
          </button>
        )
      })}
    </div>
  )
}

// ── 섹션 렌더링 ──

export default function RoommateChecklist({ section, profile, onChange, tok }: Props) {
  // 섹션 0: 기본 정보
  if (section === 0) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="생년" tok={tok} />
          <ScrollChips options={BIRTH_YEARS} value={profile.birth_year ?? null} onChange={v => onChange({ birth_year: parseInt(v) })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="학번" tok={tok} />
          <ScrollChips options={STUDENT_IDS.map(n => `${n}학번`)} value={profile.student_id ? `${profile.student_id}학번` : null}
            onChange={v => onChange({ student_id: parseInt(v) })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="거주 유형" tok={tok} />
          <ChipGroup
            options={[{ value: 'dormitory', label: '기숙사' }, { value: 'offcampus', label: '자취방' }]}
            value={profile.living_type ?? ''} onChange={v => onChange({ living_type: v as 'dormitory' | 'offcampus' })} tok={tok}
          />
        </FieldGroup>

        {profile.living_type === 'dormitory' && (
          <FieldGroup tok={tok}>
            <FieldLabel text="기숙사 건물" tok={tok} />
            <ChipGroup options={[...DORMITORIES]} value={profile.dormitory ?? ''} onChange={v => onChange({ dormitory: v as string })} tok={tok} />
          </FieldGroup>
        )}
      </div>
    )
  }

  // 섹션 1: 수면 패턴
  if (section === 1) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="취침 시간" tok={tok} />
          <ScrollChips options={BEDTIMES} value={profile.bedtime ?? null} onChange={v => onChange({ bedtime: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="기상 시간" tok={tok} />
          <ScrollChips options={WAKEUP_TIMES} value={profile.wakeup_time ?? null} onChange={v => onChange({ wakeup_time: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="잠버릇 (복수 선택)" tok={tok} />
          <ChipGroup options={[...SLEEP_HABITS_OPTIONS]} value={profile.sleep_habits ?? ['없음']}
            onChange={v => onChange({ sleep_habits: v as string[] })} tok={tok} multi />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="잠귀" tok={tok} />
          <SliderInput value={profile.light_sleep ?? 2} onChange={v => onChange({ light_sleep: v })} tok={tok}
            labels={['어두움', '', '', '밝음']} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="수면등" tok={tok} />
          <ChipGroup options={[...SLEEP_LIGHT_OPTIONS]} value={profile.sleep_light ?? ''} onChange={v => onChange({ sleep_light: v as string })} tok={tok} />
        </FieldGroup>
      </div>
    )
  }

  // 섹션 2: 위생·청결
  if (section === 2) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="샤워 소요 시간" tok={tok} />
          <ScrollChips options={SHOWER_DURATIONS} value={profile.shower_duration ?? null} onChange={v => onChange({ shower_duration: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="샤워 시간대" tok={tok} />
          <ChipGroup options={[...TIME_OF_DAY]} value={profile.shower_time ?? ''} onChange={v => onChange({ shower_time: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="머리 감는 시간대" tok={tok} />
          <ChipGroup options={[...TIME_OF_DAY]} value={profile.hair_wash_time ?? ''} onChange={v => onChange({ hair_wash_time: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="청소 빈도" tok={tok} />
          <ChipGroup options={[...CLEANING_FREQ_OPTIONS]} value={profile.cleaning_freq ?? ''} onChange={v => onChange({ cleaning_freq: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="청결 수준" tok={tok} />
          <SliderInput value={profile.cleanliness ?? 2} onChange={v => onChange({ cleanliness: v })} tok={tok}
            labels={['더러움', '', '', '깨끗함']} />
        </FieldGroup>
      </div>
    )
  }

  // 섹션 3: 생활 환경
  if (section === 3) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="추위를 타는 정도" tok={tok} />
          <SliderInput value={profile.cold_sensitivity ?? 2} onChange={v => onChange({ cold_sensitivity: v })} tok={tok}
            labels={['적게 탐', '', '', '많이 탐']} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="더위를 타는 정도" tok={tok} />
          <SliderInput value={profile.heat_sensitivity ?? 2} onChange={v => onChange({ heat_sensitivity: v })} tok={tok}
            labels={['적게 탐', '', '', '많이 탐']} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="향수 사용" tok={tok} />
          <ChipGroup options={[...PERFUME_OPTIONS]} value={profile.perfume_usage ?? ''} onChange={v => onChange({ perfume_usage: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="향 민감도" tok={tok} />
          <ChipGroup options={[...SCENT_OPTIONS]} value={profile.scent_sensitivity ?? ''} onChange={v => onChange({ scent_sensitivity: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="소리" tok={tok} />
          <ChipGroup options={[...SOUND_OPTIONS]} value={profile.sound_pref ?? ''} onChange={v => onChange({ sound_pref: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="흡연" tok={tok} />
          <ChipGroup options={[...SMOKING_OPTIONS]} value={profile.smoking ?? ''} onChange={v => onChange({ smoking: v as string })} tok={tok} />
        </FieldGroup>
      </div>
    )
  }

  // 섹션 4: 습관
  if (section === 4) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="음주 빈도" tok={tok} />
          <ChipGroup options={[...DRINKING_FREQ_OPTIONS]} value={profile.drinking_freq ?? ''} onChange={v => onChange({ drinking_freq: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="주량" tok={tok} />
          <ChipGroup options={[...DRINKING_AMOUNT_OPTIONS]} value={profile.drinking_amount ?? ''} onChange={v => onChange({ drinking_amount: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="게임" tok={tok} />
          <ChipGroup options={[...FREQUENCY_OPTIONS]} value={profile.gaming ?? ''} onChange={v => onChange({ gaming: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="실내 통화" tok={tok} />
          <ChipGroup options={[...INDOOR_CALL_OPTIONS]} value={profile.indoor_call ?? ''} onChange={v => onChange({ indoor_call: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="운동" tok={tok} />
          <ChipGroup options={[...FREQUENCY_OPTIONS]} value={profile.exercise ?? ''} onChange={v => onChange({ exercise: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="실내 취식" tok={tok} />
          <ChipGroup options={[...INDOOR_EATING_OPTIONS]} value={profile.indoor_eating ?? ''} onChange={v => onChange({ indoor_eating: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="벌레 내성" tok={tok} />
          <ChipGroup options={[...BUG_OPTIONS]} value={profile.bug_tolerance ?? ''} onChange={v => onChange({ bug_tolerance: v as string })} tok={tok} />
        </FieldGroup>
      </div>
    )
  }

  // 섹션 5: 사회·관계
  if (section === 5) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="개인 물건 공유" tok={tok} />
          <ChipGroup options={[...SHARING_OPTIONS]} value={profile.sharing ?? ''} onChange={v => onChange({ sharing: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="친구 초대" tok={tok} />
          <ChipGroup options={[...GUEST_OPTIONS]} value={profile.guest_policy ?? ''} onChange={v => onChange({ guest_policy: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="룸메와의 관계" tok={tok} />
          <SliderInput value={profile.relationship ?? 2} onChange={v => onChange({ relationship: v })} tok={tok}
            labels={['학교 사람', '', '', '절친']} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="알람 설정" tok={tok} />
          <ChipGroup options={[...ALARM_USAGE_OPTIONS]} value={profile.alarm_usage ?? ''} onChange={v => onChange({ alarm_usage: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="알람 빈도" tok={tok} />
          <ChipGroup options={[...ALARM_FREQ_OPTIONS]} value={profile.alarm_freq ?? ''} onChange={v => onChange({ alarm_freq: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="본가 가는 주기" tok={tok} />
          <ChipGroup options={[...HOMETOWN_FREQ_OPTIONS]} value={profile.hometown_freq ?? ''} onChange={v => onChange({ hometown_freq: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="공부 장소" tok={tok} />
          <ChipGroup options={[...STUDY_PLACE_OPTIONS]} value={profile.study_place ?? ''} onChange={v => onChange({ study_place: v as string })} tok={tok} />
        </FieldGroup>
      </div>
    )
  }

  // 섹션 6: 마무리
  if (section === 6) {
    return <Section7Finish profile={profile} onChange={onChange} tok={tok} />
  }

  return null
}

function Section7Finish({ profile, onChange, tok }: { profile: Partial<RoommateProfile>; onChange: (u: Partial<RoommateProfile>) => void; tok: Tok }) {
  const [mbtiParts, setMbtiParts] = useState<string[]>(() => {
    const m = profile.mbti ?? ''
    return m.length === 4 ? m.split('') : ['', '', '', '']
  })

  const updateMbti = (idx: number, letter: string) => {
    const next = [...mbtiParts]
    next[idx] = letter
    setMbtiParts(next)
    const full = next.join('')
    onChange({ mbti: full.length === 4 ? full : null })
  }

  return (
    <div>
      <FieldGroup tok={tok}>
        <FieldLabel text="MBTI (선택 사항)" tok={tok} />
        <div style={{ display: 'flex', gap: 8 }}>
          {MBTI_LETTERS.map((pair, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 4 }}>
              {pair.map(letter => (
                <button key={letter} onClick={() => updateMbti(idx, letter)} style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 15, fontWeight: 700,
                  border: `1.5px solid ${mbtiParts[idx] === letter ? tok.cardActiveBorder : tok.cardBorder}`,
                  background: mbtiParts[idx] === letter ? tok.cardActiveBg : tok.cardBg,
                  color: mbtiParts[idx] === letter ? tok.accent : tok.textPrimary,
                  cursor: 'pointer', transition: 'all .2s ease',
                }}>
                  {letter}
                </button>
              ))}
            </div>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup tok={tok}>
        <FieldLabel text="한 줄 소개 (200자 이내)" tok={tok} />
        <textarea
          value={profile.introduction ?? ''}
          onChange={e => {
            if (e.target.value.length <= 200) onChange({ introduction: e.target.value })
          }}
          placeholder="나를 소개해 주세요..."
          style={{
            width: '100%', minHeight: 80, padding: '12px', borderRadius: 12,
            border: `1.5px solid ${tok.cardBorder}`, background: tok.cardBg,
            color: tok.textPrimary, fontSize: 14, resize: 'vertical',
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color .2s ease, background .2s ease, color .2s ease',
          }}
          onFocus={e => { e.target.style.borderColor = tok.cardActiveBorder }}
          onBlur={e => { e.target.style.borderColor = tok.cardBorder }}
        />
        <p style={{ fontSize: 11, color: tok.textTertiary, marginTop: 4, textAlign: 'right' }}>
          {(profile.introduction ?? '').length}/200
        </p>
      </FieldGroup>

      <FieldGroup tok={tok}>
        <FieldLabel text="대학 홀길 생각" tok={tok} />
        <ChipGroup options={[...WANTS_TO_LEAVE_OPTIONS]} value={profile.wants_to_leave ?? ''} onChange={v => onChange({ wants_to_leave: v as string })} tok={tok} />
      </FieldGroup>
    </div>
  )
}

// 각 섹션의 필수 필드 충족 여부 검사
export function isSectionComplete(section: number, profile: Partial<RoommateProfile>): boolean {
  switch (section) {
    case 0:
      return !!(profile.birth_year && profile.student_id && profile.living_type &&
        (profile.living_type !== 'dormitory' || profile.dormitory))
    case 1:
      return !!(profile.bedtime && profile.wakeup_time && profile.sleep_habits?.length &&
        profile.light_sleep && profile.sleep_light)
    case 2:
      return !!(profile.shower_duration && profile.shower_time && profile.hair_wash_time &&
        profile.cleaning_freq && profile.cleanliness)
    case 3:
      return !!(profile.cold_sensitivity && profile.heat_sensitivity &&
        profile.perfume_usage && profile.scent_sensitivity && profile.sound_pref && profile.smoking)
    case 4:
      return !!(profile.drinking_freq && profile.drinking_amount && profile.gaming &&
        profile.indoor_call && profile.exercise && profile.indoor_eating && profile.bug_tolerance)
    case 5:
      return !!(profile.sharing && profile.guest_policy && profile.relationship &&
        profile.alarm_usage && profile.alarm_freq && profile.hometown_freq && profile.study_place)
    case 6:
      return !!(profile.introduction && profile.wants_to_leave)
    default:
      return false
  }
}
