"use client";

import { FileBarChart, LayoutDashboard, Play, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const DEMOS: ReadonlyArray<{
  title: string;
  label: string;
  visualClass: string;
  icon: LucideIcon;
}> = [
    {
      title: "Kid Learning Mode",
      label: "Bé hoàn thành bài học với video + quiz tương tác",
      visualClass: "is-kid",
      icon: Play,
    },
    {
      title: "Parent Dashboard",
      label: "Phụ huynh theo dõi tiến bộ và quản lý hồ sơ bé",
      visualClass: "is-dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Weekly Report",
      label: "Báo cáo tuần chi tiết gửi qua email",
      visualClass: "is-report",
      icon: FileBarChart,
    },
  ];

export function SectionProductDemo() {
  return (
    <section className="hp-section hp-section-alt">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Trải nghiệm thật sự trên Cùng Con Tự Học</h2>
          </div>
        </ScrollReveal>

        {/* Replace gradient placeholders with real screenshots later */}
        <div className="hp-demo-grid">
          {DEMOS.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 0.1}>
              <article className="card hp-demo-card">
                <div className={`hp-demo-visual ${card.visualClass}`}>
                  <card.icon size={28} aria-hidden />
                  <span>{card.title}</span>
                </div>
                <p className="muted-text">{card.label}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
