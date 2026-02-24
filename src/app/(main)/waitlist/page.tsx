import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";

export const metadata: Metadata = {
  title: "Đăng ký trước — Cùng Con Tự Học",
  description:
    "Đăng ký trước để nhận thông báo khi Cùng Con Tự Học ra mắt và ưu đãi dành riêng cho 50 gia đình đầu tiên.",
  alternates: { canonical: "https://cungcontuhoc.vn/waitlist" },
  robots: { index: false, follow: false }, // noindex until launch
};

export default function WaitlistPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Tham gia danh sách chờ</h1>
        <p>
          Chúng tôi đang tìm <strong>50 gia đình đầu tiên</strong> để thử nghiệm miễn phí và định hình
          sản phẩm. Đăng ký để nhận ưu đãi ra mắt sớm nhất.
        </p>
      </section>

      <section className="card">
        <h2>Đăng ký nhận thông báo</h2>
        <WaitlistForm />
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Ưu đãi beta</h2>
          <p className="muted-text">50 gia đình đầu tiên nhận 1 tháng Premium miễn phí và không giới hạn feedback trực tiếp với team.</p>
        </article>
        <article className="card">
          <h2>Ra mắt khi nào?</h2>
          <p className="muted-text">Dự kiến tháng 3/2026. Beta families được dùng ngay từ tuần tới.</p>
        </article>
      </section>

      <section style={{ textAlign: "center", padding: "16px 0" }}>
        <p className="muted-text">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" style={{ color: "var(--color-accent)" }}>
            Đăng nhập tại đây
          </Link>
        </p>
      </section>
    </div>
  );
}
