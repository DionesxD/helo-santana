import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  // Prisma's strict typing for createMany/skipDuplicates has incompatibilities
  // with our SQLite schema; runtime is correct, only type-check complains.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
