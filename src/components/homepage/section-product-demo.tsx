"use client";

import { ScrollReveal } from "@/components/homepage/scroll-reveal";

export function SectionProductDemo() {
  return (
    <section className="hp-section hp-section-alt">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Xem thử — con học thế nào, ba mẹ thấy gì</h2>
            <p className="muted-text">Ba màn hình chính bạn sẽ dùng mỗi ngày.</p>
          </div>
        </ScrollReveal>

        <div className="hp-demo-grid">

          {/* === Mock 1: Kid Learning Mode === */}
          <ScrollReveal delay={0}>
            <article className="card hp-demo-card">
              <div className="hp-demo-visual is-kid hp-mock-kid">
                {/* Lesson card */}
                <div className="hp-mock-lesson-card">
                  <div className="hp-mock-lesson-badge">Bài 3 · Toán A1</div>
                  <div className="hp-mock-lesson-title">Đếm từ 1 đến 5</div>
                  <div className="hp-mock-video-thumb">
                    <div className="hp-mock-play-btn" aria-hidden>▶</div>
                  </div>
                  {/* Quiz question */}
                  <div className="hp-mock-quiz">
                    <div className="hp-mock-quiz-q">Có mấy con vịt? 🦆🦆🦆</div>
                    <div className="hp-mock-quiz-options">
                      <div className="hp-mock-opt">2</div>
                      <div className="hp-mock-opt is-correct">3</div>
                      <div className="hp-mock-opt">4</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="muted-text" style={{ marginTop: "0.75rem" }}>
                <strong>Bé học:</strong> Video ngắn → câu hỏi tương tác → hoàn thành bài
              </p>
            </article>
          </ScrollReveal>

          {/* === Mock 2: Parent Dashboard === */}
          <ScrollReveal delay={0.1}>
            <article className="card hp-demo-card">
              <div className="hp-demo-visual is-dashboard hp-mock-dash">
                <div className="hp-mock-dash-header">
                  <div className="hp-mock-dash-greeting">Xin chào, chị Lan 👋</div>
                  <div className="hp-mock-dash-sub">Bé Minh · Tuần này</div>
                </div>
                {/* Stats row */}
                <div className="hp-mock-stats-row">
                  <div className="hp-mock-stat">
                    <div className="hp-mock-stat-val">5</div>
                    <div className="hp-mock-stat-label">bài hoàn thành</div>
                  </div>
                  <div className="hp-mock-stat">
                    <div className="hp-mock-stat-val">75&apos;</div>
                    <div className="hp-mock-stat-label">phút học</div>
                  </div>
                  <div className="hp-mock-stat hp-mock-stat-streak">
                    <div className="hp-mock-stat-val">🔥 7</div>
                    <div className="hp-mock-stat-label">ngày liên tiếp</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="hp-mock-progress-section">
                  <div className="hp-mock-progress-label">
                    <span>Lộ trình Toán A1</span><span>60%</span>
                  </div>
                  <div className="hp-mock-progress-track">
                    <div className="hp-mock-progress-fill" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
              <p className="muted-text" style={{ marginTop: "0.75rem" }}>
                <strong>Ba mẹ thấy:</strong> Tiến độ, chuỗi ngày học, điểm quiz theo thời gian thực
              </p>
            </article>
          </ScrollReveal>

          {/* === Mock 3: Weekly Report Email === */}
          <ScrollReveal delay={0.2}>
            <article className="card hp-demo-card">
              <div className="hp-demo-visual is-report hp-mock-report">
                <div className="hp-mock-email-chrome">
                  <div className="hp-mock-email-from">Từ: TinyGenius Hub</div>
                  <div className="hp-mock-email-subject">📊 Báo cáo tuần của bé Minh</div>
                </div>
                <div className="hp-mock-report-body">
                  <div className="hp-mock-report-row">
                    <span>✅ Bài hoàn thành</span><strong>5/5</strong>
                  </div>
                  <div className="hp-mock-report-row">
                    <span>🧮 Điểm quiz TB</span><strong>92%</strong>
                  </div>
                  <div className="hp-mock-report-row">
                    <span>🔥 Chuỗi ngày học</span><strong>7 ngày</strong>
                  </div>
                  <div className="hp-mock-report-highlight">
                    Bé tiến bộ rõ ở phần đếm số. Tuần tới: hình khối 🎉
                  </div>
                </div>
              </div>
              <p className="muted-text" style={{ marginTop: "0.75rem" }}>
                <strong>Email tuần:</strong> Tóm tắt tiến bộ + gợi ý tuần tiếp theo tự động
              </p>
            </article>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
