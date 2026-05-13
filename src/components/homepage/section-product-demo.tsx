"use client";

import { ScrollReveal } from "@/components/homepage/scroll-reveal";

export function SectionProductDemo() {
  return (
    <section className="hp-section hp-section-alt">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Take a look — how your child learns, what you see</h2>
            <p className="muted-text">The three main screens you'll use every day.</p>
          </div>
        </ScrollReveal>

        <div className="hp-demo-grid">

          {/* === Mock 1: Kid Learning Mode === */}
          <ScrollReveal delay={0}>
            <article className="card hp-demo-card">
              <div className="hp-demo-visual is-kid hp-mock-kid">
                {/* Lesson card */}
                <div className="hp-mock-lesson-card">
                  <div className="hp-mock-lesson-badge">Lesson 3 · Math A1</div>
                  <div className="hp-mock-lesson-title">Count from 1 to 5</div>
                  <div className="hp-mock-video-thumb">
                    <div className="hp-mock-play-btn" aria-hidden>▶</div>
                  </div>
                  {/* Quiz question */}
                  <div className="hp-mock-quiz">
                    <div className="hp-mock-quiz-q">How many ducks are there? 🦆🦆🦆</div>
                    <div className="hp-mock-quiz-options">
                      <div className="hp-mock-opt">2</div>
                      <div className="hp-mock-opt is-correct">3</div>
                      <div className="hp-mock-opt">4</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="muted-text" style={{ marginTop: "0.75rem" }}>
                <strong>Baby learns:</strong> Short video → interactive question → lesson completion
              </p>
            </article>
          </ScrollReveal>

          {/* === Mock 2: Parent Dashboard === */}
          <ScrollReveal delay={0.1}>
            <article className="card hp-demo-card">
              <div className="hp-demo-visual is-dashboard hp-mock-dash">
                <div className="hp-mock-dash-header">
                  <div className="hp-mock-dash-greeting">Hello, Ms. Lan 👋</div>
                  <div className="hp-mock-dash-sub">Baby Minh · This week</div>
                </div>
                {/* Stats row */}
                <div className="hp-mock-stats-row">
                  <div className="hp-mock-stat">
                    <div className="hp-mock-stat-val">5</div>
                    <div className="hp-mock-stat-label">completed lesson</div>
                  </div>
                  <div className="hp-mock-stat">
                    <div className="hp-mock-stat-val">75&apos;</div>
                    <div className="hp-mock-stat-label">study minutes</div>
                  </div>
                  <div className="hp-mock-stat hp-mock-stat-streak">
                    <div className="hp-mock-stat-val">🔥 7</div>
                    <div className="hp-mock-stat-label">consecutive days</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="hp-mock-progress-section">
                  <div className="hp-mock-progress-label">
                    <span>Math Pathway A1</span><span>60%</span>
                  </div>
                  <div className="hp-mock-progress-track">
                    <div className="hp-mock-progress-fill" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
              <p className="muted-text" style={{ marginTop: "0.75rem" }}>
                <strong>Parents see:</strong> Progress, learning streak, real-time quiz score
              </p>
            </article>
          </ScrollReveal>

          {/* === Mock 3: Weekly Report Email === */}
          <ScrollReveal delay={0.2}>
            <article className="card hp-demo-card">
              <div className="hp-demo-visual is-report hp-mock-report">
                <div className="hp-mock-email-chrome">
                  <div className="hp-mock-email-from">From: TinyGenius Hub</div>
                  <div className="hp-mock-email-subject">📊 Baby Minh's weekly report</div>
                </div>
                <div className="hp-mock-report-body">
                  <div className="hp-mock-report-row">
                    <span>✅ Lesson completed</span><strong>5/5</strong>
                  </div>
                  <div className="hp-mock-report-row">
                    <span>🧮 Average quiz score</span><strong>92%</strong>
                  </div>
                  <div className="hp-mock-report-row">
                    <span>🔥 A series of school days</span><strong>7 days</strong>
                  </div>
                  <div className="hp-mock-report-highlight">
                    Clear progress in counting. Next week: shapes 🎉
                  </div>
                </div>
              </div>
              <p className="muted-text" style={{ marginTop: "0.75rem" }}>
                <strong>Weekly emails:</strong> Automatic progress summary + next-week suggestions
              </p>
            </article>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
