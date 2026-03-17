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
    title: "Tạo tài khoản và hồ sơ của bé",
    description: "Đăng ký nhanh và thiết lập hồ sơ học tập của con.",
  },
  {
    icon: Baby,
    title: "Bắt đầu bằng bài học mẫu",
    description: "Xem trước phong cách và độ khó bài học trước khi mua.",
  },
  {
    icon: Play,
    title: "Chọn khóa học phù hợp",
    description: "Chọn khóa đúng nhu cầu và hoàn tất thanh toán trong vài bước.",
  },
  {
    icon: BarChart3,
    title: "Theo dõi tiến độ hằng tuần",
    description: "Xem bảng theo dõi phụ huynh và báo cáo tuần để nắm rõ kết quả học tập.",
  },
];

export function SectionHowItWorks() {
  return (
    <section className="hp-section hp-section-alt" id="how-it-works">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Bắt đầu nhanh, học đều mỗi ngày</h2>
            <p className="muted-text">Quy trình đơn giản: xem thử, chọn khóa và theo dõi tiến bộ rõ ràng.</p>
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
