import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản và điều kiện khi sử dụng dịch vụ của Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/terms" },
};

export default function TermsOfServicePage() {
  return (
    <article className="prose-page">
      <h1>Điều khoản sử dụng</h1>
      <p>
        Điều khoản này quy định quyền và nghĩa vụ giữa người dùng và Cùng Con Tự Học khi sử dụng nền tảng. Vui lòng
        đọc kỹ trước khi tạo tài khoản hoặc tiếp tục sử dụng dịch vụ.
      </p>

      <h2>1. Chấp thuận điều khoản</h2>
      <ul>
        <li>Việc sử dụng nền tảng đồng nghĩa bạn đồng ý với các điều khoản này.</li>
        <li>Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</li>
      </ul>

      <h2>2. Mô tả dịch vụ</h2>
      <ul>
        <li>Nền tảng học trực tuyến dành cho trẻ từ 2-6 tuổi.</li>
        <li>Phụ huynh tạo và quản lý hồ sơ học tập của con.</li>
        <li>Quyền truy cập khóa học được cung cấp thông qua giao dịch mua khóa học.</li>
      </ul>

      <h2>3. Điều kiện sử dụng</h2>
      <ul>
        <li>Chủ tài khoản phải từ 18 tuổi trở lên.</li>
        <li>Thông tin đăng ký cần chính xác và được cập nhật khi có thay đổi.</li>
        <li>Số lượng hồ sơ trẻ có thể giới hạn theo cấu hình gói tài khoản.</li>
      </ul>

      <h2>4. Thanh toán và hoàn tiền</h2>
      <ul>
        <li>Thanh toán được xử lý qua đối tác thanh toán bảo mật.</li>
        <li>Chính sách hoàn tiền tuân theo trang chính sách hoàn tiền đã công bố.</li>
      </ul>

      <h2>5. Quyền sở hữu nội dung</h2>
      <ul>
        <li>Nội dung khóa học, hình ảnh, âm thanh và tài liệu thuộc sở hữu của Cùng Con Tự Học.</li>
        <li>Việc sao chép hoặc phân phối thương mại cần có chấp thuận bằng văn bản.</li>
      </ul>

      <h2>6. Giới hạn trách nhiệm</h2>
      <ul>
        <li>Dịch vụ được cung cấp trên nguyên tắc nỗ lực tốt nhất trong điều kiện vận hành thực tế.</li>
        <li>Chúng tôi không chịu trách nhiệm với các thiệt hại gián tiếp nằm ngoài khả năng kiểm soát hợp lý.</li>
      </ul>

      <h2>7. Tạm ngưng hoặc chấm dứt tài khoản</h2>
      <ul>
        <li>Tài khoản có thể bị tạm ngưng nếu vi phạm chính sách sử dụng.</li>
        <li>Người dùng có thể yêu cầu xóa tài khoản theo chính sách hiện hành.</li>
      </ul>

      <h2>8. Cập nhật điều khoản</h2>
      <p>
        Chúng tôi có thể cập nhật điều khoản để phản ánh thay đổi pháp lý hoặc sản phẩm. Các thay đổi quan trọng sẽ
        được thông báo qua email hoặc thông báo trong ứng dụng.
      </p>

      <h2>9. Luật áp dụng</h2>
      <p>Các điều khoản này được điều chỉnh theo pháp luật của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</p>

      <h2>10. Liên hệ</h2>
      <p>Email hỗ trợ: support@cungcontuhoc.io.vn</p>

      <p className="last-updated">Ngày cập nhật gần nhất: 17/03/2026</p>
    </article>
  );
}
