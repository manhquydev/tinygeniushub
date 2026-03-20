import "./pricing.css";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutPlanButton } from "@/components/checkout-plan-button";
import { IconCheckCircle, IconInfo } from "@/components/icons";
import { getParentFromServerCookie } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Bảng giá",
  description:
    "Dùng thử miễn phí 7 ngày, không cần thẻ tín dụng. Gói Standard 799,000 VND/năm và Family+ 1,199,000 VND/năm, hoàn tiền 100% trong 30 ngày.",
  alternates: {
    canonical: "https://cungcontuhoc.io.vn/pricing",
  },
  openGraph: {
    title: "Bảng giá — Cùng Con Tự Học",
    description: "Gói Standard 799,000 VND/năm · Family+ 1,199,000 VND/năm · Dùng thử 7 ngày miễn phí",
    url: "https://cungcontuhoc.io.vn/pricing",
    type: "website",
  },
};

const FAQ_ITEMS = [
  {
    q: "Dùng thử 7 ngày có cần nhập thẻ tín dụng không?",
    a: "Không. Dùng thử hoàn toàn miễn phí, không yêu cầu thông tin thanh toán. Hết 7 ngày, bạn tự quyết định có tiếp tục hay không.",
  },
  {
    q: "Sau khi mua, tôi có thể hủy bất kỳ lúc nào không?",
    a: "Có. Bạn có thể hủy bất kỳ lúc nào. Quyền lợi của gói vẫn được giữ đến hết kỳ thanh toán đã mua.",
  },
  {
    q: "Chính sách hoàn tiền như thế nào?",
    a: "Hoàn tiền 100% trong 30 ngày đầu sau khi thanh toán, không cần giải thích lý do. Liên hệ support để yêu cầu.",
  },
  {
    q: "Tôi có thể nâng cấp từ Standard lên Family+ không?",
    a: "Có. Liên hệ support và chúng tôi sẽ tính số ngày còn lại, bạn chỉ trả thêm phần chênh lệch.",
  },
  {
    q: "Gói Standard dùng được cho mấy bé?",
    a: "Gói Standard cho phép tối đa 3 hồ sơ bé và 2 caregiver. Gói Family+ tăng lên 5 hồ sơ bé và 4 caregiver.",
  },
  {
    q: "Thanh toán bằng hình thức nào?",
    a: "Chuyển khoản ngân hàng, ví điện tử MoMo, ZaloPay và các cổng thanh toán trực tuyến phổ biến tại Việt Nam.",
  },
] as const;

const CONVERSION_POINTS = [
  {
    title: "Giữ thói quen học không gián đoạn",
    description: "Con đang có đà học 15 phút/ngày, gói năm giúp duy trì liên tục thay vì đứt quãng sau trial.",
  },
  {
    title: "Tiết kiệm rõ ràng khi chọn gói năm",
    description: "Standard năm 799,000 VND thay vì 1,188,000 VND nếu trả tháng. Gia đình tiết kiệm ngay 389,000 VND/năm.",
  },
  {
    title: "Rủi ro gần như bằng 0",
    description: "Dùng thử 7 ngày không cần thẻ và hoàn tiền 100% trong 30 ngày đầu nếu chưa phù hợp.",
  },
] as const;

export default async function PricingPage() {
  const parent = await getParentFromServerCookie();

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Bảng giá rõ ràng cho phụ huynh Việt</h1>
        <p>
          Dùng thử 7 ngày để thấy con tiến bộ thật sự. Sau trial, chọn gói năm để giữ nguyên lộ trình và
          tiết kiệm hơn so với thanh toán tháng.
        </p>
        <div className="hero-actions">
          {!parent ? (
            <Link href="/auth/signup" className="solid-button">
              Dùng thử 7 ngày miễn phí
            </Link>
          ) : (
            <Link href="/parent/dashboard" className="solid-button">
              Quay về dashboard
            </Link>
          )}
          <Link href="/parent/reports" className="ghost-button">
            Xem mẫu báo cáo tuần
          </Link>
        </div>
        <p className="pricing-hero-proof">
          Gợi ý chốt nhanh: chọn trial trước, xem báo cáo tuần đầu tiên, rồi nâng cấp gói năm để giữ nhịp
          học cho bé.
        </p>
      </section>

      <section className="card-grid pricing-grid" id="pricing-plans">
        <article className="card pricing-card pricing-card--featured">
          <div className="pricing-badge pricing-badge--popular">Phổ biến nhất</div>
          <h2>Standard</h2>
          <div className="pricing-amount">
            <span className="pricing-amount__main">799,000 VND</span>
            <span className="pricing-amount__period">/ năm</span>
          </div>
          <p className="pricing-amount__monthly">
            <strong>Chỉ 66,583 VND/tháng</strong>
            <span className="pricing-badge pricing-badge--savings">Tiết kiệm 33%</span>
          </p>
          <p>
            <strong>3 hồ sơ bé · 2 caregiver</strong>
          </p>
          <ul>
            <li>English + Math full track</li>
            <li>Weekly report in-app + email</li>
            <li>Portfolio retention 90 ngày</li>
            <li>Báo cáo tiến độ theo tuần</li>
            <li>Dùng trên mọi thiết bị</li>
          </ul>
          {parent ? (
            <CheckoutPlanButton planCode="YEARLY_STANDARD" label="Chọn Standard năm" />
          ) : (
            <Link href="/auth/signup" className="solid-button">
              Dùng thử rồi chọn Standard
            </Link>
          )}
        </article>

        <article className="card pricing-card">
          <h2>Family+</h2>
          <div className="pricing-amount">
            <span className="pricing-amount__main">1,199,000 VND</span>
            <span className="pricing-amount__period">/ năm</span>
          </div>
          <p className="pricing-amount__monthly">
            <strong>Chỉ 99,917 VND/tháng</strong>
            <span className="pricing-badge pricing-badge--savings">Tiết kiệm 33%</span>
          </p>
          <p>
            <strong>5 hồ sơ bé · 4 caregiver</strong>
          </p>
          <ul>
            <li>Toàn bộ quyền lợi Standard</li>
            <li>Portfolio retention đến 365 ngày</li>
            <li>Báo cáo gộp theo gia đình</li>
            <li>Ưu tiên hỗ trợ</li>
            <li>Phù hợp gia đình nhiều bé</li>
          </ul>
          {parent ? (
            <CheckoutPlanButton planCode="YEARLY_FAMILY_PLUS" label="Chọn Family+ năm" />
          ) : (
            <Link href="/auth/signup" className="solid-button">
              Dùng thử rồi chọn Family+
            </Link>
          )}
        </article>

        <article className="card pricing-card pricing-card--muted">
          <div className="pricing-badge pricing-badge--monthly">Thanh toán tháng</div>
          <h2>Standard</h2>
          <div className="pricing-amount">
            <span className="pricing-amount__main">99,000 VND</span>
            <span className="pricing-amount__period">/ tháng</span>
          </div>
          <p className="pricing-amount__monthly muted-text">1,188,000 VND/năm nếu thanh toán tháng</p>
          <p>
            <strong>3 hồ sơ bé · 2 caregiver</strong>
          </p>
          <ul>
            <li>English + Math full track</li>
            <li>Weekly report in-app + email</li>
            <li>Portfolio retention 90 ngày</li>
          </ul>
          <p className="pricing-card__tip muted-text">
            <IconInfo size={14} className="pricing-tip-icon" />
            Chọn gói năm để tiết kiệm 33% — 799,000 VND thay vì 1,188,000 VND
          </p>
          {!parent && (
            <Link href="/auth/signup" className="ghost-button pricing-card__cta">
              Dùng thử trước
            </Link>
          )}
        </article>
      </section>

      <section className="card pricing-conversion">
        <h2>Lý do phụ huynh chốt gói năm ngay sau trial</h2>
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
            <IconCheckCircle size={15} /> Không cần thẻ tín dụng
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Hoàn tiền 30 ngày
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> Hủy bất kỳ lúc nào
          </span>
        </p>
      </section>

      <section className="card">
        <div style={{ display: "grid", gap: "0.4rem" }}>
          <h2>Khóa học Premium</h2>
          <p className="muted-text">Học chuyên sâu — không cần đăng ký gói dịch vụ</p>
        </div>
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <article
            style={{
              border: "1px solid rgba(15,23,42,0.1)",
              borderRadius: 16,
              padding: "1.2rem",
              background: "rgba(255,255,255,0.7)",
              display: "grid",
              gap: "0.6rem",
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Toán Tư Duy</h3>
            <p className="muted-text" style={{ fontSize: "0.88rem" }}>
              Lộ trình 30 ngày giúp bé phát triển tư duy logic và kỹ năng toán học nền tảng.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--brand-700)" }}>299,000đ</span>
              <span className="muted-text" style={{ fontSize: "0.82rem" }}>
                30 ngày
              </span>
            </div>
            <Link href="/courses" className="ghost-button" style={{ width: "fit-content", fontSize: "0.88rem" }}>
              Xem khóa học
            </Link>
          </article>
          <article
            style={{
              border: "1px solid rgba(15,23,42,0.1)",
              borderRadius: 16,
              padding: "1.2rem",
              background: "rgba(255,255,255,0.7)",
              display: "grid",
              gap: "0.6rem",
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Tiếng Anh Phonics</h3>
            <p className="muted-text" style={{ fontSize: "0.88rem" }}>
              Lộ trình 60 ngày xây dựng nền tảng đọc tiếng Anh theo phương pháp phonics chuẩn quốc tế.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--brand-700)" }}>499,000đ</span>
              <span className="muted-text" style={{ fontSize: "0.82rem" }}>
                60 ngày
              </span>
            </div>
            <Link href="/courses" className="ghost-button" style={{ width: "fit-content", fontSize: "0.88rem" }}>
              Xem khóa học
            </Link>
          </article>
        </div>
        <p className="muted-text" style={{ fontSize: "0.88rem" }}>
          * Đăng ký gói Standard hoặc Family+: giảm thêm 20% cho tất cả khóa học
        </p>
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
        <h2>Sẵn sàng giữ lộ trình 12 tháng cho bé?</h2>
        <p className="muted-text">
          Bắt đầu bằng trial 7 ngày miễn phí. Sau đó chọn Standard hoặc Family+ để duy trì tiến độ học đều mỗi
          tuần.
        </p>
        <div className="pricing-final-cta__actions">
          {!parent ? (
            <Link href="/auth/signup" className="solid-button">
              Bắt đầu trial ngay
            </Link>
          ) : (
            <Link href="/parent/dashboard" className="solid-button">
              Vào dashboard và chọn gói
            </Link>
          )}
          <Link href="#pricing-plans" className="ghost-button">
            So sánh lại các gói
          </Link>
        </div>
      </section>
    </div>
  );
}
