import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền",
  description: "Chính sách hoàn tiền minh bạch của Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Chính sách hoàn tiền</h1>
      <p>
        Cùng Con Tự Học cam kết minh bạch về quyền lợi thanh toán. Nếu trải nghiệm chưa phù hợp, phụ huynh có thể gửi yêu
        cầu hoàn tiền theo quy định dưới đây.
      </p>

      <h2>Điều kiện hoàn tiền</h2>
      <ul>
        <li>Áp dụng hoàn tiền trong 7 ngày đầu kể từ lần thanh toán đầu tiên.</li>
        <li>Yêu cầu hoàn tiền cần được gửi từ email đã đăng ký tài khoản.</li>
        <li>Sau 7 ngày, yêu cầu hoàn tiền có thể không được chấp thuận nếu dịch vụ đã được sử dụng.</li>
      </ul>

      <h2>Cách gửi yêu cầu</h2>
      <ul>
        <li>Gửi email về: billing@cungcontuhoc.io.vn</li>
        <li>Tiêu đề gợi ý: Yêu cầu hoàn tiền</li>
        <li>Nội dung cần có: email tài khoản, thời điểm thanh toán và lý do yêu cầu.</li>
      </ul>

      <h2>Thời gian xử lý</h2>
      <p>Yêu cầu hợp lệ sẽ được phản hồi và xử lý trong vòng 5 đến 10 ngày làm việc.</p>

      <p className="last-updated">Ngày cập nhật gần nhất: 23/02/2026</p>
    </article>
  );
}
