"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, PlayCircle } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FUNNEL_STAGES = [
  {
    stage: "TOFU",
    title: "Nhận biết vấn đề và tìm hướng đi phù hợp",
    description:
      "Phụ huynh mới bắt đầu thường cần nội dung dễ áp dụng tại nhà. Ưu tiên blog SEO, TikTok ngắn và bài chia sẻ giá trị trong cộng đồng.",
    channels: ["Blog SEO", "TikTok 15-30s", "Facebook Groups"],
    ctaHref: "/blog",
    ctaLabel: "Đọc nội dung cho phụ huynh mới",
    icon: BookOpenText,
  },
  {
    stage: "MOFU",
    title: "Cân nhắc bằng trải nghiệm thật của gia đình",
    description:
      "Khi đã quan tâm, phụ huynh cần xem demo rõ ràng, báo cáo tiến độ thật và lộ trình 15 phút/ngày để đánh giá mức độ phù hợp.",
    channels: ["Demo sản phẩm", "Báo cáo tuần mẫu", "Email D0-D3"],
    ctaHref: "/parent/reports",
    ctaLabel: "Xem mẫu báo cáo tuần",
    icon: PlayCircle,
  },
  {
    stage: "BOFU",
    title: "Ra quyết định với CTA rõ ràng, ít rủi ro",
    description:
      "Điểm chốt chuyển đổi là trial 7 ngày, giá gói năm minh bạch và cam kết hoàn tiền 30 ngày để phụ huynh an tâm bắt đầu ngay.",
    channels: ["Trang Pricing", "Email D5-D7", "CTA dùng thử"],
    ctaHref: "/pricing",
    ctaLabel: "Xem bảng giá và ưu đãi gói năm",
    icon: CheckCircle2,
  },
] as const;

export function SectionFunnelAwareness() {
  return (
    <section className="hp-section" id="funnel-awareness">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Funnel nội dung rõ ràng: TOFU → MOFU → BOFU</h2>
            <p className="muted-text">
              Mỗi giai đoạn có mục tiêu, thông điệp và CTA riêng để dẫn phụ huynh từ nhận biết đến dùng thử và thanh toán.
            </p>
          </div>
        </ScrollReveal>

        <div className="hp-grid-3">
          {FUNNEL_STAGES.map((item, index) => (
            <ScrollReveal key={item.stage} delay={index * 0.1}>
              <article className="card hp-funnel-card">
                <div className="hp-funnel-stage-row">
                  <span className="hp-funnel-stage-badge">{item.stage}</span>
                  <span className="hp-icon-box">
                    <item.icon size={18} aria-hidden />
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p className="muted-text">{item.description}</p>

                <ul className="hp-funnel-channel-list">
                  {item.channels.map((channel) => (
                    <li key={channel}>{channel}</li>
                  ))}
                </ul>

                <Link href={item.ctaHref} className="hp-funnel-link">
                  {item.ctaLabel}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
