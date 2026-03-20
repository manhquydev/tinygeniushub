import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản và điều kiện sử dụng dịch vụ Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/terms" },
};

export default function TermsOfServicePage() {
  return (
    <article className="prose-page">
      <h1>Điều khoản sử dụng</h1>
      <p>
        Điều khoản này quy định quyền và nghĩa vụ giữa người dùng và Cùng Con Tự Học khi sử dụng nền tảng. Vui lòng đọc
        kỹ trước khi tạo tài khoản hoặc tiếp tục sử dụng dịch vụ.
      </p>

      <h2>1. Chấp nhận điều khoản</h2>
      <ul>
        <li>Việc sử dụng dịch vụ đồng nghĩa với việc bạn đồng ý với các điều khoản này.</li>
        <li>Nếu không đồng ý, vui lòng ngừng truy cập và sử dụng nền tảng.</li>
      </ul>

      <h2>2. Mô tả dịch vụ</h2>
      <ul>
        <li>Nền tảng học tập trực tuyến cho trẻ từ 2 đến 6 tuổi.</li>
        <li>Phụ huynh tạo và quản lý hồ sơ học tập của con.</li>
        <li>Gói dịch vụ gồm bản miễn phí và gói trả phí Family+.</li>
      </ul>

      <h2>3. Điều kiện sử dụng</h2>
      <ul>
        <li>Người đăng ký tài khoản phải từ 18 tuổi trở lên.</li>
        <li>Thông tin cung cấp khi đăng ký cần chính xác và cập nhật.</li>
        <li>Số lượng hồ sơ trẻ được giới hạn theo từng gói dịch vụ.</li>
      </ul>

      <h2>4. Thanh toán và hoàn tiền</h2>
      <ul>
        <li>Phí dịch vụ được xử lý qua cổng thanh toán bảo mật.</li>
        <li>Bạn có thể hủy gia hạn theo chu kỳ bất kỳ lúc nào.</li>
        <li>Chính sách hoàn tiền áp dụng theo trang Chính Sách Hoàn Tiền.</li>
      </ul>

      <h2>5. Nội dung và sở hữu trí tuệ</h2>
      <ul>
        <li>Nội dung bài học, hình ảnh, âm thanh và tài liệu thuộc quyền sở hữu của Cùng Con Tự Học.</li>
        <li>Không được sao chép, phân phối hoặc thương mại hóa nội dung nếu chưa có chấp thuận bằng văn bản.</li>
      </ul>

      <h2>6. Giới hạn trách nhiệm</h2>
      <ul>
        <li>Dịch vụ được cung cấp trên cơ sở nỗ lực tốt nhất theo điều kiện vận hành thực tế.</li>
        <li>Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp ngoài phạm vi kiểm soát hợp lý.</li>
      </ul>

      <h2>7. Chấm dứt tài khoản</h2>
      <ul>
        <li>Chúng tôi có thể tạm ngưng hoặc chấm dứt tài khoản nếu phát hiện vi phạm điều khoản.</li>
        <li>Người dùng có thể yêu cầu xóa tài khoản và dữ liệu liên quan theo chính sách hiện hành.</li>
      </ul>

      <h2>8. Thay đổi điều khoản</h2>
      <p>
        Chúng tôi có thể cập nhật điều khoản để phản ánh thay đổi pháp lý hoặc sản phẩm. Với thay đổi quan trọng, chúng
        tôi sẽ thông báo trước qua email hoặc trong ứng dụng.
      </p>

      <h2>9. Pháp luật áp dụng</h2>
      <p>Các điều khoản này được điều chỉnh theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</p>

      <h2>10. Liên hệ</h2>
      <p>Email hỗ trợ: support@cungcontuhoc.io.vn</p>

      <p className="last-updated">Ngày cập nhật gần nhất: 23/02/2026</p>
    </article>
  );
}
