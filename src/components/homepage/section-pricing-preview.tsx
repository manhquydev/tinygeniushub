import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

const STANDARD_FEATURES = [
  "3 hồ sơ bé",
  "English + Math",
  "Weekly report",
  "Lưu trữ bằng chứng 90 ngày",
];

const FAMILY_FEATURES = [
  "5 hồ sơ bé",
  "Toàn bộ tính năng Standard",
  "Lưu trữ bằng chứng 365 ngày",
  "Báo cáo gộp cho nhiều bé",
];

export function SectionPricingPreview() {
  return (
    <section className="hp-section" id="pricing">
      <div className="hp-section-inner">
        <div className="hp-section-heading">
          <h2>Đầu tư cho con chỉ từ 2,189đ/ngày</h2>
          <p className="muted-text">Hai gói rõ ràng để phụ huynh chọn theo nhu cầu gia đình.</p>
        </div>

        <div className="hp-grid-2">
          {/* Standard */}
          <article className="hp-price-card">
            <h3>Standard</h3>
            <p className="hp-price-main">799,000đ/năm</p>
            <p className="muted-text">~2,189đ/ngày</p>
            <ul className="hp-feature-list">
              {STANDARD_FEATURES.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <Link href="/auth/signup" className="solid-button full-width">
              Chọn Standard
            </Link>
          </article>

          {/* Family+ — recommended */}
          <article className="hp-price-card hp-price-highlight">
            <div className="hp-price-popular-badge">
              <Star size={12} aria-hidden />
              Phổ biến nhất
            </div>
            <h3>Family+</h3>
            <p className="hp-price-main">1,199,000đ/năm</p>
            <p className="muted-text">~3,285đ/ngày · Rẻ hơn 1 ly cà phê</p>
            <div className="hp-price-urgency">
              Còn <strong>7 ngày</strong> dùng thử miễn phí
            </div>
            <ul className="hp-feature-list">
              {FAMILY_FEATURES.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <Link href="/auth/signup" className="solid-button full-width hp-price-cta-main">
              Bắt đầu miễn phí 7 ngày
              <ArrowRight size={14} aria-hidden />
            </Link>
            <p className="hp-price-cta-note">Không cần thẻ · Huỷ bất cứ lúc nào</p>
          </article>
        </div>

        <Link href="/pricing" className="hp-more-link">
          Xem chi tiết bảng giá →
        </Link>
      </div>
    </section>
  );
}
