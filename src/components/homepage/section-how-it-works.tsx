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
      title: "Tạo tài khoản phụ huynh",
      description: "Đăng ký miễn phí, không cần thẻ tín dụng.",
    },
    {
      icon: Baby,
      title: "Thêm hồ sơ bé",
      description: "Nhập tên và tuổi, hệ thống gợi ý lộ trình phù hợp.",
    },
    {
      icon: Play,
      title: "Bé bắt đầu học 15 phút/ngày",
      description: "Video ngắn + hoạt động offline + mini quiz tương tác.",
    },
    {
      icon: BarChart3,
      title: "Xem báo cáo tiến bộ hàng tuần",
      description: "Dashboard chi tiết: số phút học, bài hoàn thành, chuỗi ngày liên tiếp.",
    },
  ];

export function SectionHowItWorks() {
  return (
    <section className="hp-section hp-section-alt" id="how-it-works">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Bắt đầu trong 3 phút</h2>
            <p className="muted-text">
              Luồng học rõ ràng để phụ huynh khởi động nhanh ngay từ ngày đầu
              tiên.
            </p>
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
