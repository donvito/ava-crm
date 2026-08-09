import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  async rewrites() {
    const apiOrigin = process.env.CRM_API_ORIGIN ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
