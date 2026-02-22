import Link from "next/link";

export function SectionFinalCta() {
  return (
    <section className="hp-section hp-section-dark">
      <div className="hp-section-inner hp-cta-block">
        <h2>Bắt đầu hành trình học tập cùng con ngay hôm nay</h2>
        <p>
          Chỉ 15 phút mỗi ngày để tạo thói quen học tập cho con — với bằng
          chứng tiến bộ rõ ràng cho phụ huynh.
        </p>
        <Link href="/auth/signup" className="solid-button">
          Dùng thử 7 ngày miễn phí
        </Link>
        <p className="hp-hero-note">
          Không cần thẻ tín dụng · Hủy bất kỳ lúc nào
        </p>
      </div>
    </section>
  );
}
