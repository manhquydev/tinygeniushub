"use client";

/**
 * HeroGarden - Garden-themed hero section (replaces dashboard mock)
 * 
 * Features:
 * - CloudShape components for visual cloud metaphor
 * - Soft gradient background with floating cloud SVGs
 * - H1 with primary keyword for SEO
 * - Primary CTA: "Bắt đầu miễn phí 7 ngày"
 * - Mobile-first: Single column, large touch targets (min 44px)
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroGarden() {
  return (
    <section className="cgh-hero">
      <div className="cgh-shell">
        <div className="cgh-hero-grid">
          <div className="cgh-copy">
            {/* Top badge */}
            <span className="cgh-badge">
              🌱 Hơn 1.200 phụ huynh đang đồng hành
            </span>

            {/* H1 - Primary keyword for SEO */}
            <h1>
              Khu Vườn Trên Mây – Học <span>Toán &amp; Tiếng Anh</span> cho bé 2-6 tuổi
            </h1>

            {/* Subtitle with value prop */}
            <p style={{ fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "48ch", opacity: 0.9 }}>
              Gieo hạt giống tri thức, theo dõi tiến độ trên từng tầng mây. 
              Chỉ 15 phút mỗi ngày, con học đúng lộ trình, ba mẹ yên tâm.
            </p>

            {/* Primary CTA */}
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
              <Link 
                href="/auth/signup" 
                className="cgh-btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.9rem 1.6rem",
                  borderRadius: "999px",
                  backgroundColor: "#0f9f86",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textDecoration: "none",
                  minHeight: "44px", // Touch target for mobile
                  transition: "all 0.2s",
                }}
              >
                Bắt đầu miễn phí 7 ngày
                <ArrowRight size={16} aria-hidden />
              </Link>

              <Link 
                href="/pricing" 
                className="cgh-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.9rem 1.6rem",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(15, 159, 134, 0.3)",
                  color: "var(--cgh-ink)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                  minHeight: "44px",
                  transition: "all 0.2s",
                }}
              >
                Xem bảng giá
              </Link>
            </div>

            {/* Trust signal */}
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.6rem" }}>
              ✓ Không cần thẻ tín dụng · Hoàn tiền 100% trong 30 ngày
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
