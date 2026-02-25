import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export function SectionHero() {
  return (
    <section id="home-hero" className="hp-section hp-hero">
      <div className="hp-section-inner hp-hero-inner">
        <div className="hp-hero-grid">
          <div className="hp-hero-copy">
            <span className="hp-top-badge">
              <Users size={13} aria-hidden />
              Hơn 1.200 phụ huynh đang đồng hành
            </span>

            <h1>Dạy toán cho trẻ 2–6 tuổi tại nhà — con học đúng lộ trình, ba mẹ yên tâm</h1>

            <p>
              Nhiều bé cùng tuổi đã bắt đầu học Toán tư duy và Tiếng Anh Phonics —
              đừng để con bị bỏ lại phía sau. Chỉ 15 phút mỗi ngày, phụ huynh nhận
              báo cáo tiến bộ hàng tuần để thấy con học được gì thật sự.
            </p>

            <div className="hp-hero-actions">
              <Link href="/auth/signup" className="solid-button">
                Bắt đầu dùng thử miễn phí 7 ngày
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

            {/* Dashboard Mock */}
            <div className="hp-dash-mock">
              {/* App chrome top bar */}
              <div className="hp-dash-topbar">
                <div className="hp-dash-dots">
                  <span /><span /><span />
                </div>
                <span className="hp-dash-title">Cùng Con Tự Học</span>
              </div>

              {/* Profile progress card */}
              <div className="hp-dash-card hp-dash-card-main">
                <div className="hp-dash-profile-row">
                  <div className="hp-dash-avatar">B</div>
                  <div>
                    <div className="hp-dash-name">Bé Minh · Hôm nay</div>
                    <div className="hp-dash-subtitle">4 tuổi · Lớp Toán A2</div>
                  </div>
                  <div className="hp-dash-streak-pill">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden><path d="M12 2C8 8 4 12 4 15a8 8 0 0016 0c0-3-4-7-8-13z"/></svg>
                    7
                  </div>
                </div>
                <div className="hp-dash-progress-label">
                  <span>Bài hôm nay</span>
                  <span>80%</span>
                </div>
                <div className="hp-dash-progress-track">
                  <div className="hp-dash-progress-fill" style={{ width: "80%" }} />
                </div>
              </div>

              {/* Weekly chart + streak */}
              <div className="hp-dash-bottom-row">
                <div className="hp-dash-card hp-dash-chart-card">
                  <div className="hp-dash-chart-label">Tuần này</div>
                  <div className="hp-dash-bars">
                    <div className="hp-dash-bar" style={{ height: "45%" }} />
                    <div className="hp-dash-bar" style={{ height: "70%" }} />
                    <div className="hp-dash-bar" style={{ height: "55%" }} />
                    <div className="hp-dash-bar hp-dash-bar-today" style={{ height: "80%" }} />
                    <div className="hp-dash-bar hp-dash-bar-empty" style={{ height: "20%" }} />
                  </div>
                  <div className="hp-dash-chart-days">
                    <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span>
                  </div>
                </div>

                <div className="hp-dash-card hp-dash-streak-card">
                  <div className="hp-dash-streak-fire">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden><path d="M12 2C8 8 4 12 4 15a8 8 0 0016 0c0-3-4-7-8-13z"/></svg>
                  </div>
                  <div className="hp-dash-streak-count">7</div>
                  <div className="hp-dash-streak-label">ngày liên tiếp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
