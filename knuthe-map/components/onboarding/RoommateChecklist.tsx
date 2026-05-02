'use client'

import { type RoommateProfile, DORMITORIES, BIRTH_YEARS, STUDENT_IDS, BEDTIMES, WAKEUP_TIMES, SLEEP_HABITS_OPTIONS, SLEEP_LIGHT_OPTIONS, SHOWER_DURATIONS, TIME_OF_DAY, CLEANING_FREQ_OPTIONS, PERFUME_OPTIONS, SCENT_OPTIONS, SOUND_OPTIONS, SMOKING_OPTIONS, DRINKING_FREQ_OPTIONS, DRINKING_AMOUNT_OPTIONS, FREQUENCY_OPTIONS, INDOOR_CALL_OPTIONS, INDOOR_EATING_OPTIONS, BUG_OPTIONS, SHARING_OPTIONS, GUEST_OPTIONS, ALARM_USAGE_OPTIONS, ALARM_FREQ_OPTIONS, HOMETOWN_FREQ_OPTIONS, STUDY_PLACE_OPTIONS, WANTS_TO_LEAVE_OPTIONS, MBTI_LETTERS, SCALE_LABELS, GENDER_OPTIONS } from '@/lib/roommate-constants'
import StepDepartment from './StepDepartment'
import { useState, useRef, useEffect, useCallback } from 'react'

// 호출자(전체 온보딩·룸메이트 전용 온보딩) 모두 ONBOARDING_TOKENS 를 넘기므로
// 그 객체의 모든 키를 직접 받는다. StepDepartment 등 다른 온보딩 스텝과 키
// 셰어를 위해서도 필요.
interface Tok {
  bg: string; surface: string; textPrimary: string; textSecondary: string; textTertiary: string
  border: string; accent: string; cardBg: string; cardBorder: string
  cardActiveBg: string; cardActiveBorder: string; cardActiveGlow: string
  btnPrimary: string; btnPrimaryText: string; progressFill: string
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

// ── SVG 아이콘 ──

function IconMoon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}
function IconMoonHalf({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18V3z"/><circle cx="12" cy="12" r="9"/></svg>
}
function IconEar({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6.5-6 10.5"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 0 0 4 0"/></svg>
}
function IconEarAlert({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6.5-6 10.5"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 0 0 4 0"/><line x1="1" y1="2" x2="1" y2="6"/><line x1="1" y1="9" x2="1" y2="9.01"/></svg>
}
function IconLeaf({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.5 4.5-6.5"/></svg>
}
function IconHome({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function IconSparkle({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
}
function IconSparkles({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M19 2v4"/><path d="M21 4h-4"/></svg>
}
function IconSun({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
}
function IconCloud({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
}
function IconSnowflake({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>
}
function IconThermometer({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
}
function IconFlame({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.5-2.5 1.5-3.5z"/></svg>
}
function IconCloudSun({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.95 5.63a5 5 0 0 0-8.02 5.41"/><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
}
function IconUser({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function IconUsers({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconHandshake({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3L14 8l-2-2-3.5 1L2 12.5"/><path d="m16 16 3 3a1 1 0 1 0 3-3l-5-5"/><path d="M8.5 4.5 4 2l-1.5 3.5"/><path d="M22 12.5l-5.5-5-3.5-1-2 2"/></svg>
}
function IconHeart({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
}

const SCALE_ICONS: Record<string, React.ReactNode[]> = {
  light_sleep:      [<IconMoon key={0} />, <IconMoonHalf key={1} />, <IconEar key={2} />, <IconEarAlert key={3} />],
  cleanliness:      [<IconLeaf key={0} />, <IconHome key={1} />, <IconSparkle key={2} />, <IconSparkles key={3} />],
  cold_sensitivity: [<IconSun key={0} />, <IconCloud key={1} />, <IconSnowflake key={2} />, <IconSnowflake key={3} />],
  heat_sensitivity: [<IconSnowflake key={0} />, <IconCloudSun key={1} />, <IconThermometer key={2} />, <IconFlame key={3} />],
  relationship:     [<IconUser key={0} />, <IconUsers key={1} />, <IconHandshake key={2} />, <IconHeart key={3} />],
}

// ── ScaleCardGroup (SliderInput 대체) ──

function ScaleCardGroup({ scaleKey, value, onChange, tok }: {
  scaleKey: keyof typeof SCALE_LABELS
  value: number
  onChange: (v: number) => void
  tok: Tok
}) {
  const labels = SCALE_LABELS[scaleKey]
  const icons = SCALE_ICONS[scaleKey]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {[1, 2, 3, 4].map((v) => {
        const selected = value === v
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '10px 4px', minHeight: 44, borderRadius: 14,
            border: `1.5px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
            background: selected ? tok.cardActiveBg : tok.cardBg,
            color: selected ? tok.accent : tok.textPrimary,
            boxShadow: selected ? tok.cardActiveGlow : 'none',
            cursor: 'pointer',
            transition: 'all .2s ease',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', height: 22 }}>{icons[v - 1]}</span>
            <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>{labels[v - 1]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── TimeRangeSelector (수면 시간 범위 — 순차 탭) ──

const BEDTIME_IDX: Record<string, number> = { '9시': 0, '10시': 1, '11시': 2, '12시': 3, '1시': 4, '2시': 5, '3시': 6, '4시': 7, '그 이후': 8 }
const WAKEUP_IDX: Record<string, number> = { '4시': 0, '5시': 1, '6시': 2, '7시': 3, '8시': 4, '9시': 5, '10시': 6, '11시': 7, '그 이후': 8 }

type TimePhase = 'idle' | 'picking_end' | 'complete'

function TimeRangeSelector({ options, startValue, endValue, onChangeStart, onChangeEnd, tok, tint }: {
  options: readonly string[]
  startValue: string | null
  endValue: string | null
  onChangeStart: (v: string) => void
  onChangeEnd: (v: string) => void
  tok: Tok
  tint?: { accent: string; activeBg: string; activeBorder: string; glow: string }
}) {
  const accent = tint?.accent ?? tok.accent
  const activeBg = tint?.activeBg ?? tok.cardActiveBg
  const activeBorder = tint?.activeBorder ?? tok.cardActiveBorder

  const startIdx = startValue ? options.indexOf(startValue) : -1
  const endIdx = endValue ? options.indexOf(endValue) : -1

  // 현재 단계 판별
  const phase: TimePhase =
    startIdx < 0 ? 'idle' :
    endIdx < 0 ? 'picking_end' :
    'complete'

  const handleTap = (i: number, opt: string) => {
    if (phase === 'idle') {
      // 첫 탭 → 시작 설정
      onChangeStart(opt)
      onChangeEnd('')
    } else if (phase === 'picking_end') {
      if (i === startIdx) {
        // 같은 타일 다시 탭 → 선택 해제
        onChangeStart('')
        onChangeEnd('')
      } else if (i > startIdx) {
        // 시작 이후 타일 → 끝 설정
        onChangeEnd(opt)
      } else {
        // 시작 이전 타일 → 시작을 재설정
        onChangeStart(opt)
        onChangeEnd('')
      }
    } else {
      // complete 상태
      const inRange = i >= startIdx && i <= endIdx
      if (inRange) {
        // 범위 내 타일 탭 → 전체 해제
        onChangeStart('')
        onChangeEnd('')
      } else {
        // 범위 밖 → 새로운 시작으로 재설정
        onChangeStart(opt)
        onChangeEnd('')
      }
    }
  }

  // 단계 안내 텍스트
  const phaseText =
    phase === 'idle' ? '시작 시간을 선택하세요' :
    phase === 'picking_end' ? '끝 시간을 선택하세요' :
    startValue === endValue ? startValue! : `${startValue} ~ ${endValue}`

  const phaseIcon =
    phase === 'idle' ? '○' :
    phase === 'picking_end' ? '◐' : '●'

  return (
    <div>
      {/* 단계 표시 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 10, padding: '6px 10px',
        borderRadius: 8,
        background: phase === 'complete' ? activeBg : 'transparent',
        transition: 'all .3s ease',
      }}>
        <span style={{
          fontSize: 10, lineHeight: 1, color: phase === 'complete' ? accent : tok.textTertiary,
          transition: 'color .3s ease',
        }}>
          {phaseIcon}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: phase === 'complete' ? accent : tok.textSecondary,
          transition: 'color .3s ease',
        }}>
          {phaseText}
        </span>
      </div>

      {/* 시간 타일 — 가로 나열 */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
        {options.map((opt, i) => {
          const hasRange = startIdx >= 0 && endIdx >= 0 && startIdx !== endIdx
          const inRange = hasRange && i >= startIdx && i <= endIdx
          const isStart = hasRange && i === startIdx
          const isEnd = hasRange && i === endIdx
          const isSolo = i === startIdx && (phase === 'picking_end' || (phase === 'complete' && startIdx === endIdx))

          const highlighted = inRange || isSolo

          const borderRadiusVal =
            isSolo ? '12px' :
            isStart ? '12px 0 0 12px' :
            isEnd ? '0 12px 12px 0' :
            inRange ? '0' : '12px'

          return (
            <button key={opt} onClick={() => handleTap(i, opt)} style={{
              padding: '10px 14px', fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0, minHeight: 48,
              borderRadius: borderRadiusVal,
              border: highlighted ? `1.5px solid ${activeBorder}` : `1.5px solid ${tok.cardBorder}`,
              borderRight: inRange && !isEnd ? 'none' : undefined,
              borderLeft: inRange && !isStart ? 'none' : undefined,
              background: highlighted ? activeBg : tok.cardBg,
              color: highlighted ? accent : tok.textPrimary,
              boxShadow: isSolo && phase === 'picking_end' ? `0 0 0 2px ${activeBorder}` : 'none',
              cursor: 'pointer',
              transition: 'all .25s ease',
              transform: isSolo && phase === 'picking_end' ? 'scale(1.04)' : 'scale(1)',
            }}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 예상 수면 시간 계산 ──

function SleepDurationDisplay({ profile, tok }: { profile: Partial<RoommateProfile>; tok: Tok }) {
  const bs = profile.bedtime_start
  const be = profile.bedtime_end
  const ws = profile.wakeup_start
  const we = profile.wakeup_end
  if (!bs || !be || !ws || !we) return null

  const bedMid = ((BEDTIME_IDX[bs] ?? 0) + (BEDTIME_IDX[be] ?? 0)) / 2
  const wakeMid = ((WAKEUP_IDX[ws] ?? 0) + (WAKEUP_IDX[we] ?? 0)) / 2

  // 취침은 21시(9시)부터, 기상은 4시부터 — 절대 시간 계산
  const bedHour = 21 + bedMid   // 21, 22, 23, 24, 25, 26, 27, 28, 29
  const wakeHour = 4 + wakeMid  // 4, 5, 6, 7, 8, 9, 10, 11, 12
  let diff = wakeHour - (bedHour - 24) // 24시간 보정
  if (diff < 0) diff += 24

  const h = Math.floor(diff)
  const m = Math.round((diff - h) * 60)

  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12, marginTop: 8,
      background: tok.cardActiveBg, border: `1px solid ${tok.cardActiveBorder}`,
      transition: 'all .3s ease',
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: tok.accent, margin: 0 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -2, marginRight: 4 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {`예상 수면 시간: 약 ${h}시간${m > 0 ? ` ${m}분` : ''}`}
      </p>
    </div>
  )
}

// ── BirthYearPicker (스크롤 피커) ──

const PICKER_ITEM_H = 44
const PICKER_VISIBLE = 5
const PICKER_PAD = Math.floor(PICKER_VISIBLE / 2) * PICKER_ITEM_H

function BirthYearPicker({ value, onChange, tok }: {
  value: number | null
  onChange: (v: number) => void
  tok: Tok
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const touching = useRef(false)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idx = value ? BIRTH_YEARS.indexOf(value) : Math.floor(BIRTH_YEARS.length / 2)

  const scrollTo = useCallback((i: number, smooth: boolean) => {
    scrollRef.current?.scrollTo({ top: i * PICKER_ITEM_H, behavior: smooth ? 'smooth' : 'instant' as ScrollBehavior })
  }, [])

  useEffect(() => { scrollTo(idx >= 0 ? idx : Math.floor(BIRTH_YEARS.length / 2), false) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!touching.current && idx >= 0) scrollTo(idx, true)
  }, [idx, scrollTo])

  const handleScroll = useCallback(() => {
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      const i = Math.max(0, Math.min(BIRTH_YEARS.length - 1, Math.round(el.scrollTop / PICKER_ITEM_H)))
      scrollTo(i, true)
      onChange(BIRTH_YEARS[i])
      touching.current = false
    }, 80)
  }, [scrollTo, onChange])

  return (
    <div>
      {/* 선택값 표시 */}
      <p style={{
        fontSize: 28, fontWeight: 700, textAlign: 'center', margin: '0 0 12px',
        color: tok.accent, transition: 'color .2s ease',
      }}>
        {value ? `${value}년생` : '-'}
      </p>

      {/* 드럼 피커 */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: tok.cardBg }}>
        {/* 선택 구역 하이라이트 */}
        <div style={{
          position: 'absolute', top: PICKER_PAD, left: 0, right: 0, height: PICKER_ITEM_H,
          background: tok.cardActiveBg,
          borderTop: `1.5px solid ${tok.cardActiveBorder}`,
          borderBottom: `1.5px solid ${tok.cardActiveBorder}`,
          pointerEvents: 'none', zIndex: 2,
        }} />
        {/* 위쪽 페이드 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: PICKER_PAD,
          background: `linear-gradient(to bottom, ${tok.cardBg} 40%, transparent)`,
          pointerEvents: 'none', zIndex: 2,
        }} />
        {/* 아래쪽 페이드 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: PICKER_PAD,
          background: `linear-gradient(to top, ${tok.cardBg} 40%, transparent)`,
          pointerEvents: 'none', zIndex: 2,
        }} />
        {/* 스크롤 영역 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={() => { touching.current = true }}
          style={{
            height: PICKER_ITEM_H * PICKER_VISIBLE,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          <div style={{ height: PICKER_PAD, flexShrink: 0 }} />
          {BIRTH_YEARS.map((yr, i) => (
            <div
              key={yr}
              onClick={() => { scrollTo(i, true); onChange(yr) }}
              style={{
                height: PICKER_ITEM_H,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
                fontWeight: i === idx ? 700 : 400,
                color: i === idx ? tok.accent : tok.textTertiary,
                scrollSnapAlign: 'center',
                cursor: 'pointer', userSelect: 'none',
                transition: 'color .15s, font-weight .15s',
              }}
            >
              {yr}년생
            </div>
          ))}
          <div style={{ height: PICKER_PAD, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
}

// ── MultiChipGroup (샤워/머리 복수 선택 — 최소 1개 보장) ──

function MultiChipGroup({ options, value, onChange, tok }: {
  options: readonly { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  tok: Tok
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const selected = value.includes(opt.value)
        return (
          <button key={opt.value} onClick={() => {
            if (selected) {
              const next = value.filter(x => x !== opt.value)
              if (next.length === 0) return // 최소 1개 유지
              onChange(next)
            } else {
              onChange([...value, opt.value])
            }
          }} style={{
            padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44,
            border: `1.5px solid ${selected ? tok.cardActiveBorder : tok.cardBorder}`,
            background: selected ? tok.cardActiveBg : tok.cardBg,
            color: selected ? tok.accent : tok.textPrimary,
            cursor: 'pointer', transition: 'all .2s ease',
          }}>
            {opt.label}
          </button>
        )
      })}
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
  // 섹션 0: 기본 정보 (학과·생년·학번·성별·거주 유형)
  if (section === 0) {
    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="학과" tok={tok} />
          {/* 방구하기 온보딩에서 쓰는 StepDepartment 와 동일한 컴포넌트 — 단과대 →
              학과 2단계 + 선배 팁. 룸메이트 매칭에서도 같은 dept 정보가 필요해
              users.dept 로 동기화한다 (/api/roommate POST). */}
          <StepDepartment
            selected={profile.dept ?? null}
            onSelect={v => onChange({ dept: v })}
            tok={tok}
          />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="몇 년생이에요?" tok={tok} />
          <BirthYearPicker value={profile.birth_year ?? null} onChange={v => onChange({ birth_year: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="학번" tok={tok} />
          <ScrollChips options={STUDENT_IDS.map(n => `${n}학번`)} value={profile.student_id ? `${profile.student_id}학번` : null}
            onChange={v => onChange({ student_id: parseInt(v) })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="성별" tok={tok} />
          <ChipGroup
            options={[...GENDER_OPTIONS]}
            value={profile.gender ?? ''}
            onChange={v => onChange({ gender: v as 'male' | 'female' })}
            tok={tok}
          />
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
    const bedtimeTint = {
      accent: '#8b5cf6',
      activeBg: 'rgba(139,92,246,0.12)',
      activeBorder: 'rgba(139,92,246,0.4)',
      glow: '0 0 12px rgba(139,92,246,0.15)',
    }
    const wakeupTint = {
      accent: '#f59e0b',
      activeBg: 'rgba(245,158,11,0.12)',
      activeBorder: 'rgba(245,158,11,0.4)',
      glow: '0 0 12px rgba(245,158,11,0.15)',
    }

    return (
      <div>
        <FieldGroup tok={tok}>
          <FieldLabel text="취침 시간" tok={tok} />
          <TimeRangeSelector
            options={BEDTIMES}
            startValue={profile.bedtime_start || null}
            endValue={profile.bedtime_end || null}
            onChangeStart={v => onChange({ bedtime_start: v || undefined })}
            onChangeEnd={v => onChange({ bedtime_end: v || undefined })}
            tok={tok}
            tint={bedtimeTint}
          />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="기상 시간" tok={tok} />
          <TimeRangeSelector
            options={WAKEUP_TIMES}
            startValue={profile.wakeup_start || null}
            endValue={profile.wakeup_end || null}
            onChangeStart={v => onChange({ wakeup_start: v || undefined })}
            onChangeEnd={v => onChange({ wakeup_end: v || undefined })}
            tok={tok}
            tint={wakeupTint}
          />
        </FieldGroup>

        <SleepDurationDisplay profile={profile} tok={tok} />

        <FieldGroup tok={tok}>
          <FieldLabel text="잠버릇 (복수 선택)" tok={tok} />
          <ChipGroup options={[...SLEEP_HABITS_OPTIONS]} value={profile.sleep_habits ?? ['없음']}
            onChange={v => onChange({ sleep_habits: v as string[] })} tok={tok} multi />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="잠귀" tok={tok} />
          <ScaleCardGroup scaleKey="light_sleep" value={profile.light_sleep ?? 2} onChange={v => onChange({ light_sleep: v })} tok={tok} />
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
          <FieldLabel text="샤워 시간대 (복수 선택)" tok={tok} />
          <MultiChipGroup options={[...TIME_OF_DAY]} value={profile.shower_time ?? []} onChange={v => onChange({ shower_time: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="머리 감는 시간대 (복수 선택)" tok={tok} />
          <MultiChipGroup options={[...TIME_OF_DAY]} value={profile.hair_wash_time ?? []} onChange={v => onChange({ hair_wash_time: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="청소 빈도" tok={tok} />
          <ChipGroup options={[...CLEANING_FREQ_OPTIONS]} value={profile.cleaning_freq ?? ''} onChange={v => onChange({ cleaning_freq: v as string })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="청결 수준" tok={tok} />
          <ScaleCardGroup scaleKey="cleanliness" value={profile.cleanliness ?? 2} onChange={v => onChange({ cleanliness: v })} tok={tok} />
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
          <ScaleCardGroup scaleKey="cold_sensitivity" value={profile.cold_sensitivity ?? 2} onChange={v => onChange({ cold_sensitivity: v })} tok={tok} />
        </FieldGroup>

        <FieldGroup tok={tok}>
          <FieldLabel text="더위를 타는 정도" tok={tok} />
          <ScaleCardGroup scaleKey="heat_sensitivity" value={profile.heat_sensitivity ?? 2} onChange={v => onChange({ heat_sensitivity: v })} tok={tok} />
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
          <ScaleCardGroup scaleKey="relationship" value={profile.relationship ?? 2} onChange={v => onChange({ relationship: v })} tok={tok} />
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
      return !!(profile.dept && profile.birth_year && profile.student_id &&
        profile.gender && profile.living_type &&
        (profile.living_type !== 'dormitory' || profile.dormitory))
    case 1:
      return !!(profile.bedtime_start && profile.bedtime_end &&
        profile.wakeup_start && profile.wakeup_end && profile.sleep_habits?.length &&
        profile.light_sleep && profile.sleep_light)
    case 2:
      return !!(profile.shower_duration && profile.shower_time?.length && profile.hair_wash_time?.length &&
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
