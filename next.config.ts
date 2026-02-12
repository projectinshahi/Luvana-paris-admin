import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    cssSupport: {
      "@supports": true,
    },
  },
};

export default nextConfig;
