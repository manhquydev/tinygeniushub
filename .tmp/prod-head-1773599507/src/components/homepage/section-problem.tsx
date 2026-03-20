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
      title: "Con chỉ xem cho vui, không học được gì",
      description:
        "Hầu hết app trẻ em chỉ là 'video giữ con ngồi yên' — không có lộ trình, không kiểm tra kiến thức. Sau 30 phút màn hình, con vẫn không nhớ gì.",
    },
    {
      icon: EyeOff,
      title: "Ba mẹ không biết con có tiến bộ hay không",
      description:
        "Bạn cho con học mỗi ngày nhưng không có cách nào đo được con đã học được gì, học tới đâu, và tuần tới cần học gì tiếp theo.",
    },
    {
      icon: Clock3,
      title: "Muốn dạy con nhưng không có thời gian",
      description:
        "Công việc bận rộn, tối về mệt — ba mẹ cần một giải pháp gọn gàng, không đòi hỏi ngồi cạnh con suốt buổi. 15 phút có cấu trúc tốt hơn 1 giờ tự do.",
    },
  ];

export function SectionProblem() {
  return (
    <section className="hp-section">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Ba nỗi lo mà gần như mọi phụ huynh đều gặp</h2>
            <p className="muted-text">
              Bạn không đơn độc — đây là lý do nhiều ba mẹ vẫn chưa tìm được giải pháp học tại nhà thật sự hiệu quả.
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
