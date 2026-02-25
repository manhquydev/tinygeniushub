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
      "Bé nhà tôi biết cộng trừ trong 20 sau 6 tuần, trong khi bạn cùng lớp vẫn đang học đếm. Toán ở đây dạy theo cách bé hiểu được thật sự.",
    rating: 5,
  },
  {
    initials: "HN",
    colorClass: "hp-avatar-blue",
    name: "Anh Hoàng Nam",
    context: "Ba bé An và bé Khánh, 3 và 5 tuổi · Gói Family+",
    quote:
      "Hai đứa nhà tôi tranh nhau học mỗi ngày. Bé lớn tự đếm được 1-50 sau 1 tháng và phát âm tiếng Anh rõ hơn hẳn — điều mà trước đây dạy hoài không vào.",
    rating: 5,
  },
  {
    initials: "MT",
    colorClass: "hp-avatar-green",
    name: "Chị Mai Trang",
    context: "Mẹ bé Sóc, 2.5 tuổi · Đang dùng thử",
    quote:
      "Không ngờ bé 2.5 tuổi đã học được Toán và Tiếng Anh cùng lúc. Báo cáo tuần gửi tự động, ông bà xem là vui cả nhà.",
    rating: 5,
  },
] as const;

export function SectionTestimonials() {
  return (
    <section className="hp-section">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Phụ huynh nói gì?</h2>
            <p className="muted-text">
              Phụ huynh Việt đang đồng hành cùng con mỗi ngày
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
                      size={15}
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
