import Link from "next/link";

export function SectionFinalCta() {
  return (
    <section className="hp-section hp-section-dark">
      <div className="hp-section-inner hp-cta-block">
        <h2>Your child can start learning today</h2>
        <p>
          Parents can review sample lessons first, then purchase the right course with PayOS and activate access
          automatically.
        </p>
        <Link href="/courses" className="solid-button">
          Browse and buy courses
        </Link>
        <p className="hp-hero-note">Transfer/QR checkout · 30-day refund · Auto activation</p>
      </div>
    </section>
  );
}
