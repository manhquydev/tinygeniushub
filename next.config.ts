import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://connect.facebook.net",
      "https://www.clarity.ms",
      "https://*.clarity.ms",
    ];
    if (isDev) {
      scriptSrc.push("'unsafe-eval'");
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
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
              "frame-ancestors 'self'",
              "form-action 'self'",
              `script-src ${scriptSrc.join(" ")}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "media-src 'self' blob: https:",
              "worker-src 'self' blob:",
              "connect-src 'self' https: ws: wss: https://www.clarity.ms https://*.clarity.ms",
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
      { source: "/chinh-sach-cookie", destination: "/cookie-policy", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
