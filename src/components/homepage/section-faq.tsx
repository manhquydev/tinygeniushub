"use client";

import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FAQ_ITEMS = [
  {
    q: "What age range is this platform for?",
    a: "The learning content is designed for children aged 2-6.",
  },
  {
    q: "How does payment work?",
    a: "Course checkout uses PayOS via bank transfer or QR.",
  },
  {
    q: "Can I preview lessons before purchase?",
    a: "Yes. You can preview sample lessons before deciding to buy.",
  },
  {
    q: "Can parents track progress?",
    a: "Yes. Parent dashboard includes lesson completion, quiz progress, and weekly reports.",
  },
  {
    q: "Can I request a refund?",
    a: "Yes. Refunds follow the published refund policy.",
  },
] as const;

export function SectionFaq() {
  return (
    <section className="hp-section" id="faq">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Frequently asked questions</h2>
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
