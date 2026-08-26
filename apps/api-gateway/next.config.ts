import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // jose ships ESM-only; declaring it here also makes next/jest transpile it
  // for the CJS Jest runtime instead of ignoring it as node_modules.
  transpilePackages: ["jose"],
};

export default nextConfig;
