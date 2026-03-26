import type { Metadata } from "next";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Cam kết bảo vệ dữ liệu phụ huynh và dữ liệu trẻ em trên nền tảng Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Chính sách bảo mật</h1>
      <p>
        Chính sách này giải thích cách Cùng Con Tự Học thu thập, xử lý, lưu trữ và bảo vệ dữ liệu cá nhân của phụ
        huynh, dữ liệu học tập của trẻ em khi sử dụng nền tảng.
      </p>

      <h2>1. Cơ sở pháp lý tham chiếu</h2>
      <ul>
        <li>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026).</li>
        <li>Nghị định 356/2025/NĐ-CP (hiệu lực từ 01/01/2026; thay thế Nghị định 13/2023/NĐ-CP).</li>
        <li>Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và văn bản hướng dẫn liên quan.</li>
      </ul>

      <h2>2. Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li>Dữ liệu tài khoản phụ huynh: email, tên hiển thị, trạng thái đăng ký.</li>
        <li>Dữ liệu học tập trẻ em: hồ sơ học tập, tiến độ bài học, lịch sử tương tác học tập.</li>
        <li>Dữ liệu kỹ thuật: địa chỉ IP, thiết bị, nhật ký truy cập phục vụ an toàn hệ thống.</li>
        <li>Dữ liệu thanh toán: thông tin nghiệp vụ giao dịch từ đối tác thanh toán (không lưu số thẻ đầy đủ).</li>
      </ul>

      <h2>3. Mục đích xử lý dữ liệu</h2>
      <ul>
        <li>
          Chúng tôi xử lý dữ liệu trên một hoặc nhiều căn cứ pháp lý phù hợp, như thực hiện hợp đồng, nghĩa vụ pháp
          lý, sự đồng ý hoặc lợi ích hợp pháp theo pháp luật áp dụng.
        </li>
        <li>Vận hành tài khoản và chức năng học tập cốt lõi.</li>
        <li>Cá nhân hóa trải nghiệm học theo độ tuổi/mức độ của trẻ.</li>
        <li>Gửi thông báo dịch vụ, báo cáo tiến độ, hỗ trợ kỹ thuật.</li>
        <li>Phòng chống gian lận, lạm dụng và đáp ứng yêu cầu pháp luật.</li>
      </ul>

      <h2>4. Dữ liệu trẻ em</h2>
      <ul>
        <li>Tài khoản chính do phụ huynh tạo và kiểm soát.</li>
        <li>Chúng tôi không thực hiện mua bán dữ liệu cá nhân trẻ em cho mục đích thương mại độc lập.</li>
        <li>Không chạy quảng cáo hành vi nhắm trực tiếp vào trẻ em.</li>
        <li>Khi cần xử lý ngoài mục tiêu học tập cốt lõi, chúng tôi yêu cầu cơ sở hợp pháp phù hợp.</li>
      </ul>

      <h2>5. Chia sẻ dữ liệu với bên thứ ba</h2>
      <ul>
        <li>Chỉ chia sẻ trong phạm vi cần thiết để cung cấp dịch vụ.</li>
        <li>Các nhóm đối tác chính: hạ tầng, email, thanh toán, bảo mật và phân tích.</li>
        <li>Đối tác phải tuân thủ nghĩa vụ bảo mật dữ liệu theo hợp đồng hoặc quy định pháp luật áp dụng.</li>
      </ul>

      <h2>6. Lưu trữ và bảo vệ dữ liệu</h2>
      <ul>
        <li>Dữ liệu được bảo vệ bằng biện pháp kỹ thuật và tổ chức phù hợp rủi ro.</li>
        <li>Áp dụng nguyên tắc giới hạn quyền truy cập theo vai trò.</li>
        <li>Thời hạn lưu trữ được xác định theo mục đích xử lý và nghĩa vụ pháp lý liên quan.</li>
      </ul>

      <h2>7. Quyền của chủ thể dữ liệu</h2>
      <ul>
        <li>Quyền được biết, truy cập, chỉnh sửa dữ liệu cá nhân.</li>
        <li>Quyền yêu cầu hạn chế xử lý hoặc xóa dữ liệu trong phạm vi pháp luật cho phép.</li>
        <li>Quyền rút lại đồng ý đối với các mục đích dựa trên đồng ý.</li>
        <li>Chúng tôi phản hồi yêu cầu của chủ thể dữ liệu trong thời hạn theo quy định pháp luật áp dụng.</li>
      </ul>

      <h2>8. Cookie và theo dõi</h2>
      <ul>
        <li>Cookie cần thiết luôn hoạt động để đảm bảo bảo mật đăng nhập.</li>
        <li>Cookie phân tích/tiếp thị chỉ bật khi có đồng ý rõ ràng.</li>
        <li>Chi tiết xem tại trang <a href="/cookie-policy">Chính sách Cookie</a>.</li>
      </ul>

      <h2>9. Chuyển dữ liệu xuyên biên giới</h2>
      <p>
        Khi có hoạt động chuyển dữ liệu cá nhân xuyên biên giới, chúng tôi triển khai hồ sơ và biện pháp kiểm soát
        theo khung pháp lý áp dụng tại thời điểm xử lý.
      </p>

      <h2>10. Liên hệ thực hiện quyền dữ liệu</h2>
      <ul>
        <li>Email: privacy@cungcontuhoc.io.vn</li>
        <li>Đơn vị vận hành: Cùng Con Tự Học</li>
      </ul>

      <p className="last-updated">Ngày cập nhật gần nhất: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
