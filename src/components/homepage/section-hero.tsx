import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function SectionHero() {
  return (
    <section id="home-hero" className="hp-section hp-hero">
      <div className="hp-section-inner hp-hero-inner">
        <div className="hp-hero-grid">
          <div className="hp-hero-copy">
            <span className="hp-top-badge">
              <Sparkles size={15} aria-hidden />
              Dùng thử miễn phí 7 ngày
            </span>

            <h1>Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ theo lộ trình</h1>

            <p>
              Cùng Con Tự Học giúp trẻ 2-6 tuổi học qua video ngắn, hoạt động
              offline và bài kiểm tra nhẹ nhàng &mdash; với báo cáo tuần để phụ
              huynh yên tâm.
            </p>

            <div className="hp-hero-actions">
              <Link href="/auth/signup" className="solid-button">
                Dùng thử 7 ngày miễn phí
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/pricing" className="ghost-button hp-ghost-on-dark">
                Xem bảng giá
              </Link>
            </div>

            <p className="hp-hero-note">
              Không cần thẻ tín dụng · Hủy bất kỳ lúc nào
            </p>
          </div>

          <div className="hp-hero-visual" aria-hidden>
            <div className="hp-orb hp-orb-main" />
            <div className="hp-orb hp-orb-accent" />
            <div className="hp-mini-card">
              <strong>3 bước học mỗi ngày</strong>
              <span>Video · Hoạt động · Quiz</span>
            </div>
            <div className="hp-mini-card hp-mini-card-offset">
              <strong>Báo cáo tuần</strong>
              <span>Tự động gửi cho phụ huynh</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
