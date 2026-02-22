"use client";

import { Camera, Mail, Route, ShieldCheck, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FEATURES: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
    {
      icon: Route,
      title: "Lộ trình học rõ ràng",
      description:
        "Chương trình English + Math theo trình tự từ dễ đến khó, không bỏ sót kiến thức.",
    },
    {
      icon: Camera,
      title: "Bằng chứng tiến bộ thật",
      description:
        "Checklist bài học, điểm quiz, ảnh/audio do phụ huynh ghi nhận — lưu giữ 90-365 ngày.",
    },
    {
      icon: Mail,
      title: "Báo cáo tuần tự động",
      description:
        "Tóm tắt tiến bộ gửi đến email mỗi tuần — phụ huynh nắm rõ mà không cần mở app.",
    },
    {
      icon: ShieldCheck,
      title: "An toàn, kiểm soát được",
      description:
        "Không quảng cáo, không link ngoài. Phụ huynh quản lý thời gian học và nội dung.",
    },
  ];

export function SectionFeatures() {
  return (
    <section className="hp-section" id="features">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Tại sao phụ huynh chọn Cùng Con Tự Học?</h2>
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
