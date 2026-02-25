"use client";

import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FAQ_ITEMS = [
  {
    q: "Cùng Con Tự Học dành cho trẻ mấy tuổi?",
    a: "Chương trình thiết kế cho trẻ 2-6 tuổi, với nội dung English và Math phù hợp theo từng độ tuổi.",
  },
  {
    q: "Dùng thử 7 ngày có miễn phí thật không?",
    a: "Hoàn toàn miễn phí, không cần nhập thẻ tín dụng. Hết 7 ngày, bạn tự chọn có tiếp tục hay không.",
  },
  {
    q: "Con tôi chỉ cần học 15 phút mỗi ngày thôi sao?",
    a: "Đúng vậy. Mỗi bài học gồm video ngắn + hoạt động offline + mini quiz. 15 phút đủ để duy trì thói quen học đều đặn.",
  },
  {
    q: "Tôi có thể xem con học được gì không?",
    a: "Có. Dashboard phụ huynh hiển thị bài đã hoàn thành, điểm quiz, chuỗi ngày học. Báo cáo tuần tự động gửi qua email.",
  },
  {
    q: "Thanh toán như thế nào?",
    a: "Thanh toán trực tuyến qua chuyển khoản ngân hàng hoặc ví điện tử. Gói Standard chỉ 799,000đ/năm — dùng Toán + Tiếng Anh cả năm cho bé.",
  },
  {
    q: "Nếu không hài lòng, có được hoàn tiền không?",
    a: "Có. Hoàn tiền 100% trong 30 ngày đầu sau khi thanh toán, không hỏi lý do.",
  },
] as const;

export function SectionFaq() {
  return (
    <section className="hp-section" id="faq">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Câu hỏi thường gặp</h2>
          </div>
        </ScrollReveal>

        <div className="hp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <ScrollReveal key={item.q} delay={i * 0.06}>
              <details className="hp-faq-item">
                <summary>{item.q}</summary>
                <p className="muted-text hp-faq-answer">{item.a}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
