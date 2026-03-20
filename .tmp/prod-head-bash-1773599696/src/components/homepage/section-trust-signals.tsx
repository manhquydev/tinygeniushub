import { CreditCard, Lock, RotateCcw, ShieldOff, Users, type LucideIcon } from "lucide-react";

const BADGES: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: CreditCard, label: "Dùng thử 7 ngày — không cần thẻ tín dụng" },
  { icon: RotateCcw, label: "Hoàn tiền 100% trong 30 ngày nếu không hài lòng" },
  { icon: Lock, label: "Dữ liệu con mã hóa, bảo mật toàn diện" },
  { icon: ShieldOff, label: "Không quảng cáo, không link ngoài — an toàn tuyệt đối" },
];

export function SectionTrustSignals() {
  return (
    <section className="hp-section hp-trust-section">
      <div className="hp-section-inner">
        <div className="hp-trust-headline">
          <div className="hp-trust-stat">
            <Users size={18} aria-hidden />
            <strong>1.200+</strong>
            <span>phụ huynh tin tưởng</span>
          </div>
          <div className="hp-trust-divider" aria-hidden />
          <div className="hp-trust-rating">
            <span className="hp-trust-stars" aria-label="4.9 trên 5 sao">★★★★★</span>
            <strong>4.9/5</strong>
            <span>đánh giá</span>
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
