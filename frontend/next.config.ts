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
  webpack: (config, { isServer }) => {
    // Fix for quansync module resolution issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        quansync: false,
      };
    }
    return config;
  },
};

export default nextConfig;
