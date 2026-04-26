import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Turbopack이 knuthe-map 하위 디렉토리를 workspace root로 오인하는 문제 수정.
    // next/package.json을 올바른 위치에서 찾도록 프로젝트 루트를 명시합니다.
    root: process.cwd(),
  },

  // ── 이미지 최적화 ─────────────────────────────────────────────────────
  // next/image 가 외부 호스트 이미지를 최적화하려면 명시적으로 허용해야 함.
  //   * Supabase Storage : 사용자 업로드 (매물·건물·아바타)
  //   * Google avatar    : OAuth 로그인 시 받는 프로필 사진
  //   * Wikimedia        : 존(zone) 히어로 이미지
  //   * Mapbox 정적지도   : 호출 측에서 unoptimized 로 별도 처리 (등록 불필요)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co',         pathname: '/storage/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    // 기본값(640~3840) 은 데스크톱 위주라 모바일에서 과하게 큰 변형이 캐시됨.
    // 본 서비스는 모바일 퍼스트이므로 발생할 가능성이 큰 사이즈만 유지.
    deviceSizes: [375, 480, 640, 768, 1024, 1280],
    imageSizes:  [32, 52, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
