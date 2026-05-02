'use client'

// 테마 즉시 저장·반영 컴포넌트.
// - StepTheme 의 선택 콜백을 받아 prefs 쿠키를 갱신한다.
// - <html data-theme> 를 즉시 바꿔 페이지 점멸 없이 색만 전환된다.
// - router.refresh() 로 서버 컴포넌트(layout.tsx의 data-theme 등)를 재계산.
//   쿠키와 DOM 의 진실 값이 다음 hydration 까지 어긋나지 않게.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadPrefs, savePrefs } from '@/lib/prefs'
import StepTheme, { type Theme } from '@/components/onboarding/StepTheme'
import type { ThemeMode } from '@/lib/theme-tokens'

export default function ThemeSettingsClient({ initialTheme }: { initialTheme: ThemeMode }) {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>(initialTheme)

  function handleSelect(t: Theme) {
    setTheme(t)
    // 기존 prefs 위에 theme 만 갱신. 학과·학번·우선순위 등 다른 필드는 보존.
    const cur = loadPrefs() ?? {
      grade: null, dept: null, zone: null, priorities: [], gate: null, theme: t,
      gender: null, mode: null,
    }
    savePrefs({ ...cur, theme: t })
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = t
    }
    router.refresh()
  }

  return <StepTheme selected={theme} onSelect={handleSelect} />
}
