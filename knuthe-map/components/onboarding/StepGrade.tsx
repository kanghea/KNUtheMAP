'use client'

const GRADES = [
  { label: '27학번', sub: '2027년 입학' },
  { label: '26학번', sub: '2026년 입학' },
  { label: '25학번', sub: '2025년 입학' },
  { label: '24학번', sub: '2024년 입학' },
  { label: '23학번', sub: '2023년 입학' },
  { label: '22학번 이상', sub: '재학 · 휴학' },
  { label: '대학원생', sub: '석사 · 박사' },
]

interface Props {
  selected: string | null
  onSelect: (v: string) => void
}

export default function StepGrade({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full">
      {GRADES.map(({ label, sub }) => (
        <button
          key={label}
          onClick={() => onSelect(label)}
          className={[
            'flex flex-col items-start px-4 py-3.5 rounded-2xl border transition-all text-left',
            selected === label
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          <span className={[
            'text-sm font-bold',
            selected === label ? 'text-blue-700' : 'text-gray-800',
          ].join(' ')}>
            {label}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">{sub}</span>
        </button>
      ))}
    </div>
  )
}
