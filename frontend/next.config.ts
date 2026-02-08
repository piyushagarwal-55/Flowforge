import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking during builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
