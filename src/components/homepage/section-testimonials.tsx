"use client";

import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const TESTIMONIALS = [
  {
    initials: "TL",
    colorClass: "hp-avatar-pink",
    name: "Ms. Thanh Lan",
    context: "Minh's mother, 4 years old · Been using for 3 months",
    quote:
      "I used to think my 4-year-old child didn't need to learn Math systematically. But after 6 weeks of using the TinyGenius Hub, Minh was able to add and subtract within 20 — while his classmates were still practicing counting 1–10. What I like most is the weekly report: I can clearly see what lessons my child learned this week, how they scored on the quiz, and what to focus on next week. For the first time, I really knew what my child was learning.",
    rating: 5,
  },
  {
    initials: "HN",
    colorClass: "hp-avatar-blue",
    name: "Mr. Hoang Nam",
    context: "Three children, An and Khanh, 3 and 5 years old · Family+ package",
    quote:
      "I bought the Family+ package because I have two kids, and it was the best decision this year. My two children now compete to study every night — the older child, 5 years old, can count 1–50 and pronounce English much better after exactly 4 weeks. Before, I taught all the time but didn't get in — just because there was no roadmap. Now the child learns on his own, I just need to read the weekly report to know where he is.",
    rating: 5,
  },
  {
    initials: "MT",
    colorClass: "hp-avatar-green",
    name: "Ms. Mai Trang",
    context: "Mother of Soc, 2.5 years old · Been using for 6 weeks",
    quote:
      "At first I was skeptical — can a 2.5 year old learn? Actually, the baby learned a lot more than I thought. After 6 weeks, baby Soc recognizes 8 basic shapes and pronounces the first 12 English sounds. Last week I shared the progress report with my grandparents — they were very touched, saying this was a useful monitor. I also feel secure because there are absolutely no ads.",
    rating: 5,
  },
] as const;

export function SectionTestimonials() {
  return (
    <section className="hp-section">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>What do parents say after actually using it?</h2>
            <p className="muted-text">
              More than 1,200 parents are accompanying their children every day
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
                  <span className="sr-only">{`${t.rating}out of 5 stars`}</span>
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
