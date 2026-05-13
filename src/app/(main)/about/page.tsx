import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Câu chuyện hình thành TinyGenius Hub và lý do chúng tôi xây nền tảng học tập lấy trẻ làm trung tâm cho gia đình Việt.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/about" },
};

export default function AboutPage() {
  return (
    <div>
      <section className="about-hero">
        <h1>Câu chuyện của chúng tôi</h1>
        <p className="about-lead">
          TinyGenius Hub được xây dựng bởi những phụ huynh thấu hiểu thách thức khi giúp con học đều đặn mỗi ngày
          tại nhà.
        </p>
      </section>

      <section className="about-mission">
        <article className="mission-card">
          <h2>Sứ mệnh</h2>
          <p>
            Giúp trẻ hình thành thói quen tự học từ sớm bằng lộ trình rõ ràng, bài học vui nhộn và dữ liệu tiến bộ dễ
            theo dõi cho phụ huynh.
          </p>
        </article>
        <article className="mission-card">
          <h2>Tầm nhìn</h2>
          <p>Trở thành người bạn đồng hành học tập tại nhà đáng tin cậy nhất cho gia đình Việt có con từ 2-6 tuổi.</p>
        </article>
      </section>

      <section className="about-why">
        <h2>Vì sao chúng tôi xây nền tảng này?</h2>
        <p>
          Phụ huynh thường băn khoăn: con đang học đúng nhịp chưa, bước tiếp theo là gì, và làm sao nhìn thấy tiến bộ
          thật thay vì chỉ đoán?
        </p>
        <p>
          TinyGenius Hub ra đời để trả lời các câu hỏi đó bằng hệ bài học có cấu trúc, chỉ số tiến bộ đo được và báo
          cáo tuần rõ ràng.
        </p>
      </section>

      <section className="about-values">
        <h2>Giá trị cốt lõi</h2>
        <div className="values-grid">
          <article>
            <h3>Dựa trên bằng chứng</h3>
            <p>Hoạt động được thiết kế theo đặc điểm phát triển và khả năng ghi nhớ của từng độ tuổi.</p>
          </article>
          <article>
            <h3>Lấy trẻ làm trung tâm</h3>
            <p>Bài học ngắn và tiến trình có hướng dẫn giúp giảm áp lực, giữ động lực học cho bé.</p>
          </article>
          <article>
            <h3>Minh bạch với phụ huynh</h3>
            <p>Phụ huynh thấy rõ con đã học gì, tiến bộ ở đâu và nên làm gì tiếp theo.</p>
          </article>
        </div>
      </section>

      <section className="about-cta">
        <h2>Bắt đầu cùng TinyGenius Hub</h2>
        <p>Tạo tài khoản phụ huynh và khám phá khóa học phù hợp nhất với mục tiêu của con.</p>
        <Link href="/courses">Khám phá khóa học</Link>
      </section>
    </div>
  );
}
