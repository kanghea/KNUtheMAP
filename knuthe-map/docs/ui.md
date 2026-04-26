# UI·스타일링

## 개요
Tailwind CSS 4 + CSS 변수 기반 테마 시스템. 외부 컴포넌트 라이브러리 없이 전부 커스텀 구현.

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/globals.css` | Tailwind 4 (@import/@theme inline), 다크/라이트 CSS 변수, Mapbox 팝업 스타일, 공용 keyframe (`knu-pulse`·`knu-shimmer`·`knu-spin`) |
| `lib/theme-tokens.ts` | `ThemeTokens` 인터페이스 (pageBg, cardBg, textPrimary 등) + `THEME_TOKENS` 객체 (dark/light) |
| `lib/theme-server.ts` | 서버 컴포넌트용 `getServerThemeTokens()` — 쿠키에서 테마 읽어 토큰 반환 |
| `lib/hooks/useTheme.ts` | 클라이언트용 `useTheme()` — hydration-safe 한 lazy 초기화 |
| `lib/prefs.ts` | `UserPrefs` 쿠키 구조 (theme: 'dark'\|'light'), 온보딩 우선순위 팩터 정의 |
| `lib/factor-icons.tsx` | 온보딩 UI용 팩터 아이콘·라벨 정의 |
| `components/shared/` | 공통 UI 컴포넌트 (아래 인벤토리 참조) |
| `app/layout.tsx` | 루트 레이아웃 — 테마 프로바이더 설정 |
| `app/providers.tsx` | 클라이언트 프로바이더 래퍼 |

## 테마 시스템

### CSS 변수 (globals.css)
```css
:root {
  --background: ...;
  --foreground: ...;
}
.dark {
  --background: ...;
  --foreground: ...;
}
```

### JS 테마 토큰 (theme-tokens.ts)
```ts
THEME_TOKENS.dark.pageBg   // 다크 모드 배경색
THEME_TOKENS.light.cardBg  // 라이트 모드 카드 배경색
```

인라인 스타일이 필요한 경우(Mapbox 팝업 등) `THEME_TOKENS`를 사용.
일반 컴포넌트는 Tailwind 유틸리티 클래스 사용.

## 스타일링 원칙

1. **다크/라이트 모드 필수**: 모든 새 컴포넌트는 양쪽 테마에서 정상 표시되어야 함
2. **Tailwind 유틸리티 우선**: 가능하면 Tailwind 클래스 사용, 불가피한 경우만 인라인 스타일
3. **컴포넌트 라이브러리 없음**: shadcn/ui 등 미사용, 전부 직접 구현
4. **반응형 고려**: 모바일 퍼스트 접근

## 주요 커스텀 스타일 (globals.css)
- 드럼 피커 스크롤바
- 온보딩 애니메이션 (stroke-dasharray)
- Mapbox 팝업 오버라이드
- 공용 애니메이션 클래스 (`.knu-pulse`, `.knu-shimmer`, `.knu-spin`) — `prefers-reduced-motion` 자동 OFF
- 12프레임 러닝 로더 (`@keyframes knu-runner-frame` + `.knu-runner-frame`) — `LoadingRunner.tsx` 가 사용. 자산은 `public/images/loading-runner/frame-01..12.png` (가이드는 폴더 README)

---

## 🧱 공유 컴포넌트 (components/shared/)

**새 페이지·UI를 만들기 전 반드시 이 인벤토리를 먼저 확인.** 같은 패턴이 2곳 이상이면
인라인으로 다시 짜지 말고 여기 추가하거나 기존 컴포넌트로 조립한다.

### 페이지 셸

| 컴포넌트 | 용도 | 핵심 props |
|---|---|---|
| `<PageWrapper>` | 모든 페이지 외곽 (배경·하단여백) | `tok`, `paddingBottom?`, `fixed?` |
| `<DashboardHeader>` | sticky 헤더 + 뒤로가기 + 제목/부제 | `tok`, `title`, `subtitle?`, `backHref?`, `right?` |
| `<DashboardHeaderSkeleton>` | `loading.tsx` 헤더 자리표시 | `tok`, `hasSubtitle?`, `hasRight?` |
| `<HeaderAvatarLink>` | 헤더 우측 마이페이지 아이콘 버튼 | `tok`, `href?`, `children` |

### 컨테이너·구조

| 컴포넌트 | 용도 | 핵심 props |
|---|---|---|
| `<Card>` | 카드 셸 (배경·테두리·그림자) | `tok`, `padding?`, `radius?`, `shadow?`, `overflow?` |
| `<MenuItem>` | Card 안 메뉴 행 (아이콘+제목+chevron) | `tok`, `href`, `icon`, `label`, `description?`, `divider?` |
| `<StatCard>` | 대시보드 KPI 타일 | `href?`, `icon`, `value`, `label`, `color`, `background` |
| `<EmptyState>` | "결과 없음" 빈 상태 | `tok`, `icon?`, `title`, `description?`, `action?` |

### 원자 컴포넌트

| 컴포넌트 | 용도 | 핵심 props |
|---|---|---|
| `<Badge>` | 알약 라벨 (zone·계약유형·상태) | `label`, `color`, `background`, `size?` |
| `<Skeleton>` | 단일 사각형 스켈레톤 | `tok?`, `width?`, `height?`, `radius?`, `pulse?` |
| `<SkeletonCard>` | 카드 모양 스켈레톤 | `tok`, `height?`, `radius?`, `pulse?` |
| `<LoadingRunner>` | 12프레임 러닝 로더 (인라인) | `size?`(96), `duration?`(1s) |
| `<LoadingRunnerOverlay>` | `loading.tsx` 표준 fixed 오버레이 | `placement?`('bottom'\|'center'\|'top'), `size?`(80), `duration?`(1s) |

### 아이콘 (`components/shared/icons.tsx`)

`color` 미지정 시 `currentColor` (부모 텍스트 색 상속). 사이즈는 각 아이콘별 합리적 기본값.

```
IconChevronLeft   IconChevronRight   IconClose
IconUser          IconHome           IconHeart  (filled?)
IconSearch        IconAlert
IconPencil        IconTrash
```

> **주의**: `components/map/PrefsIsland.tsx` 와 `components/onboarding/RoommateChecklist.tsx` 의
> 같은 이름 아이콘은 다른 디자인이므로 별도로 둔다. 공용 아이콘으로 교체하지 말 것.

### 훅

| 훅 | 용도 |
|---|---|
| `useTheme()` (lib/hooks) | 클라이언트에서 `{ theme, tok, setTheme }` 즉시 반환 (lazy init, hydration-safe) |
| `getServerThemeTokens()` (lib/theme-server) | 서버 컴포넌트에서 `{ theme, tok }` 반환 |

### 새 페이지 보일러플레이트

```tsx
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'

export default async function NewPage() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeader tok={tok} title="제목" backHref="/" />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok} padding={20}>
          {/* 내용 */}
        </Card>
      </div>
    </PageWrapper>
  )
}
```

### 신규 컴포넌트 추출 기준

- **2곳 이상 동일 JSX·스타일이 반복**되면 추출.
- 추출 시 `tok: ThemeTokens`를 prop으로 받아 다크/라이트 양쪽 동작 보장.
- 인라인 hex/rgba 금지 — 토큰에 없으면 토큰을 먼저 추가.
- 추출 후 이 문서의 위 표에 한 줄 추가.
