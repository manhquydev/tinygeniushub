import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật | Cùng Con Tự Học",
  description: "Cam kết bảo vệ thông tin cá nhân và dữ liệu của trẻ em trên nền tảng Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.vn/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose-page">
      <h1>Chính sách bảo mật</h1>
      <p>
        Cùng Con Tự Học cam kết bảo vệ quyền riêng tư của phụ huynh và dữ liệu học tập của trẻ. Tài liệu này mô tả rõ dữ liệu chúng tôi thu thập,
        mục đích sử dụng và cách bạn kiểm soát thông tin của gia đình mình.
      </p>

      <h2>1. Thông tin chúng tôi thu thập</h2>
      <ul>
        <li>Thông tin tài khoản phụ huynh: email và tên hiển thị.</li>
        <li>Thông tin hồ sơ trẻ: tên, độ tuổi, mục tiêu học tập.</li>
        <li>Dữ liệu học tập: bài học hoàn thành, tiến độ theo thời gian, mức độ tương tác.</li>
        <li>Dữ liệu thiết bị và phiên: địa chỉ IP ẩn danh, loại thiết bị, thời gian truy cập.</li>
      </ul>

      <h2>2. Cách chúng tôi sử dụng thông tin</h2>
      <ul>
        <li>Cung cấp và cải thiện trải nghiệm học tập cho trẻ.</li>
        <li>Tạo báo cáo tiến độ định kỳ để phụ huynh theo dõi.</li>
        <li>Gửi thông báo liên quan đến tài khoản khi bạn đồng ý nhận.</li>
        <li>Đáp ứng nghĩa vụ pháp lý và yêu cầu bảo mật hệ thống.</li>
      </ul>

      <h2>3. Chia sẻ dữ liệu</h2>
      <ul>
        <li>Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.</li>
        <li>Chỉ chia sẻ với nhà cung cấp dịch vụ cần thiết theo thỏa thuận bảo mật.</li>
        <li>Nhà cung cấp chính: Cloudflare (hạ tầng), Resend (email), Stripe (thanh toán).</li>
      </ul>

      <h2>4. Bảo vệ dữ liệu trẻ em</h2>
      <ul>
        <li>Chúng tôi không thu thập thông tin nhận dạng nhạy cảm của trẻ.</li>
        <li>Phụ huynh giữ quyền kiểm soát toàn bộ hồ sơ và dữ liệu học tập của con.</li>
        <li>Chúng tôi áp dụng nguyên tắc bảo vệ dữ liệu theo thông lệ quốc tế và quy định hiện hành tại Việt Nam.</li>
      </ul>

      <h2>5. Quyền của bạn</h2>
      <ul>
        <li>Quyền xem, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân.</li>
        <li>Quyền rút lại đồng ý nhận thông báo bất kỳ lúc nào.</li>
        <li>Liên hệ yêu cầu quyền dữ liệu qua email: privacy@cungcontuhoc.vn.</li>
      </ul>

      <h2>6. Cookies</h2>
      <ul>
        <li>Chúng tôi sử dụng session cookie cần thiết cho đăng nhập và bảo mật.</li>
        <li>Không sử dụng cookie quảng cáo theo dõi hành vi người dùng trẻ em.</li>
      </ul>

      <h2>7. Thay đổi chính sách</h2>
      <p>Khi có thay đổi quan trọng liên quan đến quyền riêng tư, chúng tôi sẽ thông báo qua email hoặc thông báo trong ứng dụng trước khi áp dụng.</p>

      <h2>8. Liên hệ</h2>
      <ul>
        <li>Email: privacy@cungcontuhoc.vn</li>
        <li>Đơn vị vận hành: Cùng Con Tự Học</li>
      </ul>

      <p className="last-updated">Ngày cập nhật gần nhất: 23/02/2026</p>
    </article>
  );
}
