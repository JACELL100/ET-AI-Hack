import type { NextConfig } from "next";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: process.cwd(),
  },
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
  // during `next dev` without tripping CORS. In production, set
  // NEXT_PUBLIC_API_URL to the Render backend URL so these rewrites keep
  // working on Vercel too.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/ws/:path*", destination: `${backendUrl}/ws/:path*` },
    ];
  },
};

export default nextConfig;
