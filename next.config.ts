import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
