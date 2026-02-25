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

            <h1>Ứng dụng đầu tiên dạy Toán & Tiếng Anh cho bé 2–6 tuổi theo lộ trình</h1>

            <p>
              15 phút mỗi ngày — phụ huynh thấy kết quả rõ ràng sau 30 ngày.
              Cùng Con Tự Học kết hợp Toán tư duy và Tiếng Anh Phonics,
              với báo cáo tuần gửi tự động để bạn yên tâm.
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
              Không cần thẻ tín dụng · Hoàn tiền 100% trong 30 ngày
            </p>
          </div>

          <div className="hp-hero-visual" aria-hidden>
            <div className="hp-orb hp-orb-main" />
            <div className="hp-orb hp-orb-accent" />
            <div className="hp-mini-card">
              <strong>Toán tư duy + Tiếng Anh Phonics</strong>
              <span>Lộ trình 2–6 tuổi · Không app nào khác có</span>
            </div>
            <div className="hp-mini-card hp-mini-card-offset">
              <strong>Báo cáo tuần tự động</strong>
              <span>Phụ huynh thấy kết quả sau 30 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
