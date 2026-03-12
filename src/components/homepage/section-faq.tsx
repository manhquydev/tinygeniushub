"use client";

import { ScrollReveal } from "@/components/homepage/scroll-reveal";

const FAQ_ITEMS = [
  {
    q: "Cùng Con Tự Học dành cho trẻ mấy tuổi?",
    a: "Chương trình thiết kế cho trẻ 2-6 tuổi, với nội dung English và Math phù hợp theo từng độ tuổi.",
  },
  {
    q: "Dùng thử 7 ngày có miễn phí thật không?",
    a: "Hoàn toàn miễn phí, không cần nhập thẻ tín dụng. Hết 7 ngày, bạn tự chọn có tiếp tục hay không.",
  },
  {
    q: "Con tôi chỉ cần học 15 phút mỗi ngày thôi sao?",
    a: "Đúng vậy. Mỗi bài học gồm video ngắn + hoạt động offline + mini quiz. 15 phút đủ để duy trì thói quen học đều đặn.",
  },
  {
    q: "Tôi có thể xem con học được gì không?",
    a: "Có. Dashboard phụ huynh hiển thị bài đã hoàn thành, điểm quiz, chuỗi ngày học. Báo cáo tuần tự động gửi qua email.",
  },
  {
    q: "Thanh toán như thế nào?",
    a: "Thanh toán trực tuyến qua chuyển khoản ngân hàng hoặc ví điện tử. Gói Standard chỉ 799,000đ/năm — dùng Toán + Tiếng Anh cả năm cho bé.",
  },
  {
    q: "Nếu không hài lòng, có được hoàn tiền không?",
    a: "Có. Hoàn tiền 100% trong 30 ngày đầu sau khi thanh toán, không hỏi lý do.",
  },
  // SEO expansion: Long-tail keywords
  {
    q: "Học toán tư duy cho trẻ 2 tuổi có hiệu quả không?",
    a: "Có. Trẻ 2 tuổi học toán qua hình ảnh, màu sắc, và trò chơi tương tác. Khu vườn Toán học sử dụng phương pháp Montessori kết hợp gamification để bé tự nhiên tiếp thu khái niệm số, hình khối, và so sánh.",
  },
  {
    q: "Học tiếng Anh cho trẻ mầm non bắt đầu từ đâu?",
    a: "Bắt đầu từ Phonics (âm thanh chữ cái) và từ vựng đơn giản. Khu vườn Tiếng Anh sử dụng phương pháp TPR (Total Physical Response) - trẻ học qua hành động, âm nhạc, và lặp lại tự nhiên. Mỗi bài dạy 3-5 từ mới với giọng bản ngữ.",
  },
  {
    q: "Khu Vườn Trên Mây là gì?",
    a: "Khu Vườn Trên Mây là giao diện học tập dạng bản đồ tương tác. Mỗi khu vườn (Toán, Tiếng Anh, Nghệ thuật, Âm nhạc, Truyện) là một hành trình riêng. Trẻ chọn khu vườn → chọn bài học → hoàn thành để mở khóa bài tiếp theo. Thiết kế này giúp bé tự chủ và thấy rõ tiến độ.",
  },
  {
    q: "Con tôi có thể học offline không?",
    a: "Một phần có thể. Sau khi xem video bài học online, phụ huynh nhận được PDF hoạt động offline (tô màu, cắt dán, trò chơi). Nhưng quiz và theo dõi tiến độ cần kết nối Internet.",
  },
  {
    q: "Có giáo viên trực tiếp hướng dẫn không?",
    a: "Không. Đây là nền tảng tự học với nội dung chuẩn bị sẵn. Nhưng có nhân vật mascot dẫn dắt (chim cú mèo Oli) và hướng dẫn từng bước bằng giọng nói thân thiện. Phụ huynh đóng vai trò đồng hành cùng con.",
  },
  {
    q: "Lộ trình học có được cá nhân hóa không?",
    a: "Có. Sau bài đánh giá đầu vào (5 phút), hệ thống đề xuất khu vườn phù hợp độ tuổi và năng lực. Nếu bé làm bài quá nhanh → tăng độ khó. Nếu bé gặp khó khăn → giảm tốc và củng cố lại.",
  },
  {
    q: "Tôi có thể theo dõi tiến độ của nhiều con cùng lúc không?",
    a: "Có. Một tài khoản phụ huynh quản lý tối đa 3 hồ sơ con. Mỗi con có lộ trình riêng, báo cáo riêng. Dashboard hiển thị tổng quan toàn bộ các con trong một màn hình.",
  },
  {
    q: "Giá 799,000đ/năm bao gồm những gì?",
    a: "Gói Standard (799k/năm) bao gồm: Truy cập tất cả 5 khu vườn, lộ trình cá nhân hóa, báo cáo hàng tuần, PDF hoạt động offline, 3 hồ sơ con, và cập nhật bài học mới mỗi tháng. Không giới hạn số lần học.",
  },
  {
    q: "Có gói dùng thử ngắn hạn không (1-3 tháng)?",
    a: "Hiện tại chỉ có gói năm để đảm bảo trẻ có đủ thời gian hình thành thói quen học. Nhưng bạn có 7 ngày dùng thử miễn phí + 30 ngày hoàn tiền, nên thực tế có 37 ngày để quyết định.",
  },
  {
    q: "Nếu con tôi chán học giữa chừng thì sao?",
    a: "Điều này hoàn toàn bình thường với trẻ nhỏ. Gợi ý: (1) Thay đổi khu vườn (chuyển từ Toán sang Nghệ thuật), (2) Học vào giờ khác trong ngày, (3) Cho bé nghỉ 2-3 ngày rồi quay lại. Hệ thống có tính năng 'Streak freeze' để không mất chuỗi ngày học.",
  },
] as const;

export function SectionFaq() {
  return (
    <section className="hp-section" id="faq">
      <div className="hp-section-inner">
        <ScrollReveal>
          <div className="hp-section-heading">
            <h2>Câu hỏi thường gặp</h2>
          </div>
        </ScrollReveal>

        <div className="hp-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <ScrollReveal key={item.q} delay={i * 0.06}>
              <details className="hp-faq-item">
                <summary>{item.q}</summary>
                <p className="muted-text hp-faq-answer">{item.a}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
