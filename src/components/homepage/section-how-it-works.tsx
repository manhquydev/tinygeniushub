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
      title: "Tạo tài khoản — miễn phí, không cần thẻ",
      description: "Đăng ký trong 60 giây. Thêm hồ sơ bé với tên và ngày sinh để hệ thống xếp lộ trình phù hợp.",
    },
    {
      icon: Baby,
      title: "Bé bắt đầu bài học đầu tiên ngay hôm nay",
      description: "Video ngắn 3–5 phút + hoạt động offline + mini quiz tương tác. Bé học, ba mẹ không cần ngồi kèm.",
    },
    {
      icon: Play,
      title: "Ba mẹ theo dõi tiến bộ trên Dashboard",
      description: "Xem số bài hoàn thành, điểm quiz, chuỗi ngày học. Biết chính xác con đang ở đâu trên lộ trình.",
    },
    {
      icon: BarChart3,
      title: "Nhận báo cáo tuần tự động qua email",
      description: "Mỗi thứ Hai sáng, tóm tắt tuần vừa rồi và gợi ý nội dung tuần tiếp theo — gửi thẳng vào hộp thư.",
    },
  ];

export function SectionHowItWorks() {
  return (
    <section className="hp-section hp-section-alt" id="how-it-works">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Bắt đầu trong 3 phút, thấy kết quả sau 30 ngày</h2>
            <p className="muted-text">
              Không cần cài app, không cần kinh nghiệm dạy học — chỉ cần 15 phút mỗi ngày.
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
