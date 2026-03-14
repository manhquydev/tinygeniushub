"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Cloud,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trophy,
} from "lucide-react";
import "./unified-scroll-journey.css";

const FAQ_ITEMS = [
  {
    q: "Nền tảng phù hợp với độ tuổi nào?",
    a: "Nội dung được thiết kế cho bé 2-6 tuổi, chia theo mức độ phát triển để bé học đúng nhịp.",
  },
  {
    q: "Có cần thẻ tín dụng khi dùng thử không?",
    a: "Không. Bạn có thể bắt đầu 7 ngày miễn phí mà không cần nhập thông tin thẻ.",
  },
  {
    q: "Phụ huynh theo dõi tiến độ bằng cách nào?",
    a: "Dashboard hiển thị bài đã học, mức hoàn thành, và báo cáo tuần gửi tự động qua email.",
  },
] as const;

type Stage = {
  id: string;
  label: string;
  left: ReactNode;
  right: ReactNode;
};

const COURSE_PROMOS = [
  {
    id: "littlefox-en",
    title: "Little Fox English",
    src: "/images/courses/course_cover_littlefox.png",
  },
  {
    id: "littlefox-cn",
    title: "Little Fox Chinese",
    src: "/images/courses/course_cover_littlefox_cn.png",
  },
  {
    id: "abeka-math",
    title: "Abeka Math Foundations",
    src: "/images/courses/course_cover_abeka.png",
  },
] as const;

const STAGES: Stage[] = [
  {
    id: "hero",
    label: "Khởi Hành",
    left: (
      <article className="usj-card usj-card-hero">
        <span className="usj-chip">Lộ trình học tại nhà cho bé 2-6 tuổi</span>
        <h1>Khu vườn học tập hai bên, chừa trục giữa cho cây đậu leo</h1>
        <p>
          Mỗi khi cuộn xuống, bạn đi qua một tầng học mới. Các thành phần nằm ở hai mép màn hình để giữ đường leo
          cây luôn rõ ràng ở trung tâm.
        </p>
        <div className="usj-actions">
          <Link href="/auth/signup" className="usj-btn usj-btn-solid">
            Bắt đầu miễn phí 7 ngày
          </Link>
          <Link href="/pricing" className="usj-btn usj-btn-ghost">
            Xem bảng giá
          </Link>
        </div>
      </article>
    ),
    right: (
      <article className="usj-card">
        <h2>Điểm khác biệt</h2>
        <ul className="usj-list">
          <li>
            <Sprout size={18} aria-hidden />
            Lộ trình từ dễ đến khó theo từng bé
          </li>
          <li>
            <Cloud size={18} aria-hidden />
            Mở tầng nội dung theo tiến độ thực tế
          </li>
          <li>
            <Trophy size={18} aria-hidden />
            Báo cáo tuần rõ ràng cho phụ huynh
          </li>
        </ul>
      </article>
    ),
  },
  {
    id: "method",
    label: "Tầng 1",
    left: (
      <article className="usj-card">
        <h2>Toán tư duy + Tiếng Anh Phonics</h2>
        <p>
          Nội dung được tổ chức thành các chặng ngắn, mỗi chặng 15 phút. Trẻ học đều mỗi ngày thay vì bị quá tải.
        </p>
        <div className="usj-course-promos" aria-label="Bộ 3 khóa học nổi bật">
          {COURSE_PROMOS.map((course) => (
            <figure key={course.id} className="usj-course-promo">
              <Image
                src={course.src}
                alt={`Ảnh quảng cáo khóa học ${course.title}`}
                width={1376}
                height={768}
                className="usj-course-promo-image"
              />
              <figcaption>{course.title}</figcaption>
            </figure>
          ))}
        </div>
      </article>
    ),
    right: (
      <article className="usj-card">
        <h2>Thiết kế theo hành vi học</h2>
        <ul className="usj-list">
          <li>
            <Brain size={18} aria-hidden />
            Bài học ngắn, nhịp độ rõ ràng
          </li>
          <li>
            <BookOpen size={18} aria-hidden />
            Học online và có hoạt động offline
          </li>
          <li>
            <Sparkles size={18} aria-hidden />
            Giữ hứng thú bằng cơ chế mở khóa
          </li>
        </ul>
      </article>
    ),
  },
  {
    id: "proof",
    label: "Tầng 2",
    left: (
      <article className="usj-card">
        <h2>Bằng chứng tiến bộ</h2>
        <p>
          Không chỉ điểm số. Hệ thống lưu kết quả quiz, nhật ký học, và minh chứng hoạt động theo tuần để phụ huynh
          thấy sự thay đổi cụ thể.
        </p>
      </article>
    ),
    right: (
      <article className="usj-card">
        <h2>Phụ huynh luôn nắm được tình hình</h2>
        <ul className="usj-list">
          <li>
            <BarChart3 size={18} aria-hidden />
            Dashboard theo từng bé
          </li>
          <li>
            <CheckCircle2 size={18} aria-hidden />
            Báo cáo tuần gửi tự động
          </li>
          <li>
            <ShieldCheck size={18} aria-hidden />
            Môi trường học an toàn, không quảng cáo
          </li>
        </ul>
      </article>
    ),
  },
  {
    id: "pricing",
    label: "Tầng 3",
    left: (
      <article className="usj-card usj-price">
        <span className="usj-chip usj-chip-soft">Standard</span>
        <h2>799,000đ / năm</h2>
        <p>Phù hợp gia đình một bé: lộ trình đầy đủ, báo cáo tuần, theo dõi tiến độ tại nhà.</p>
        <Link href="/auth/signup" className="usj-btn usj-btn-ghost">
          Chọn Standard
        </Link>
      </article>
    ),
    right: (
      <article className="usj-card usj-price usj-price-highlight">
        <span className="usj-chip">Family+</span>
        <h2>1,199,000đ / năm</h2>
        <p>Cho gia đình nhiều bé với báo cáo gộp và vùng theo dõi mở rộng.</p>
        <Link href="/auth/signup" className="usj-btn usj-btn-solid">
          Bắt đầu dùng thử
          <ArrowRight size={16} aria-hidden />
        </Link>
      </article>
    ),
  },
  {
    id: "faq",
    label: "Gốc Cây",
    left: (
      <article className="usj-card">
        <h2>Câu hỏi thường gặp</h2>
        <div className="usj-faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="usj-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </article>
    ),
    right: (
      <article className="usj-card usj-card-cta">
        <h2>Sẵn sàng bắt đầu hành trình?</h2>
        <p>Cho bé học đúng nhịp mỗi ngày, phụ huynh theo dõi được tiến bộ thật.</p>
        <Link href="/kid/courses" className="usj-btn usj-btn-solid">
          Vào khu vườn học
          <ArrowRight size={16} aria-hidden />
        </Link>
      </article>
    ),
  },
];

const STARS = [
  { top: "4%", left: "8%", size: 2, duration: 3.6, delay: -1.1 },
  { top: "7%", left: "18%", size: 3, duration: 4.1, delay: -0.6 },
  { top: "5%", left: "31%", size: 2, duration: 3.2, delay: -2.2 },
  { top: "9%", left: "46%", size: 2, duration: 4.4, delay: -1.7 },
  { top: "6%", left: "59%", size: 3, duration: 3.8, delay: -0.4 },
  { top: "10%", left: "71%", size: 2, duration: 4.6, delay: -2.5 },
  { top: "8%", left: "84%", size: 3, duration: 3.5, delay: -1.2 },
  { top: "13%", left: "13%", size: 2, duration: 4.7, delay: -3.1 },
  { top: "15%", left: "24%", size: 2, duration: 3.9, delay: -1.4 },
  { top: "18%", left: "37%", size: 3, duration: 4.2, delay: -0.9 },
  { top: "16%", left: "52%", size: 2, duration: 3.3, delay: -2.6 },
  { top: "14%", left: "66%", size: 2, duration: 4.8, delay: -0.8 },
  { top: "17%", left: "79%", size: 3, duration: 3.7, delay: -2.1 },
  { top: "22%", left: "7%", size: 2, duration: 4.3, delay: -1.5 },
  { top: "24%", left: "20%", size: 2, duration: 3.1, delay: -0.2 },
  { top: "26%", left: "34%", size: 3, duration: 4.9, delay: -3.3 },
  { top: "27%", left: "48%", size: 2, duration: 3.8, delay: -1.9 },
  { top: "23%", left: "62%", size: 2, duration: 4.6, delay: -0.5 },
  { top: "25%", left: "75%", size: 3, duration: 3.4, delay: -2.8 },
  { top: "28%", left: "88%", size: 2, duration: 4.5, delay: -1.6 },
  { top: "34%", left: "12%", size: 2, duration: 4.2, delay: -2.4 },
  { top: "36%", left: "30%", size: 3, duration: 3.6, delay: -0.7 },
  { top: "33%", left: "54%", size: 2, duration: 4.1, delay: -1.3 },
  { top: "37%", left: "78%", size: 2, duration: 3.9, delay: -2.7 },
] as const;

export function UnifiedScrollJourney() {
  return (
    <main className="usj-page">
      <div className="usj-starfield" aria-hidden>
        {STARS.map((star) => (
          <span
            key={`${star.top}-${star.left}`}
            className="usj-star"
            style={
              {
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="usj-sky-glow usj-sky-glow-a" aria-hidden />
      <div className="usj-sky-glow usj-sky-glow-b" aria-hidden />
      <div className="usj-climb-track" aria-hidden />

      <ol className="usj-stage-list">
        {STAGES.map((stage, index) => (
          <li key={stage.id} className="usj-stage-row">
            <div className="usj-side">{stage.left}</div>

            <div className="usj-center">
              <div className="usj-node">
                <span>{index + 1}</span>
              </div>
              <div className="usj-node-label">{stage.label}</div>
            </div>

            <div className="usj-side">{stage.right}</div>
          </li>
        ))}
      </ol>

      <section className="usj-destination" aria-label="Điểm cuối của hành trình">
        <div className="usj-cloud-platform" aria-hidden>
          <Image
            src="/assets/garden/cloud_platform.png"
            alt=""
            width={768}
            height={768}
            className="usj-cloud-platform-image"
          />
        </div>

        <div className="usj-island-wrap">
          <Image
            src="/assets/garden/ground.png"
            alt="Đảo nổi ở cuối thân đậu"
            width={768}
            height={768}
            className="usj-island-image"
          />
        </div>

        <div className="usj-marketing-cta">
          <h3>Sẵn sàng cho bé bắt đầu hành trình?</h3>
          <p>Nhận lộ trình cá nhân hóa và dùng thử 7 ngày để xem tiến bộ ngay từ tuần đầu.</p>
          <Link href="/auth/signup" className="usj-btn usj-btn-solid">
            Nhận lộ trình miễn phí
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
