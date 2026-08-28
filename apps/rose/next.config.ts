import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@machi-asia/ui",
    "@machi-asia/auth",
    "@machi-asia/rose",
    "@machi-asia/api-gateway",
    "@machi-asia/media-library",
  ],
};

export default nextConfig;