import type { Metadata } from "next";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền",
  description: "Chính sách hoàn tiền cho giao dịch mua khóa học tại Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Chính sách hoàn tiền</h1>
      <p>
        Chúng tôi áp dụng chính sách hoàn tiền minh bạch để bảo vệ quyền lợi phụ huynh trong quá trình sử dụng dịch
        vụ học tập.
      </p>

      <h2>1. Phạm vi áp dụng</h2>
      <ul>
        <li>Áp dụng cho giao dịch mua gói/khóa học trực tuyến trên nền tảng.</li>
        <li>Các trường hợp từ chối hoàn tiền chỉ áp dụng trong phạm vi pháp luật cho phép.</li>
      </ul>

      <h2>2. Điều kiện hoàn tiền</h2>
      <ul>
        <li>Yêu cầu được gửi trong vòng 30 ngày kể từ ngày thanh toán thành công đầu tiên.</li>
        <li>Yêu cầu gửi từ email đã đăng ký tài khoản hoặc kênh hỗ trợ đã xác minh.</li>
        <li>Thông tin yêu cầu phải đầy đủ để xác thực giao dịch.</li>
      </ul>

      <h2>3. Hồ sơ yêu cầu</h2>
      <ul>
        <li>Email tài khoản đăng ký.</li>
        <li>Mã giao dịch/biên nhận thanh toán (nếu có).</li>
        <li>Lý do yêu cầu hoàn tiền.</li>
      </ul>

      <h2>4. Kênh tiếp nhận</h2>
      <ul>
        <li>Email: billing@cungcontuhoc.io.vn</li>
        <li>Tiêu đề gợi ý: “Yêu cầu hoàn tiền - [Email tài khoản]”.</li>
      </ul>

      <h2>5. Thời gian xử lý</h2>
      <ul>
        <li>Chúng tôi phản hồi trạng thái tiếp nhận trong thời gian sớm nhất.</li>
        <li>Thời gian xử lý dự kiến 5-10 ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ, tùy đối tác thanh toán.</li>
      </ul>

      <h2>6. Lưu ý</h2>
      <ul>
        <li>Chính sách này không hạn chế các quyền bắt buộc của người tiêu dùng theo pháp luật.</li>
        <li>Việc hoàn tiền có thể bị ảnh hưởng bởi chính sách của cổng thanh toán hoặc ngân hàng phát hành thẻ.</li>
        <li>Chúng tôi có quyền yêu cầu thông tin bổ sung để phòng chống gian lận giao dịch.</li>
      </ul>

      <h2>7. Cơ sở pháp lý tham chiếu</h2>
      <ul>
        <li>Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 (hiệu lực từ 01/07/2024).</li>
        <li>Nghị định 55/2024/NĐ-CP quy định chi tiết một số điều của Luật Bảo vệ quyền lợi người tiêu dùng.</li>
        <li>Luật Giao dịch điện tử số 20/2023/QH15 (hiệu lực từ 01/07/2024).</li>
        <li>Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP về thương mại điện tử.</li>
      </ul>

      <p className="last-updated">Ngày cập nhật gần nhất: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
