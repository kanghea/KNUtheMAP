# UI·스타일링

## 개요
Tailwind CSS 4 + CSS 변수 기반 테마 시스템. 외부 컴포넌트 라이브러리 없이 전부 커스텀 구현.

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/globals.css` | Tailwind 4 (@import/@theme inline), 다크/라이트 CSS 변수, Mapbox 팝업 스타일, 애니메이션 |
| `lib/theme-tokens.ts` | `ThemeTokens` 인터페이스 (pageBg, cardBg, textPrimary 등) + `THEME_TOKENS` 객체 (dark/light) |
| `lib/prefs.ts` | `UserPrefs` 쿠키 구조 (theme: 'dark'\|'light'), 온보딩 우선순위 팩터 정의 |
| `lib/factor-icons.tsx` | 온보딩 UI용 팩터 아이콘·라벨 정의 |
| `components/shared/` | 공통 UI 컴포넌트 |
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
