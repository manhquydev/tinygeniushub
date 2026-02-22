import { CreditCard, Lock, RotateCcw, ShieldOff, type LucideIcon } from "lucide-react";

const BADGES: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: CreditCard, label: "Không cần thẻ tín dụng khi dùng thử" },
  { icon: RotateCcw, label: "Hoàn tiền 7 ngày đầu" },
  { icon: Lock, label: "Dữ liệu mã hóa, bảo mật cao" },
  { icon: ShieldOff, label: "Không quảng cáo, không link ngoài" },
];

export function SectionTrustSignals() {
  return (
    <section className="hp-section hp-section-alt">
      <div className="hp-section-inner">
        <div className="hp-badges">
          {BADGES.map((b) => (
            <div key={b.label} className="hp-badge">
              <b.icon size={18} aria-hidden />
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
