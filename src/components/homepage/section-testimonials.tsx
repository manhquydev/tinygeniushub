"use client";

import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const TESTIMONIALS = [
  {
    initials: "TL",
    colorClass: "hp-avatar-pink",
    name: "Chị Thanh Lan",
    context: "Mẹ bé Minh, 4 tuổi · Đang dùng 3 tháng",
    quote:
      "Tôi từng nghĩ con 4 tuổi chưa cần học Toán có hệ thống. Nhưng sau 6 tuần dùng Cùng Con Tự Học, bé Minh đã biết cộng trừ trong phạm vi 20 — trong khi các bạn cùng lớp vẫn đang luyện đếm 1–10. Điều tôi thích nhất là báo cáo tuần: tôi thấy rõ tuần này con học bài nào, điểm quiz ra sao, và tuần tới nên tập trung gì. Lần đầu tiên tôi thật sự biết con đang học được gì.",
    rating: 5,
  },
  {
    initials: "HN",
    colorClass: "hp-avatar-blue",
    name: "Anh Hoàng Nam",
    context: "Ba bé An và bé Khánh, 3 và 5 tuổi · Gói Family+",
    quote:
      "Tôi mua gói Family+ vì có hai đứa, và đó là quyết định đúng nhất năm nay. Hai đứa nhà tôi giờ tranh nhau học mỗi tối — bé lớn 5 tuổi đã đếm được 1–50 và phát âm tiếng Anh rõ hơn hẳn sau đúng 4 tuần. Trước đây tôi dạy hoài mà không vào — chỉ vì không có lộ trình. Bây giờ bé tự học, tôi chỉ cần đọc báo cáo tuần là biết con đang ở đâu.",
    rating: 5,
  },
  {
    initials: "MT",
    colorClass: "hp-avatar-green",
    name: "Chị Mai Trang",
    context: "Mẹ bé Sóc, 2.5 tuổi · Đang dùng 6 tuần",
    quote:
      "Ban đầu tôi nghi ngờ — bé 2.5 tuổi có học được không? Thật ra bé học được nhiều hơn tôi tưởng rất nhiều. Sau 6 tuần, bé Sóc nhận biết được 8 hình khối cơ bản và phát âm được 12 âm tiếng Anh đầu tiên. Tuần trước tôi chia sẻ báo cáo tiến bộ với ông bà — ông bà xúc động lắm, bảo đây mới là màn hình có ích. Tôi cũng thấy yên tâm vì hoàn toàn không có quảng cáo.",
    rating: 5,
  },
] as const;

export function SectionTestimonials() {
  return (
    <section className="hp-section">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Phụ huynh nói gì sau khi dùng thật sự?</h2>
            <p className="muted-text">
              Hơn 1.200 phụ huynh đang đồng hành cùng con mỗi ngày
            </p>
          </div>
        </ScrollReveal>

        <div className="hp-grid-3 hp-testimonial-grid">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.1}>
              <article className="hp-testimonial-card">
                <div className="hp-testimonial-head">
                  <span className={`hp-avatar ${t.colorClass}`}>{t.initials}</span>
                  <div>
                    <strong>{t.name}</strong>
                    <p className="muted-text" style={{ fontSize: "0.82rem" }}>
                      {t.context}
                    </p>
                  </div>
                </div>

                <p className="hp-quote">
                  <span aria-hidden>&ldquo;</span>
                  {t.quote}
                  <span aria-hidden>&rdquo;</span>
                </p>

                <div className="hp-stars">
                  <span className="sr-only">{`${t.rating} trên 5 sao`}</span>
                  {Array.from({ length: 5 }, (_, si) => (
                    <Star
                      key={si}
                      size={17}
                      fill={si < t.rating ? "currentColor" : "none"}
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  ))}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
