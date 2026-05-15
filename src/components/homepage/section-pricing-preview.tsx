import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

const COURSE_OFFER_POINTS = [
  "PayOS checkout (bank transfer/QR)",
  "Automatic activation after confirmation",
  "Preview sample lessons before purchase",
  "100% refund within 30 days",
];

export function SectionPricingPreview() {
  return (
    <section className="hp-section" id="pricing">
      <div className="hp-section-inner">
        <div className="hp-section-heading">
          <h2>Direct course purchase model</h2>
          <p className="muted-text">Clear pricing and low-friction checkout for parents.</p>
        </div>

        <div className="hp-grid-2">
          <article className="hp-price-card">
            <h3>New conversion path</h3>
            <p className="hp-price-main">Preview → Purchase → Learn</p>
            <p className="muted-text">Fewer steps and faster time to value.</p>
            <ul className="hp-feature-list">
              <li>Preview real lesson quality</li>
              <li>Buy only the needed course</li>
              <li>Automatic activation after payment</li>
              <li>Track progress in parent dashboard</li>
            </ul>
            <Link href="/courses" className="solid-button full-width">
              Browse courses
            </Link>
          </article>

          <article className="hp-price-card hp-price-highlight">
            <div className="hp-price-popular-badge">
              <Star size={12} aria-hidden />
              Conversion optimized
            </div>
            <h3>Parent safety guarantees</h3>
            <p className="hp-price-main">Transparent payment, lower risk</p>
            <p className="muted-text">Sample-first plus refund policy.</p>
            <ul className="hp-feature-list">
              {COURSE_OFFER_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <Link href="/courses" className="solid-button full-width hp-price-cta-main">
              View course options
              <ArrowRight size={14} aria-hidden />
            </Link>
            <p className="hp-price-cta-note">No card-on-file required</p>
          </article>
        </div>

        <Link href="/courses" className="hp-more-link">
          See all courses →
        </Link>
      </div>
    </section>
  );
}
