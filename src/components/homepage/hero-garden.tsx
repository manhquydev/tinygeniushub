"use client";

/**
 * HeroGarden - Garden-themed hero section.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroGarden() {
  return (
    <section className="cgh-hero">
      <div className="cgh-shell">
        <div className="cgh-hero-grid">
          <div className="cgh-copy">
            <span className="cgh-badge">Over 1,200 parents are already learning with us</span>

            <h1>
              Khu Vuon Tren May - Learn <span>Math and English</span> for ages 2-6
            </h1>

            <p style={{ fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "48ch", opacity: 0.9 }}>
              Build daily learning habits in 15 minutes with clear progression and parent visibility.
            </p>

            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
              <Link
                href="/courses"
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
                  minHeight: "44px",
                  transition: "all 0.2s",
                }}
              >
                Browse courses
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
                View pricing
              </Link>
            </div>

            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.6rem" }}>
              PayOS transfer/QR · 30-day refund policy
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
