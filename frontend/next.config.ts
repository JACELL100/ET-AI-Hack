import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Dev proxy: forward /api/* and /ws/* to the FastAPI backend (localhost:8000).
  // This lets the frontend call relative paths (e.g. fetch("/api/v1/health"))
  // during `next dev` without tripping CORS. The axios client in src/lib/api.ts
  // targets NEXT_PUBLIC_API_URL directly, so both paths work.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
      { source: "/ws/:path*", destination: "http://localhost:8000/ws/:path*" },
    ];
  },
};

export default nextConfig;
