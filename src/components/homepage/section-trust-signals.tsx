import { Lock, RotateCcw, ShieldOff, Users, Wallet, type LucideIcon } from "lucide-react";

const BADGES: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: Wallet, label: "Fast payment by bank transfer or QR" },
  { icon: RotateCcw, label: "Have a clear refund policy" },
  { icon: Lock, label: "Your child's data is protected and encrypted" },
  { icon: ShieldOff, label: "No ads, no unsafe external links" },
];

export function SectionTrustSignals() {
  return (
    <section className="hp-section hp-trust-section">
      <div className="hp-section-inner">
        <div className="hp-trust-headline">
          <div className="hp-trust-stat">
            <Users size={18} aria-hidden />
            <strong>1,200+</strong>
            <span>parents trust</span>
          </div>
          <div className="hp-trust-divider" aria-hidden />
          <div className="hp-trust-rating">
            <span className="hp-trust-stars" aria-label="Rated 4.9 out of 5 stars">
              ★★★★★
            </span>
            <strong>4.9/5</strong>
            <span>Evaluate</span>
          </div>
        </div>

        <div className="hp-trust-strip">
          {BADGES.map((b) => (
            <div key={b.label} className="hp-trust-pill">
              <b.icon size={15} aria-hidden />
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
