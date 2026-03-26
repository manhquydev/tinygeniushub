import type { Metadata } from "next";
import { CookieConsentActions } from "@/components/legal/cookie-consent-actions";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export const metadata: Metadata = {
  title: "Chính sách Cookie",
  description:
    "Giải thích cách Cùng Con Tự Học dùng cookie cần thiết, phân tích và tiếp thị; cách phụ huynh quản lý hoặc rút lại đồng ý.",
  alternates: { canonical: "https://cungcontuhoc.io.vn/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <article className="prose-page">
      <h1>Chính sách Cookie</h1>
      <p>
        Chính sách này mô tả cách Cùng Con Tự Học dùng cookie khi bạn truy cập website/app. Chúng tôi chỉ bật cookie
        không thiết yếu sau khi có đồng ý rõ ràng từ phụ huynh.
      </p>

      <h2>1. Cookie là gì</h2>
      <p>
        Cookie là tệp nhỏ lưu trên trình duyệt để nhận diện phiên làm việc, ghi nhớ lựa chọn và đo lường hiệu quả sản
        phẩm.
      </p>

      <h2>2. Nhóm cookie chúng tôi sử dụng</h2>
      <ul>
        <li>
          <strong>Cookie cần thiết:</strong> bắt buộc để đăng nhập, duy trì phiên, chống lạm dụng và bảo mật hệ thống.
        </li>
        <li>
          <strong>Cookie phân tích:</strong> đo lường hành vi sử dụng tổng hợp (ví dụ GA4) để cải thiện sản phẩm.
        </li>
        <li>
          <strong>Cookie tiếp thị:</strong> đo hiệu quả chiến dịch (ví dụ Meta Pixel) cho nội dung tiếp cận phụ huynh.
        </li>
      </ul>

      <h2>3. Nguyên tắc đồng ý</h2>
      <ul>
        <li>Chúng tôi không mặc định “đồng ý tất cả”.</li>
        <li>Im lặng/không thao tác không được coi là đồng ý.</li>
        <li>Bạn có thể rút lại hoặc thay đổi lựa chọn bất kỳ lúc nào.</li>
      </ul>

      <h2>4. Quản lý lựa chọn cookie</h2>
      <p>
        Hiện tại bảng điều khiển cookie hỗ trợ 2 lựa chọn: (i) chỉ cookie cần thiết hoặc (ii) chấp nhận tất cả
        cookie không thiết yếu.
      </p>
      <CookieConsentActions className="not-prose mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" />

      <h2>5. Cookie chính theo nền tảng hiện tại</h2>
      <ul>
        <li>
          <code>ccth_session</code>, <code>ccth_reader_session</code>: cookie cần thiết cho xác thực.
        </li>
        <li>
          <code>ccth_cookie_consent_v1</code>: lưu lựa chọn cookie của bạn.
        </li>
        <li>
          <code>ab_pricing_v</code>, <code>ab_courses_v</code>, <code>ccth_attr_v1</code>: chỉ bật khi có đồng ý
          phân tích.
        </li>
      </ul>
      <p>
        Thời hạn lưu cookie được áp dụng theo từng nhóm và/hoặc theo phiên, tối đa theo cấu hình công bố tại thời
        điểm xử lý.
      </p>

      <h2>6. Cơ sở pháp lý tham chiếu</h2>
      <ul>
        <li>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026).</li>
        <li>Nghị định 356/2025/NĐ-CP (hiệu lực từ 01/01/2026; thay thế Nghị định 13/2023/NĐ-CP).</li>
        <li>Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và văn bản hướng dẫn liên quan.</li>
      </ul>

      <h2>7. Liên hệ</h2>
      <p>
        Nếu cần hỗ trợ về lựa chọn cookie hoặc quyền dữ liệu cá nhân, vui lòng liên hệ:{" "}
        <a href="mailto:privacy@cungcontuhoc.io.vn">privacy@cungcontuhoc.io.vn</a>.
      </p>

      <p className="last-updated">Ngày cập nhật gần nhất: {LEGAL_POLICY_LAST_UPDATED_LABEL}</p>
    </article>
  );
}
