'use client'

export default function TransactionTabs() {
  return (
    <div className="px-5 py-5 border-b border-gray-100">
      <h3 className="text-sm font-bold text-gray-900 mb-4">월세 실거래가</h3>

      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[2fr_3fr_2fr_1.5fr] border-b border-gray-200 pb-2.5">
        <span className="text-xs text-gray-500">계약일시</span>
        <span className="text-xs font-bold text-gray-700">실거래가</span>
        <span className="text-xs text-gray-500 text-right">면적</span>
        <span className="text-xs text-gray-500 text-right">층수</span>
      </div>

      {/* 빈 상태 */}
      <div className="flex flex-col items-center py-8 gap-2.5">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
          <span className="text-gray-300 text-base font-bold leading-none select-none">!</span>
        </div>
        <p className="text-sm text-gray-400">실거래 기록이 없습니다.</p>
      </div>
    </div>
  )
}
