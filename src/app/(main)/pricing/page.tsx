import "./pricing.css";
import type { Metadata } from "next";
import Link from "next/link";
import { IconCheckCircle, IconInfo } from "@/components/icons";

export const metadata: Metadata = {
  title: "Bảng giá khóa học",
  description:
    "Bảng giá minh bạch theo từng khóa, xem bài học mẫu trước khi mua và chính sách hoàn tiền trong 30 ngày.",
  alternates: {
    canonical: "https://cungcontuhoc.io.vn/pricing",
  },
  openGraph: {
    title: "Bảng giá khóa học — Cùng Con Tự Học",
    description: "Mua theo từng khóa · Thanh toán nhanh · Hoàn tiền 30 ngày",
    url: "https://cungcontuhoc.io.vn/pricing",
    type: "website",
  },
};

const FAQ_ITEMS = [
  {
    q: "Thanh toán như thế nào?",
    a: "Bạn có thể thanh toán bằng chuyển khoản hoặc QR theo hướng dẫn trên trang thanh toán.",
  },
  {
    q: "Khi nào khóa học được kích hoạt?",
    a: "Khóa học được kích hoạt tự động ngay sau khi giao dịch được xác nhận thành công.",
  },
  {
    q: "Chính sách hoàn tiền ra sao?",
    a: "Bạn có thể yêu cầu hoàn tiền trong 30 ngày đầu nếu khóa học chưa phù hợp với nhu cầu.",
  },
  {
    q: "Có thể xem thử trước khi mua không?",
    a: "Có. Bạn có thể xem bài học mẫu trước, sau đó mua ngay khi đã sẵn sàng.",
  },
] as const;

const CONVERSION_POINTS = [
  {
    title: "Mua nhanh, thao tác gọn",
    description: "Quy trình thanh toán ngắn gọn, phù hợp với phụ huynh bận rộn.",
  },
  {
    title: "Chọn đúng khóa con đang cần",
    description: "Mua theo từng khóa độc lập thay vì phải cam kết gói lớn ngay từ đầu.",
  },
  {
    title: "Giảm rủi ro khi quyết định",
    description: "Có bài học mẫu trước khi mua và chính sách hoàn tiền trong 30 ngày.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Bảng giá minh bạch theo từng khóa</h1>
        <p>
          Chọn khóa phù hợp với mục tiêu của con, thanh toán nhanh và bắt đầu học ngay sau khi giao dịch được xác
          nhận.
        </p>
        <div className="hero-actions">
          <Link href="/courses" className="solid-button">
            Xem danh sách khóa
          </Link>
          <Link href="/courses" className="ghost-button">
            Xem bài học mẫu
          </Link>
        </div>
        <p className="pricing-hero-proof">Lộ trình rõ ràng: xem thử → chọn khóa → kích hoạt tự động.</p>
      </section>

      <section className="card pricing-conversion">
        <h2>Vì sao phụ huynh dễ ra quyết định?</h2>
        <div className="pricing-conversion-grid">
          {CONVERSION_POINTS.map((point) => (
            <article key={point.title} className="pricing-conversion-item">
              <h3>{point.title}</h3>
              <p className="muted-text">{point.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card pricing-social-proof">
        <p className="muted-text pricing-trust-row">
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Thanh toán nhanh
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Hoàn tiền 30 ngày
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Kích hoạt tự động
          </span>
        </p>
      </section>

      <section className="card">
        <div style={{ display: "grid", gap: "0.4rem" }}>
          <h2>Các khóa học đang mở</h2>
          <p className="muted-text">Giá bán và ưu đãi được cập nhật trực tiếp trên từng trang chi tiết khóa học.</p>
          <p className="pricing-card__tip muted-text">
            <IconInfo size={14} className="pricing-tip-icon" />
            Giá niêm yết và giá ưu đãi có thể thay đổi theo từng giai đoạn chương trình.
          </p>
        </div>
        <div style={{ marginTop: "0.8rem" }}>
          <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
            Chọn khóa học ngay
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>Câu hỏi thường gặp</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={idx} className="faq-item">
              <summary className="faq-question">{item.q}</summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card pricing-final-cta">
        <h2>Sẵn sàng bắt đầu?</h2>
        <p className="muted-text">Xem bài mẫu trước, sau đó chọn đúng khóa để con học đều và tiến bộ rõ ràng.</p>
        <div className="pricing-final-cta__actions">
          <Link href="/courses" className="solid-button">
            Xem khóa học
          </Link>
          <Link href="/blog" className="ghost-button">
            Đọc cẩm nang cho phụ huynh
          </Link>
        </div>
      </section>
    </div>
  );
}

