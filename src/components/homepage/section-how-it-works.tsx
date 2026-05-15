"use client";

import { Baby, BarChart3, Play, UserPlus, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const STEPS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: UserPlus,
    title: "Create your child's account and profile",
    description: "Quickly register and set up your child's learning profile.",
  },
  {
    icon: Baby,
    title: "Start with a sample lesson",
    description: "Preview lesson style and difficulty before purchasing.",
  },
  {
    icon: Play,
    title: "Choose the right course",
    description: "Choose the right lock for your needs and complete payment in a few steps.",
  },
  {
    icon: BarChart3,
    title: "Track progress weekly",
    description: "View parent tracking sheets and weekly reports to clearly understand learning results.",
  },
];

export function SectionHowItWorks() {
  return (
    <section className="hp-section hp-section-alt" id="how-it-works">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Start quickly, study every day</h2>
            <p className="muted-text">The process is simple: preview, choose a course, and track clear progress.</p>
          </div>
        </ScrollReveal>

        <div className="hp-grid-4 hp-step-grid">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.15}>
              <article className="card hp-step-card">
                <span className="hp-step-number">{i + 1}</span>
                <span className="hp-icon-box">
                  <step.icon size={20} aria-hidden />
                </span>
                <h3>{step.title}</h3>
                <p className="muted-text">{step.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
