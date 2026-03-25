'use client'

import { useState } from 'react'

export interface BuildingInfo {
  name:               string | null
  address:            string | null
  bd_mgt_sn:          string | null
  hhld_cnt:           number | null
  main_purps_nm:      string | null
  total_floors:       number | null
  ugrnd_flr_cnt:      number | null
  strct_cd_nm:        string | null
  tot_area:           number | null
  ride_use_elvt_cnt:  number | null
  has_elevator:       boolean | null
  use_apr_day:        string | null
}

function buildingAge(useAprDay: string | null): number | null {
  if (!useAprDay || useAprDay.length < 8) return null
  const y = parseInt(useAprDay.slice(0, 4))
  const m = parseInt(useAprDay.slice(4, 6)) - 1
  const d = parseInt(useAprDay.slice(6, 8))
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  const built = new Date(y, m, d)
  const now   = new Date()
  return Math.floor((now.getTime() - built.getTime()) / (365.25 * 24 * 3600 * 1000))
}

function formatDate(d: string | null): string | null {
  if (!d || d.length < 8) return null
  const label = `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`
  const age   = buildingAge(d)
  return age != null ? `${label}  (${age}년 경과)` : label
}

function formatArea(a: number | null): string | null {
  if (a == null) return null
  return `${a.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} ㎡`
}

function Row({
  label,
  value,
  dim = false,
}: {
  label: string
  value: string | null
  dim?: boolean
}) {
  if (value == null) return null
  return (
    <div className="grid grid-cols-[160px_1fr] items-start py-3.5 border-b border-gray-100 last:border-0">
      <dt className={`text-sm ${dim ? 'text-gray-400' : 'text-gray-500'}`}>{label}</dt>
      <dd className={`text-sm ${dim ? 'text-gray-400' : 'text-gray-800'}`}>{value}</dd>
    </div>
  )
}

export default function InfoExpand({ building: b }: { building: BuildingInfo }) {
  const [expanded, setExpanded] = useState(false)

  const elevatorValue =
    b.ride_use_elvt_cnt != null
      ? b.ride_use_elvt_cnt > 0 ? `${b.ride_use_elvt_cnt}대` : '없음'
      : b.has_elevator ? '있음' : null

  return (
    <div>
      <dl>
        <Row label="건물명"    value={b.name?.trim() || '–'} />
        <Row label="세대수"    value={b.hhld_cnt != null ? `${b.hhld_cnt}세대` : '–'} />
        <Row label="도로명 주소" value={b.address || '–'} dim />

        {expanded && (
          <>
            <Row label="주용도"    value={b.main_purps_nm} />
            <Row label="지상층수"  value={b.total_floors ? `${b.total_floors}층` : null} />
            <Row label="지하층수"  value={b.ugrnd_flr_cnt ? `지하 ${b.ugrnd_flr_cnt}층` : null} />
            <Row label="구조"      value={b.strct_cd_nm} />
            <Row label="연면적"    value={formatArea(b.tot_area)} />
            <Row label="승강기"    value={elevatorValue} />
            <Row label="사용승인일" value={formatDate(b.use_apr_day)} />
            <Row label="건물관리번호" value={b.bd_mgt_sn} dim />
          </>
        )}
      </dl>

      <div className="flex justify-center mt-4 mb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-6 py-2.5 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {expanded ? '접기' : '더보기'}
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ∨
          </span>
        </button>
      </div>
    </div>
  )
}
