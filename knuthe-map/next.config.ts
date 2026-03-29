import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Turbopack이 knuthe-map 하위 디렉토리를 workspace root로 오인하는 문제 수정.
    // next/package.json을 올바른 위치에서 찾도록 프로젝트 루트를 명시합니다.
    root: process.cwd(),
  },
};

export default nextConfig;
