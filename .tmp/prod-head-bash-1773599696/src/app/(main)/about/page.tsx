import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Câu chuyện đằng sau Cùng Con Tự Học - nền tảng học tập cho trẻ 2-6 tuổi được xây dựng bởi phụ huynh Việt.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/about" },
};

export default function AboutPage() {
  return (
    <div>
      <section className="about-hero">
        <h1>Câu chuyện của chúng tôi</h1>
        <p className="about-lead">
          Cùng Con Tự Học được tạo ra bởi những phụ huynh hiểu rõ thách thức của việc nuôi dưỡng và giáo dục trẻ nhỏ
          trong cuộc sống hiện đại.
        </p>
      </section>

      <section className="about-mission">
        <article className="mission-card">
          <h2>Sứ mệnh</h2>
          <p>
            Giúp mỗi trẻ em Việt Nam có cơ hội phát triển toàn diện qua học tập vui vẻ, kết hợp công nghệ và sự đồng
            hành của phụ huynh.
          </p>
        </article>
        <article className="mission-card">
          <h2>Tầm nhìn</h2>
          <p>Trở thành người bạn đồng hành học tập đáng tin cậy nhất của một triệu gia đình Việt Nam.</p>
        </article>
      </section>

      <section className="about-why">
        <h2>Tại sao chúng tôi xây dựng sản phẩm này?</h2>
        <p>
          Là phụ huynh, chúng tôi từng băn khoăn: Con có đang phát triển đúng hướng hay không? Mỗi ngày học bao lâu là
          đủ? Làm sao thấy được tiến bộ thật sự thay vì cảm nhận mơ hồ?
        </p>
        <p>
          Cùng Con Tự Học được xây dựng để trả lời các câu hỏi đó bằng dữ liệu rõ ràng, bài học có lộ trình và báo cáo
          giúp phụ huynh đưa ra quyết định tốt hơn cho con.
        </p>
      </section>

      <section className="about-values">
        <h2>Giá trị cốt lõi</h2>
        <div className="values-grid">
          <article>
            <h3>Khoa học</h3>
            <p>Mỗi hoạt động được thiết kế theo nguyên tắc phát triển phù hợp độ tuổi.</p>
          </article>
          <article>
            <h3>Yêu thương</h3>
            <p>Học qua niềm vui, không áp lực, tôn trọng tốc độ riêng của từng bé.</p>
          </article>
          <article>
            <h3>Minh bạch</h3>
            <p>Phụ huynh luôn thấy rõ tiến độ, kết quả và khuyến nghị tiếp theo.</p>
          </article>
        </div>
      </section>

      <section className="about-cta">
        <h2>Bắt đầu hành trình cùng chúng tôi</h2>
        <p>Đăng ký để trải nghiệm lộ trình học tập được cá nhân hóa cho bé.</p>
        <Link href="/auth/signup">Dùng thử miễn phí 7 ngày</Link>
      </section>
    </div>
  );
}
