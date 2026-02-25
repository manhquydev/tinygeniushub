"use client";

import { Award, Brain, Camera, Mail, Route, ShieldCheck, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FEATURES: ReadonlyArray<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Brain,
    title: "Toán tư duy đúng lứa tuổi 2–6",
    description: "Chương trình Toán được thiết kế riêng cho từng giai đoạn phát triển: đếm số, nhận biết hình khối, so sánh, logic cơ bản. Không áp đặt — dạy đúng cách não bé đang hoạt động.",
  },
  {
    icon: Route,
    title: "Lộ trình rõ ràng từ dễ đến khó",
    description: "Từng bài học được sắp xếp theo trình tự khoa học — Tiếng Anh Phonics kết hợp Toán tư duy. Con không bỏ sót kiến thức, ba mẹ không phải lo con học lộn xộn.",
  },
  {
    icon: Camera,
    title: "Bằng chứng tiến bộ thật, không phải điểm số ảo",
    description: "Checklist bài học, kết quả quiz, ảnh và audio do phụ huynh ghi lại — tất cả được lưu giữ để bạn thấy con tiến bộ từng tuần một cách cụ thể.",
  },
  {
    icon: Mail,
    title: "Báo cáo tuần tự động gửi về email",
    description: "Mỗi tuần một bản tóm tắt chi tiết — bài nào đã học, điểm mạnh của con, gợi ý tuần tiếp theo. Không cần mở app vẫn nắm rõ tình hình học tập của con.",
  },
  {
    icon: ShieldCheck,
    title: "Hoàn toàn an toàn, ba mẹ kiểm soát hoàn toàn",
    description: "Không quảng cáo, không link dẫn ra ngoài, không nội dung không phù hợp. Bạn quản lý thời gian học, chọn nội dung, và tắt bất kỳ lúc nào.",
  },
  {
    icon: Award,
    title: "Chứng chỉ hoàn thành khóa học",
    description: "Khi con hoàn thành một giai đoạn học, hệ thống cấp chứng chỉ số có tên con và kết quả cụ thể — ba mẹ có thể in hoặc chia sẻ với ông bà như một cột mốc tự hào.",
  },
];

export function SectionFeatures() {
  return (
    <section className="hp-section" id="features">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Một nền tảng duy nhất — đủ để con học toàn diện từ 2 đến 6 tuổi</h2>
            <p className="muted-text">Toán tư duy và Tiếng Anh Phonics trong cùng một lộ trình liên tục — không app nào khác ở Việt Nam có đủ cả hai cho độ tuổi này.</p>
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
