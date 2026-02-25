"use client";

import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="Trang chủ Cùng Con Tự Học">
            <Image src="/logo-cungcontuhoc-horizontal.svg" alt="Cùng Con Tự Học Logo" width={200} height={55} />
          </Link>
          <p className="footer-tagline">
            Learning Journey OS cho phụ huynh Việt.
            <br />
            Mỗi ngày 15 phút, thấy rõ con tiến bộ.
          </p>
        </div>

        <nav className="footer-links-group">
          <div className="footer-col">
            <p className="footer-col-title">Sản phẩm</p>
            <Link href="/#features">Tính năng</Link>
            <Link href="/pricing">Bảng giá</Link>
            <Link href="/#faq">Câu hỏi thường gặp</Link>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Về chúng tôi</p>
            <Link href="/about">Giới thiệu</Link>
            <Link href="/contact">Liên hệ</Link>
            <Link href="/referral">Giới thiệu bạn</Link>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Pháp lý</p>
            <Link href="/privacy">Chính sách bảo mật</Link>
            <Link href="/terms">Điều khoản sử dụng</Link>
            <Link href="/refund-policy">Chính sách hoàn tiền</Link>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Tài khoản</p>
            <Link href="/auth/login">Đăng nhập</Link>
            <Link href="/auth/signup">Đăng ký</Link>
          </div>
        </nav>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Cùng Con Tự Học. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
