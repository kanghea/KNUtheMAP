import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PrefsIsland from "@/components/map/PrefsIsland";
import Providers from "./providers";
import { cookies } from "next/headers";
import { getServerRole } from "@/lib/auth-server";
import { unsealRole, ROLE_COOKIE_NAME } from "@/lib/role-cookie";
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
  let role: Role = 'tenant'
  try {
    const jar    = await cookies()
    const sealed = jar.get(ROLE_COOKIE_NAME)?.value
    role = (sealed ? unsealRole(sealed) : null) ?? await getServerRole()
  } catch {}

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <PrefsIsland initialRole={role} />
        </Providers>
      </body>
    </html>
  );
}
