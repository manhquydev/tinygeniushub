"use client";

import { Award, Brain, Camera, Mail, Route, ShieldCheck, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FEATURES: ReadonlyArray<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Brain,
    title: "Math thinking is right for ages 2–6",
    description: "The Math program is designed specifically for each stage of development: counting, recognizing shapes, comparing, basic logic. Don't impose — teach the right way your baby's brain is working.",
  },
  {
    icon: Route,
    title: "Clear route from easy to difficult",
    description: "Each lesson is arranged in a scientific order - English Phonics combined with Mathematical thinking. Children don't miss out on knowledge, parents don't have to worry about their children messing up their studies.",
  },
  {
    icon: Camera,
    title: "Evidence of real progress, not fake scores",
    description: "Lesson checklists, quiz results, photos and audio recorded by parents — all are kept so you can see your child's progress each week specifically.",
  },
  {
    icon: Mail,
    title: "Weekly reports are automatically sent to email",
    description: "Each week a detailed summary — what lessons were learned, your child's strengths, suggestions for the next week. No need to open the app to clearly understand your child's learning situation.",
  },
  {
    icon: ShieldCheck,
    title: "Completely safe, parents have complete control",
    description: "No ads, no external links, no inappropriate content. You manage your study time, choose content, and turn off at any time.",
  },
  {
    icon: Award,
    title: "Certificate of course completion",
    description: "When your child completes a period of study, the system issues a digital certificate with the child's name and specific results — parents can print or share with grandparents as a proud milestone.",
  },
];

export function SectionFeatures() {
  return (
    <section className="hp-section" id="features">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>A single platform — enough for children to learn comprehensively from 2 to 6 years old</h2>
            <p className="muted-text">Mental Math and English Phonics in the same continuous pathway — no other app in Vietnam has enough of both for this age group.</p>
          </div>
        </ScrollReveal>

        <div className="hp-grid-2">
          {FEATURES.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1}>
              <article className="card hp-feature-card">
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
