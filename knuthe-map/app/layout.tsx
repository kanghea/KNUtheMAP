import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import PrefsIsland from "@/components/map/PrefsIsland";
import Providers from "./providers";
import { cookies } from "next/headers";
import { getServerRole } from "@/lib/auth-server";
import { unsealRole, ROLE_COOKIE_NAME } from "@/lib/role-cookie";
import { unsealViewMode, VIEW_MODE_COOKIE_NAME, type ViewMode } from "@/lib/view-mode-cookie";
import { parsePrefs } from "@/lib/prefs";
import type { ThemeMode } from "@/lib/theme-tokens";
import type { Role } from "@/lib/useRole";

const geistSans = localFont({
  src: "../public/fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../public/fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "KNUtheMAP",
  description: "경북대학교 주변 건물 정보 지도",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 암호화된 knu_role 쿠키 우선 복호화 → DB 조회 없이 즉시 반환 (~0ms).
  // unsealRole()이 GCM 인증 태그를 검증하므로 변조된 쿠키는 null 반환.
  // 쿠키 없거나 복호화 실패 시 getServerRole()로 폴백 (cache()로 page.tsx와 공유).
  // 테마 쿠키도 함께 읽어 PrefsIsland에 SSR-동일한 값으로 hydration mismatch 방지.
  //
  // viewMode 쿠키: role과 분리된 "보기 모드"(방보기 ↔ 룸메이트). role이 권한이라면
  // viewMode는 표시. 쿠키 없으면 role을 기준으로 기본값 추정.
  let role:     Role      = 'tenant'
  let theme:    ThemeMode = 'dark'
  let viewMode: ViewMode | null = null
  try {
    const jar    = await cookies()
    const sealed = jar.get(ROLE_COOKIE_NAME)?.value
    role = (sealed ? unsealRole(sealed) : null) ?? await getServerRole()

    const sealedView = jar.get(VIEW_MODE_COOKIE_NAME)?.value
    viewMode = sealedView ? unsealViewMode(sealedView) : null

    const prefsRaw = jar.get('knu_prefs')?.value
    if (prefsRaw) theme = parsePrefs(prefsRaw)?.theme ?? 'dark'
  } catch {}

  // viewMode 쿠키 없으면 role로부터 추정: roommate role → 'roommate', 그 외 → 'rooms'
  const initialViewMode: ViewMode = viewMode ?? (role === 'roommate' ? 'roommate' : 'rooms')

  return (
    <html
      lang="ko"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          {/* PrefsIsland 가 useSearchParams() 를 쓰므로 Suspense 경계 필수 —
              없으면 정적 prerender 시 빌드가 실패한다. */}
          <Suspense fallback={null}>
            <PrefsIsland initialRole={role} initialTheme={theme} initialViewMode={initialViewMode} />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
