"use client";

import { Clock3, EyeOff, MonitorPlay, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const PROBLEMS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
    {
      icon: MonitorPlay,
      title: "I just watch it for fun, I don't learn anything",
      description:
        "Most children's apps are just 'keep your child still videos' — no roadmaps, no knowledge tests. After 30 minutes of screen time, I still don't remember anything.",
    },
    {
      icon: EyeOff,
      title: "Parents do not know whether their children are progressing or not",
      description:
        "You let your child study every day, but there is no way to measure what your child has learned, how much they have learned, and what they need to learn next week.",
    },
    {
      icon: Clock3,
      title: "Want to teach your children but don't have time",
      description:
        "Busy work, tired at night - parents need a neat solution that doesn't require sitting next to their child all day. 15 minutes of structure is better than 1 hour of free time.",
    },
  ];

export function SectionProblem() {
  return (
    <section className="hp-section">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Three worries that nearly every parent has</h2>
            <p className="muted-text">
              You're not alone — this is why many parents still haven't found a truly effective homeschooling solution.
            </p>
          </div>
        </ScrollReveal>

        <div className="hp-grid-3">
          {PROBLEMS.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1}>
              <article className="card hp-problem-card">
                <span className="hp-icon-box">
                  <item.icon size={20} aria-hidden />
                </span>
                <h3>{item.title}</h3>
                <p className="muted-text">{item.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
