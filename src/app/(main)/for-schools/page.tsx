import "./for-schools.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giải pháp học tập cho trường mầm non — TinyGenius Hub",
  description:
    "Nền tảng Toán tư duy + Tiếng Anh Phonics cho trường mầm non: bảng điều khiển giáo viên, báo cáo phụ huynh và nhập danh sách học sinh nhanh.",
  alternates: { canonical: "https://tinygeniushubvn.tech/for-schools" },
  openGraph: {
    title: "Giải pháp học tập cho trường mầm non — TinyGenius Hub",
    description: "Bảng điều khiển giáo viên · Báo cáo phụ huynh · Khởi tạo nhanh",
    url: "https://tinygeniushubvn.tech/for-schools",
    type: "website",
  },
};

const BENEFITS = [
  {
    icon: "📱",
    title: "Không cần thiết bị chuyên dụng",
    desc: "Học sinh có thể học trên điện thoại hoặc máy tính bảng phổ biến, không cần cài ứng dụng phức tạp.",
  },
  {
    icon: "📊",
    title: "Báo cáo tự động",
    desc: "Phụ huynh nhận báo cáo tuần, giáo viên theo dõi hoạt động theo từng lớp ngay trên hệ thống.",
  },
  {
    icon: "⚡",
    title: "Triển khai nhanh",
    desc: "Khởi tạo trong thời gian ngắn và nhập danh sách học sinh theo tệp CSV.",
  },
];

const PLANS = [
  {
    name: "Gói trải nghiệm",
    price: "Liên hệ",
    desc: "Thử nghiệm cho một lớp với hỗ trợ triển khai ban đầu.",
    highlight: false,
  },
  {
    name: "Gói tiêu chuẩn",
    price: "Liên hệ",
    desc: "Phù hợp trường dưới 200 học sinh, có hỗ trợ khởi tạo ban đầu.",
    highlight: true,
  },
  {
    name: "Gói mở rộng",
    price: "Liên hệ",
    desc: "Phù hợp trường quy mô lớn, có báo cáo nâng cao và cam kết dịch vụ.",
    highlight: false,
  },
];

export default function ForSchoolsPage() {
  return (
    <div className="page-stack">
      <section className="schools-hero">
        <div className="schools-hero-inner">
          <div className="schools-hero-badge">Dành cho trường mầm non</div>
          <h1 className="schools-hero-title">
            Nền tảng học tập số cho vận hành trường mầm non —<br />
            <span className="schools-hero-accent">triển khai nhanh, dễ áp dụng</span>
          </h1>
          <p className="schools-hero-sub">
            Toán tư duy + Tiếng Anh Phonics, bảng điều khiển giáo viên và báo cáo phụ huynh theo tuần.
          </p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button schools-hero-cta">
            Đặt lịch demo
          </Link>
        </div>
      </section>

      <section className="container">
        <h2 className="schools-section-title">Lợi ích cho nhà trường</h2>
        <div className="card-grid">
          {BENEFITS.map((b) => (
            <article key={b.title} className="card schools-benefit-card">
              <span className="schools-benefit-icon" aria-hidden="true">
                {b.icon}
              </span>
              <h3 className="schools-benefit-title">{b.title}</h3>
              <p className="schools-benefit-desc">{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container">
        <h2 className="schools-section-title">Gói triển khai</h2>
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

      <section className="schools-demo-cta container">
        <div className="page-card schools-demo-inner">
          <h2>Xem sản phẩm qua buổi demo trực tuyến</h2>
          <p>Đội ngũ của chúng tôi sẽ đi cùng nhà trường từ bước thiết lập, vận hành lớp đến trao đổi với phụ huynh.</p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button">
            Đăng ký demo
          </Link>
        </div>
      </section>
    </div>
  );
}
