import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import PrefsIsland from "@/components/map/PrefsIsland";
import Providers from "./providers";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Role } from "@/lib/useRole";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
