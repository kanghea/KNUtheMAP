import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PrefsIsland from "@/components/map/PrefsIsland";
import Providers from "./providers";
import { cookies } from "next/headers";
import { getServerRole } from "@/lib/auth-server";
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
  // knu_role 쿠키 우선 사용 → DB 조회 없이 즉시 반환 (~0ms).
  // 쿠키 없을 때만 getServerRole()로 폴백 (cache()로 page.tsx와 공유).
  let role: Role = 'tenant'
  try {
    const jar        = await cookies()
    const roleCookie = jar.get('knu_role')?.value as Role | undefined
    role = roleCookie ?? await getServerRole()
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
