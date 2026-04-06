<!-- 트리거: Tailwind, 테마 토큰, 컴포넌트 구조, 다크/라이트, ThemeTokens -->
# UI·스타일링

## 기술 스택

- **Tailwind CSS 4** — PostCSS 플러그인 (`@tailwindcss/postcss`)
- **테마 토큰** — `lib/theme-tokens.ts`의 `THEME_TOKENS` 객체 (다크/라이트 두 세트)
- **폰트** — Geist Sans + Geist Mono (로컬 woff2, `public/fonts/`)

## 테마 시스템

`lib/theme-tokens.ts`에 `ThemeTokens` 인터페이스와 `THEME_TOKENS` 객체가 정의되어 있다.

```typescript
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'

const tokens = THEME_TOKENS[mode]  // 'dark' | 'light'
// tokens.pageBg, tokens.cardBg, tokens.textPrimary 등
```

### 주요 토큰

| 토큰 | 용도 |
|---|---|
| `pageBg` | 페이지 배경색 |
| `cardBg` / `cardBorder` | 카드 배경·테두리 |
| `textPrimary` / `textSecondary` / `textTertiary` | 텍스트 계층 |
| `headerBg` / `headerBorder` | 헤더 영역 |
| `inputBg` / `inputBorder` / `inputColor` | 입력 필드 |
| `accentBg` / `accentColor` | 강조 (파란색 계열) |
| `dangerBg` / `dangerColor` | 위험/삭제 |
| `successBg` / `successColor` | 성공 |

## 컴포넌트 디렉토리 구조

```
components/
├── map/            — 지도 관련 (MapView, FilterBar, PrefsIsland 등)
├── shared/         — 공용 UI (MoneyDrumPicker, DepositDial, AreaToggle)
├── auth/           — 인증 UI (LoginButton)
├── review/         — 리뷰 (ReviewSection, ReviewForm, ReviewCard)
├── onboarding/     — 온보딩 스텝 (StepGate, StepRent, StepDeposit 등)
└── contracts/      — 계약 관련 (MyContractsCard)
```

페이지별 컴포넌트는 `app/<route>/_components/` 디렉토리에 둔다.

## 스타일링 규칙

1. 인라인 스타일에 `THEME_TOKENS[mode]` 토큰을 사용하거나, Tailwind 유틸리티 클래스를 사용
2. 하드코딩된 색상 값 금지 — 반드시 토큰 또는 Tailwind 색상 사용
3. `dark:` 프리픽스 대신 `THEME_TOKENS` 객체에서 모드별 값을 사용하는 패턴을 따름

## 흔한 실수

- ❌ 색상을 `#ffffff`, `#000000` 등으로 하드코딩 → 다크/라이트 전환 시 깨짐
  ✅ `THEME_TOKENS[mode].textPrimary` 등 토큰 사용

- ❌ 새 컴포넌트에서 다크 모드만 테스트 → 라이트 모드에서 텍스트 안 보임
  ✅ 양쪽 모드에서 반드시 확인

- ❌ 모바일 뷰포트(375px) 미확인 → 레이아웃 깨짐, 텍스트 잘림
  ✅ 모바일 뷰포트 기준으로 먼저 작업 후 데스크톱 확인

- ❌ `px-4` 등 고정 패딩만 사용 → 큰 화면에서 콘텐츠가 너무 좁음
  ✅ 반응형 패딩 사용 (`px-4 md:px-6 lg:px-8`)
