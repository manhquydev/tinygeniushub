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
              Trusted by 1,200+ parents
            </span>

            <h1>Math and English for ages 2-6, with clear progress tracking at home</h1>

            <p>
              Just 15 minutes per day. Parents get weekly reports, sample lessons, and a direct course purchase flow
              with PayOS transfer/QR.
            </p>

            <div className="hp-hero-actions">
              <Link href="/courses" className="solid-button">
                Browse courses
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/pricing" className="ghost-button hp-ghost-on-dark">
                View pricing
              </Link>
            </div>

            <p className="hp-hero-note">PayOS checkout · 30-day refund · Auto activation</p>
          </div>

          <div className="hp-hero-visual" aria-hidden>
            <div className="hp-orb hp-orb-main" />
            <div className="hp-orb hp-orb-accent" />

            <div className="hp-dash-mock">
              <div className="hp-dash-topbar">
                <div className="hp-dash-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="hp-dash-title">TinyGenius Hub</span>
              </div>

              <div className="hp-dash-card hp-dash-card-main">
                <div className="hp-dash-profile-row">
                  <div className="hp-dash-avatar">B</div>
                  <div>
                    <div className="hp-dash-name">Daily learning progress</div>
                    <div className="hp-dash-subtitle">Age 4 · Math A2</div>
                  </div>
                  <div className="hp-dash-streak-pill">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden>
                      <path d="M12 2C8 8 4 12 4 15a8 8 0 0016 0c0-3-4-7-8-13z" />
                    </svg>
                    7
                  </div>
                </div>
                <div className="hp-dash-progress-label">
                  <span>Today</span>
                  <span>80%</span>
                </div>
                <div className="hp-dash-progress-track">
                  <div className="hp-dash-progress-fill" style={{ width: "80%" }} />
                </div>
              </div>

              <div className="hp-dash-bottom-row">
                <div className="hp-dash-card hp-dash-chart-card">
                  <div className="hp-dash-chart-label">This week</div>
                  <div className="hp-dash-bars">
                    <div className="hp-dash-bar" style={{ height: "45%" }} />
                    <div className="hp-dash-bar" style={{ height: "70%" }} />
                    <div className="hp-dash-bar" style={{ height: "55%" }} />
                    <div className="hp-dash-bar hp-dash-bar-today" style={{ height: "80%" }} />
                    <div className="hp-dash-bar hp-dash-bar-empty" style={{ height: "20%" }} />
                  </div>
                  <div className="hp-dash-chart-days">
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                  </div>
                </div>

                <div className="hp-dash-card hp-dash-streak-card">
                  <div className="hp-dash-streak-fire">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden>
                      <path d="M12 2C8 8 4 12 4 15a8 8 0 0016 0c0-3-4-7-8-13z" />
                    </svg>
                  </div>
                  <div className="hp-dash-streak-count">7</div>
                  <div className="hp-dash-streak-label">day streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
