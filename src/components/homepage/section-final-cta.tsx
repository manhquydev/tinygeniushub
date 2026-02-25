import Link from "next/link";

export function SectionFinalCta() {
  return (
    <section className="hp-section hp-section-dark">
      <div className="hp-section-inner hp-cta-block">
        <h2>Con bạn có thể bắt đầu học ngay hôm nay</h2>
        <p>
          Hơn 1.200 gia đình đã tin tưởng Cùng Con Tự Học. Thử 7 ngày miễn phí —
          nếu không thấy sự khác biệt trong 30 ngày, chúng tôi hoàn tiền toàn bộ, không hỏi lý do.
        </p>
        <Link href="/auth/signup" className="solid-button">
          Bắt đầu dùng thử miễn phí ngay
        </Link>
        <p className="hp-hero-note">
          Không cần thẻ tín dụng · Hủy bất kỳ lúc nào · Hoàn tiền 30 ngày
        </p>
      </div>
    </section>
  );
}
