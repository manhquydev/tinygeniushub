import "./pricing.css";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutPlanButton } from "@/components/checkout-plan-button";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { IconCheckCircle, IconInfo } from "@/components/icons";

export const metadata: Metadata = {
  title: "Bảng giá",
  description:
    "Dùng thử miễn phí 7 ngày, không cần thẻ tín dụng. Gói Standard chỉ 10,000 VND/tháng — rẻ hơn 1 ly trà sữa cho cả năm học.",
  alternates: {
    canonical: "https://cungcontuhoc.vn/pricing",
  },
  openGraph: {
    title: "Bảng giá — Cùng Con Tự Học",
    description: "Gói Standard 120,000 VND/năm · Family+ 240,000 VND/năm · Dùng thử 7 ngày miễn phí",
    url: "https://cungcontuhoc.vn/pricing",
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
    a: "Có. Bạn có thể hủy bất kỳ lúc nào. Quyền lợi của gói vẫn được giữ cho đến hết kỳ thanh toán đã mua.",
  },
  {
    q: "Chính sách hoàn tiền như thế nào?",
    a: "Hoàn tiền 100% trong 7 ngày đầu sau khi thanh toán, không cần giải thích lý do. Liên hệ support để yêu cầu.",
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
];

export default async function PricingPage() {
  const parent = await getParentFromServerCookie();

  return (
    <div className="page-stack">
      {/* Hero */}
      <section className="hero">
        <h1>Bảng giá rõ ràng cho phụ huynh Việt</h1>
        <p>
          Dùng thử 7 ngày để thấy con tiến bộ thật sự. Sau trial, chọn gói năm để giữ nguyên lộ trình — giá chỉ bằng
          1 ly cà phê mỗi tháng.
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
      </section>

      {/* Pricing Cards */}
      <section className="card-grid pricing-grid">
        {/* Standard Annual — PRIMARY / PRE-SELECTED */}
        <article className="card pricing-card pricing-card--featured">
          <div className="pricing-badge pricing-badge--popular">Phổ biến nhất</div>
          <h2>Standard</h2>
          <div className="pricing-amount">
            <span className="pricing-amount__main">120,000 VND</span>
            <span className="pricing-amount__period">/ năm</span>
          </div>
          <p className="pricing-amount__monthly">
            <strong>Chỉ 10,000 VND/tháng</strong>
            <span className="pricing-badge pricing-badge--savings">Tiết kiệm 50%</span>
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

        {/* Family+ Annual */}
        <article className="card pricing-card">
          <h2>Family+</h2>
          <div className="pricing-amount">
            <span className="pricing-amount__main">240,000 VND</span>
            <span className="pricing-amount__period">/ năm</span>
          </div>
          <p className="pricing-amount__monthly">
            <strong>Chỉ 20,000 VND/tháng</strong>
            <span className="pricing-badge pricing-badge--savings">Tiết kiệm 50%</span>
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

        {/* Monthly Anchor — DE-EMPHASIZED */}
        <article className="card pricing-card pricing-card--muted">
          <div className="pricing-badge pricing-badge--monthly">Thanh toán tháng</div>
          <h2>Standard</h2>
          <div className="pricing-amount">
            <span className="pricing-amount__main">20,000 VND</span>
            <span className="pricing-amount__period">/ tháng</span>
          </div>
          <p className="pricing-amount__monthly muted-text">
            240,000 VND/năm nếu thanh toán tháng
          </p>
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
            Chọn gói năm để tiết kiệm 50% — 120,000 VND thay vì 240,000 VND
          </p>
          {/* Monthly plan: anchor card only — no checkout button intentionally.
              Authenticated users are directed to annual plans via the tip above. */}
          {!parent && (
            <Link href="/auth/signup" className="ghost-button pricing-card__cta">
              Dùng thử trước
            </Link>
          )}
        </article>
      </section>

      {/* Social proof */}
      <section className="card pricing-social-proof">
        <p className="muted-text pricing-trust-row">
          <span className="pricing-trust-item"><IconCheckCircle size={15} /> Không cần thẻ tín dụng</span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item"><IconCheckCircle size={15} /> Hoàn tiền 7 ngày</span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item"><IconCheckCircle size={15} /> Hủy bất kỳ lúc nào</span>
        </p>
      </section>

      {/* FAQ */}
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
    </div>
  );
}
