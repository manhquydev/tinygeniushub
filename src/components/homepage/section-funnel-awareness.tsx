"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, PlayCircle } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FUNNEL_STAGES = [
  {
    stage: "TOFU",
    title: "Awareness and trust building",
    description:
      "Parents discover practical guidance through SEO blog content, short videos, and community discussions.",
    channels: ["SEO blog", "Short video", "Parent communities"],
    ctaHref: "/blog",
    ctaLabel: "Read parent guides",
    icon: BookOpenText,
  },
  {
    stage: "MOFU",
    title: "Evaluation with real product proof",
    description:
      "Parents review sample lessons and weekly report format before making a purchase decision.",
    channels: ["Sample lesson", "Report preview", "Nurture email"],
    ctaHref: "/parent/reports",
    ctaLabel: "View weekly report sample",
    icon: PlayCircle,
  },
  {
    stage: "BOFU",
    title: "Purchase with low risk",
    description:
      "Clear pricing + PayOS transfer/QR + 30-day refund policy reduce friction and increase confidence.",
    channels: ["Pricing page", "Courses page", "Purchase CTA"],
    ctaHref: "/pricing",
    ctaLabel: "View pricing and payment options",
    icon: CheckCircle2,
  },
] as const;

export function SectionFunnelAwareness() {
  return (
    <section className="hp-section" id="funnel-awareness">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Content funnel: TOFU → MOFU → BOFU</h2>
            <p className="muted-text">Each stage has a dedicated message and CTA to drive course purchases.</p>
          </div>
        </ScrollReveal>

        <div className="hp-grid-3">
          {FUNNEL_STAGES.map((item, index) => (
            <ScrollReveal key={item.stage} delay={index * 0.1}>
              <article className="card hp-funnel-card">
                <div className="hp-funnel-stage-row">
                  <span className="hp-funnel-stage-badge">{item.stage}</span>
                  <span className="hp-icon-box">
                    <item.icon size={18} aria-hidden />
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p className="muted-text">{item.description}</p>

                <ul className="hp-funnel-channel-list">
                  {item.channels.map((channel) => (
                    <li key={channel}>{channel}</li>
                  ))}
                </ul>

                <Link href={item.ctaHref} className="hp-funnel-link">
                  {item.ctaLabel}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
