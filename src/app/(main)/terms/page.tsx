import type { Metadata } from "next";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản và điều kiện sử dụng nền tảng Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/terms" },
};

export default function TermsOfServicePage() {
  return (
    <article className="prose-page">
      <h1>Điều khoản sử dụng</h1>
      <p>
        Điều khoản này quy định quyền và nghĩa vụ giữa người dùng và Cùng Con Tự Học khi sử dụng website, ứng dụng và
        các dịch vụ liên quan.
      </p>

      <h2>1. Chấp thuận điều khoản</h2>
      <ul>
        <li>Khi tạo tài khoản hoặc tiếp tục sử dụng dịch vụ, bạn xác nhận đã đọc và đồng ý điều khoản này.</li>
        <li>Nếu không đồng ý, vui lòng ngừng truy cập và sử dụng dịch vụ.</li>
      </ul>

      <h2>2. Đối tượng sử dụng</h2>
      <ul>
        <li>Chủ tài khoản phải từ đủ 18 tuổi hoặc theo quy định pháp luật áp dụng.</li>
        <li>Phụ huynh chịu trách nhiệm quản lý thông tin tài khoản và hoạt động học của trẻ trên nền tảng.</li>
      </ul>

      <h2>3. Mô tả dịch vụ</h2>
      <ul>
        <li>Nền tảng cung cấp nội dung học tập cho trẻ em, công cụ theo dõi tiến độ và báo cáo cho phụ huynh.</li>
        <li>Một số tính năng có thể yêu cầu gói dịch vụ trả phí hoặc điều kiện sử dụng bổ sung.</li>
      </ul>

      <h2>4. Tài khoản và bảo mật</h2>
      <ul>
        <li>Người dùng phải cung cấp thông tin đăng ký chính xác và cập nhật khi có thay đổi.</li>
        <li>Người dùng tự bảo mật mật khẩu, thiết bị đăng nhập và thông tin xác thực.</li>
        <li>Người dùng cần thông báo ngay khi phát hiện truy cập trái phép.</li>
      </ul>

      <h2>5. Thanh toán và hoàn tiền</h2>
      <ul>
        <li>Phí dịch vụ, chu kỳ thanh toán và quyền lợi gói được công bố tại thời điểm giao dịch.</li>
        <li>Hoàn tiền được áp dụng theo <a href="/refund-policy">Chính sách hoàn tiền</a>.</li>
      </ul>

      <h2>6. Quyền sở hữu trí tuệ</h2>
      <ul>
        <li>Nội dung học tập, thiết kế, mã nguồn và tài sản thương hiệu thuộc quyền sở hữu hợp pháp của nền tảng.</li>
        <li>Nghiêm cấm sao chép, phân phối lại hoặc khai thác thương mại khi chưa có chấp thuận bằng văn bản.</li>
      </ul>

      <h2>7. Hành vi bị cấm</h2>
      <ul>
        <li>Xâm nhập trái phép, can thiệp hệ thống, phát tán mã độc hoặc lạm dụng API.</li>
        <li>Thu thập dữ liệu người dùng trái phép hoặc sử dụng dữ liệu trái mục đích.</li>
        <li>Mạo danh tổ chức/cá nhân khác hoặc cung cấp thông tin gian dối.</li>
      </ul>

      <h2>8. Dữ liệu cá nhân và cookie</h2>
      <ul>
        <li>Việc xử lý dữ liệu cá nhân thực hiện theo <a href="/privacy">Chính sách bảo mật</a>.</li>
        <li>Việc sử dụng cookie thực hiện theo <a href="/cookie-policy">Chính sách Cookie</a>.</li>
      </ul>

      <h2>9. Giới hạn trách nhiệm</h2>
      <ul>
        <li>Không điều khoản nào trong văn bản này loại trừ hoặc hạn chế quyền bắt buộc của người tiêu dùng.</li>
        <li>Việc giới hạn trách nhiệm chỉ áp dụng trong phạm vi pháp luật cho phép.</li>
        <li>Dịch vụ được cung cấp theo nguyên tắc nỗ lực hợp lý trong điều kiện vận hành thực tế.</li>
        <li>
          Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp/phát sinh ngoài phạm vi kiểm soát hợp lý theo quy
          định pháp luật áp dụng.
        </li>
      </ul>

      <h2>10. Tạm ngưng hoặc chấm dứt dịch vụ</h2>
      <ul>
        <li>Chúng tôi có thể tạm ngưng/chấm dứt tài khoản nếu phát hiện vi phạm điều khoản hoặc yêu cầu pháp luật.</li>
        <li>Trừ trường hợp khẩn cấp pháp lý/an ninh, chúng tôi sẽ thông báo trước và cung cấp kênh khiếu nại phù hợp.</li>
        <li>Người dùng có thể yêu cầu chấm dứt tài khoản theo chính sách hiện hành.</li>
      </ul>

      <h2>11. Cập nhật điều khoản</h2>
      <p>
        Điều khoản có thể được cập nhật để phản ánh thay đổi pháp lý hoặc sản phẩm. Thay đổi quan trọng sẽ được thông
        báo trước khi áp dụng.
      </p>

      <h2>12. Luật áp dụng và giải quyết tranh chấp</h2>
      <p>
        Điều khoản này được điều chỉnh theo pháp luật Việt Nam. Trường hợp có tranh chấp, các bên ưu tiên thương lượng
        trước khi chuyển cơ quan có thẩm quyền giải quyết theo quy định pháp luật.
      </p>

      <h2>13. Liên hệ</h2>
      <p>Email hỗ trợ: support@cungcontuhoc.io.vn</p>

      <h2>14. Cơ sở pháp lý tham chiếu</h2>
      <ul>
        <li>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026).</li>
        <li>Nghị định 356/2025/NĐ-CP (hiệu lực từ 01/01/2026; thay thế Nghị định 13/2023/NĐ-CP).</li>
        <li>
          Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 (hiệu lực từ 01/07/2024) và Nghị định
          55/2024/NĐ-CP.
        </li>
        <li>Luật Giao dịch điện tử số 20/2023/QH15 (hiệu lực từ 01/07/2024).</li>
        <li>Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP về thương mại điện tử.</li>
      </ul>

      <p className="last-updated">Ngày cập nhật gần nhất: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
