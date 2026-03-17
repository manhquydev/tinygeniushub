"use client";


import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track-event";

interface SiteFooterProps {
  hasParent?: boolean;
}

export function SiteFooter({ hasParent = false }: SiteFooterProps) {
  const pathname = usePathname() ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const currentYear = new Date().getFullYear();

  if (isAdminRoute) {
    return null;
  }

  const trackFooterNavigation = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/")) return;

    const label = anchor.textContent?.trim() || href;
    trackEvent("nav_click", {
      state: hasParent ? "parent" : "guest",
      location: "footer",
      label,
      href,
    });
  };

  return (
    <footer className="site-footer" onClickCapture={trackFooterNavigation}>
      <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-6 lg:px-4">
        {/* Main grid: Brand + Nav */}
        <div className="footer-main">
          {/* ── Brand Column ── */}
          <div className="footer-brand">
            <Link href="/" className="footer-brand-logo" aria-label="Trang chủ Cùng Con Tự Học">
              <Image
                src="/logos/tinygeniushub_logo_stacked.png"
                alt="TinyGeniusHub Logo"
                width={848}
                height={1264}
                className="footer-logo-image"
              />
            </Link>

            <p className="footer-tagline">
              Toán &amp; Tiếng Anh cho bé 2–6 tuổi.
              <br />
              Mỗi ngày 15 phút, thấy rõ con tiến bộ.
            </p>

            {/* Social links */}
            <div className="footer-social">
              <a
                href="https://facebook.com/cungcontuhoc"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Facebook Cùng Con Tự Học"
              >
                {/* Facebook Brand Color */}
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  <path fill="#fff" d="M16.671 15.542l.532-3.469h-3.328V9.823c0-.949.465-1.874 1.956-1.874h1.514V5s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.642H7.078v3.469h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z"/>
                </svg>
              </a>

              <a
                href="https://youtube.com/@cungcontuhoc"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="YouTube Cùng Con Tự Học"
              >
                {/* YouTube Brand Color */}
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              <a
                href="https://tiktok.com/@cungcontuhoc"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="TikTok Cùng Con Tự Học"
              >
                {/* TikTok Brand Color */}
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.12-1.02 4.13-2.6 5.56-1.57 1.4-3.72 2.05-5.83 1.83-2.12-.21-4.14-1.25-5.5-2.83-1.37-1.59-2.02-3.76-1.78-5.87.23-2.07 1.25-4.04 2.8-5.41 1.57-1.38 3.73-2.01 5.84-1.78v4.02c-1.07-.15-2.18.06-3.06.6-1.01.62-1.73 1.64-1.88 2.82-.14 1.11.16 2.27.83 3.14.67.88 1.76 1.42 2.88 1.46 1.14.04 2.3-.39 3.08-1.2.78-.81 1.2-1.92 1.23-3.06.05-3.32.02-6.64.02-9.96.01-4.06.01-8.12.01-12.18z" fill="#000000" />
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.12-1.02 4.13-2.6 5.56-1.57 1.4-3.72 2.05-5.83 1.83-2.12-.21-4.14-1.25-5.5-2.83-1.37-1.59-2.02-3.76-1.78-5.87.23-2.07 1.25-4.04 2.8-5.41 1.57-1.38 3.73-2.01 5.84-1.78v4.02c-1.07-.15-2.18.06-3.06.6-1.01.62-1.73 1.64-1.88 2.82-.14 1.11.16 2.27.83 3.14.67.88 1.76 1.42 2.88 1.46 1.14.04 2.3-.39 3.08-1.2.78-.81 1.2-1.92 1.23-3.06.05-3.32.02-6.64.02-9.96.01-4.06.01-8.12.01-12.18z" fill="url(#tiktokColor)" />
                  <defs>
                    <linearGradient id="tiktokColor" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#25F4EE" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#000000" stopOpacity="1" />
                      <stop offset="100%" stopColor="#FE2C55" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                </svg>
              </a>

              <a
                href="https://zalo.me/cungcontuhoc"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Zalo Cùng Con Tự Học"
              >
                {/* Zalo Brand Color */}
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#0068FF" d="M12 2C6.477 2 2 6.477 2 12c0 2.288.777 4.398 2.08 6.068l-1.05 2.502a.75.75 0 0 0 .973.973l2.502-1.05A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  <text x="12" y="15.5" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="sans-serif" fill="#fff">Zalo</text>
                </svg>
              </a>
            </div>


          </div>

          {/* ── Nav Columns ── */}
          <nav className="footer-nav-grid" aria-label="Điều hướng chân trang">
            <div className="footer-col">
              <p className="footer-col-title">Sản phẩm</p>
              <Link href="/#features">Tính năng</Link>
              <Link href="/pricing">Bảng giá</Link>
              <Link href="/courses">Khóa học</Link>
              <Link href="/for-schools">Cho trường học</Link>
              <Link href="/#faq">Câu hỏi thường gặp</Link>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">Công ty</p>
              <Link href="/about">Giới thiệu</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/contact">Liên hệ</Link>
              <Link href="/referral">Giới thiệu bạn</Link>
              <Link href="/gift-code">Mã quà tặng</Link>
              <Link href="/waitlist">Đặt chỗ sớm</Link>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">Tài khoản</p>
              <Link href="/auth/login">Đăng nhập</Link>
              <Link href="/auth/signup">Đăng ký</Link>
              <p className="footer-col-title" style={{ marginTop: "0.75rem" }}>Pháp lý</p>
              <Link href="/privacy">Chính sách bảo mật</Link>
              <Link href="/terms">Điều khoản sử dụng</Link>
              <Link href="/refund-policy">Chính sách hoàn tiền</Link>
            </div>
          </nav>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-bottom-copy">
            <span className="footer-bottom-flag">🇻🇳</span>
            <span>© {currentYear} Cùng Con Tự Học. Bảo lưu mọi quyền.</span>
          </p>
          <div className="footer-bottom-links">
            <Link href="/privacy">Bảo mật</Link>
            <Link href="/terms">Điều khoản</Link>
            <Link href="/refund-policy">Hoàn tiền</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
