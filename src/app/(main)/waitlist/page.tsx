import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";
import { IconCalendar, IconStar } from "@/components/icons";
import "./waitlist.css";

export const metadata: Metadata = {
  title: "Danh sách ưu tiên — Cùng Con Tự Học",
  description:
    "Đăng ký danh sách ưu tiên để nhận thông báo mở đợt mới và ưu đãi sớm dành cho gia đình đăng ký trước.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/waitlist" },
  robots: { index: false, follow: false },
};

export default function WaitlistPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Nhận thông báo mở đợt mới</h1>
        <p>
          Chúng tôi ưu tiên <strong>50 gia đình đăng ký sớm</strong> trong mỗi đợt mở mới để tối ưu trải nghiệm và hỗ
          trợ sát sao hơn.
        </p>
      </section>

      <section className="card">
        <h2>Đăng ký nhận thông báo</h2>
        <WaitlistForm />
      </section>

      <section className="card-grid">
        <article className="card waitlist-info-card">
          <IconStar size={28} className="waitlist-card-icon" />
          <h2>Quyền lợi đăng ký sớm</h2>
          <p className="muted-text">Ưu tiên nhận ưu đãi theo từng đợt mở khóa và hỗ trợ nhanh từ đội ngũ vận hành.</p>
        </article>
        <article className="card waitlist-info-card">
          <IconCalendar size={28} className="waitlist-card-icon" />
          <h2>Thời điểm nhận thông tin</h2>
          <p className="muted-text">Bạn sẽ nhận email ngay khi có đợt mở mới, lịch khởi tạo và ưu đãi đi kèm.</p>
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
