import "./for-schools.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Phần Mềm Học Tập Cho Trường Mầm Non — Cùng Con Tự Học",
  description:
    "Nền tảng Toán tư duy + Tiếng Anh Phonics cho trường mầm non. Dashboard giáo viên, báo cáo phụ huynh, đăng ký hàng loạt bằng CSV. Dùng thử miễn phí 30 ngày.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/for-schools" },
  openGraph: {
    title: "Phần Mềm Học Tập Cho Trường Mầm Non — Cùng Con Tự Học",
    description: "Dashboard giáo viên · Báo cáo phụ huynh tự động · Đăng ký hàng loạt bằng CSV",
    url: "https://cungcontuhoc.io.vn/for-schools",
    type: "website",
  },
};

const BENEFITS = [
  {
    icon: "📱",
    title: "Không cần thiết bị",
    desc: "Học sinh học trên bất kỳ điện thoại hoặc tablet nào. Không cần cài app, không cần thiết bị chuyên dụng.",
  },
  {
    icon: "📊",
    title: "Báo cáo tự động",
    desc: "Phụ huynh nhận báo cáo tiến độ hàng tuần qua email. Giáo viên xem tiến độ toàn lớp trên dashboard.",
  },
  {
    icon: "⚡",
    title: "Triển khai nhanh",
    desc: "Đăng ký trong 1 ngày, tải lên danh sách học sinh bằng CSV. Không cần đào tạo kỹ thuật.",
  },
];

const PLANS = [
  {
    name: "Thử nghiệm",
    price: "Miễn phí",
    desc: "1 lớp, tối đa 30 học sinh, 30 ngày",
    highlight: false,
  },
  {
    name: "Trường nhỏ",
    price: "Liên hệ",
    desc: "Dưới 200 học sinh, hỗ trợ setup và đào tạo giáo viên",
    highlight: true,
  },
  {
    name: "Trường lớn",
    price: "Liên hệ",
    desc: "200+ học sinh, white-label, SLA, báo cáo theo yêu cầu",
    highlight: false,
  },
];

export default function ForSchoolsPage() {
  return (
    <div className="page-stack">
      {/* Hero */}
      <section className="schools-hero">
        <div className="schools-hero-inner">
          <div className="schools-hero-badge">Dành cho trường mầm non</div>
          <h1 className="schools-hero-title">
            Nền tảng học tập số cho trường mầm non —<br />
            <span className="schools-hero-accent">triển khai trong 1 ngày</span>
          </h1>
          <p className="schools-hero-sub">
            Toán tư duy + Tiếng Anh Phonics. Dashboard cho giáo viên. Báo cáo phụ huynh tự động.
          </p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button schools-hero-cta">
            Đăng ký demo miễn phí
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="container">
        <h2 className="schools-section-title">Lợi ích cho trường học</h2>
        <div className="card-grid">
          {BENEFITS.map((b) => (
            <article key={b.title} className="card schools-benefit-card">
              <span className="schools-benefit-icon" aria-hidden="true">{b.icon}</span>
              <h3 className="schools-benefit-title">{b.title}</h3>
              <p className="schools-benefit-desc">{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container">
        <h2 className="schools-section-title">Gói dành cho trường</h2>
        <div className="card-grid">
          {PLANS.map((p) => (
            <article key={p.name} className={`card schools-plan-card ${p.highlight ? "schools-plan-highlight" : ""}`}>
              <div className="schools-plan-name">{p.name}</div>
              <div className="schools-plan-price">{p.price}</div>
              <p className="schools-plan-desc">{p.desc}</p>
              <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="ghost-button schools-plan-cta">
                Liên hệ tư vấn
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="schools-demo-cta container">
        <div className="page-card schools-demo-inner">
          <h2>Xem demo trong 15 phút — không cần cài đặt</h2>
          <p>Chúng tôi sẽ hướng dẫn toàn bộ quy trình setup cho trường của bạn qua video call.</p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button">
            Đặt lịch demo ngay
          </Link>
        </div>
      </section>
    </div>
  );
}
