import { Lock, RotateCcw, ShieldOff, Users, Wallet, type LucideIcon } from "lucide-react";

const BADGES: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: Wallet, label: "Thanh toán nhanh bằng chuyển khoản hoặc QR" },
  { icon: RotateCcw, label: "Có chính sách hoàn tiền rõ ràng" },
  { icon: Lock, label: "Dữ liệu của trẻ được bảo vệ và mã hóa" },
  { icon: ShieldOff, label: "Không quảng cáo, không liên kết ngoài kém an toàn" },
];

export function SectionTrustSignals() {
  return (
    <section className="hp-section hp-trust-section">
      <div className="hp-section-inner">
        <div className="hp-trust-headline">
          <div className="hp-trust-stat">
            <Users size={18} aria-hidden />
            <strong>1,200+</strong>
            <span>phụ huynh tin tưởng</span>
          </div>
          <div className="hp-trust-divider" aria-hidden />
          <div className="hp-trust-rating">
            <span className="hp-trust-stars" aria-label="Đánh giá 4.9 trên 5 sao">
              ★★★★★
            </span>
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
