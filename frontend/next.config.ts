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
  // ── API proxy ─────────────────────────────────────────────────────────
  // Dev:  Proxies /api/* to localhost:8000 (avoids CORS during next dev).
  // Prod: Proxies /api/* to your Render backend URL so the browser only
  //       talks to the Vercel domain — no CORS issues at all.
  //
  //       Set NEXT_PUBLIC_API_URL in the Vercel dashboard:
  //         https://your-backend.onrender.com
  //
  // NOTE: Vercel rewrites do NOT support WebSocket.  WebSocket connections
  //       (SENTINEL stream, WhatsApp bridge) use NEXT_PUBLIC_WS_URL to
  //       connect directly to the Render backend.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
