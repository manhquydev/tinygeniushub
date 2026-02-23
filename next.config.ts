import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = ["'self'", "'unsafe-inline'"];
    if (isDev) {
      scriptSrc.push("'unsafe-eval'");
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              `script-src ${scriptSrc.join(" ")}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https: ws: wss:",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/gioi-thieu", destination: "/about", permanent: true },
      { source: "/lien-he", destination: "/contact", permanent: true },
      { source: "/gioi-thieu-ban", destination: "/referral", permanent: true },
      { source: "/chinh-sach-bao-mat", destination: "/privacy", permanent: true },
      { source: "/dieu-khoan-su-dung", destination: "/terms", permanent: true },
      { source: "/chinh-sach-hoan-tien", destination: "/refund-policy", permanent: true },
    ];
  },
};

export default nextConfig;
