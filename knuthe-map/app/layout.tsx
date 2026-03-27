import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import PrefsIsland from "@/components/map/PrefsIsland";
import Providers from "./providers";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Role } from "@/lib/useRole";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "KNUtheMAP",
  description: "경북대학교 주변 건물 정보 지도",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let role: Role = 'tenant'
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (data?.role) role = data.role as Role
    }
  } catch {}

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Suspense><PrefsIsland initialRole={role} /></Suspense>
        </Providers>
      </body>
    </html>
  );
}
