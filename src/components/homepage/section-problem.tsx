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
      title: "Con xem video cả ngày",
      description:
        "Nhiều app cho trẻ chỉ là 'video giữ em' — không có lộ trình, không kiểm tra.",
    },
    {
      icon: EyeOff,
      title: "Không biết con học được gì",
      description:
        "Phụ huynh không có cách nào đo lường tiến bộ thật sự của con.",
    },
    {
      icon: Clock3,
      title: "Không có thời gian dạy con mỗi ngày",
      description:
        "Ba mẹ bận rộn cần giải pháp gọn, 15 phút/ngày là đủ.",
    },
  ];

export function SectionProblem() {
  return (
    <section className="hp-section">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Phụ huynh Việt đang gặp khó khăn gì?</h2>
            <p className="muted-text">
              Ba vấn đề phổ biến khiến việc học tại nhà dễ đứt quãng và thiếu
              định hướng.
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
