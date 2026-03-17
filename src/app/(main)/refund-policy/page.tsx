import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền",
  description: "Chính sách hoàn tiền minh bạch cho các giao dịch mua khóa học tại Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Chính sách hoàn tiền</h1>
      <p>
        Chúng tôi minh bạch về quyền lợi thanh toán. Nếu khóa học chưa phù hợp, phụ huynh có thể yêu cầu hoàn tiền
        theo điều kiện dưới đây.
      </p>

      <h2>Điều kiện áp dụng</h2>
      <ul>
        <li>Yêu cầu hoàn tiền được tiếp nhận trong vòng 30 ngày kể từ giao dịch thành công đầu tiên.</li>
        <li>Yêu cầu cần được gửi từ email đã đăng ký tài khoản.</li>
        <li>Yêu cầu ngoài khung 30 ngày có thể không được chấp nhận.</li>
      </ul>

      <h2>Cách gửi yêu cầu</h2>
      <ul>
        <li>Email: billing@cungcontuhoc.io.vn</li>
        <li>Tiêu đề gợi ý: Yêu cầu hoàn tiền</li>
        <li>Nội dung cần có: email tài khoản, ngày thanh toán và lý do yêu cầu.</li>
      </ul>

      <h2>Thời gian xử lý</h2>
      <p>Yêu cầu hợp lệ sẽ được phản hồi và xử lý trong khoảng 5-10 ngày làm việc.</p>

      <p className="last-updated">Ngày cập nhật gần nhất: 17/03/2026</p>
    </article>
  );
}
