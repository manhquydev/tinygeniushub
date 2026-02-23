import type { Metadata } from "next";
import Link from "next/link";
import { getParentFromServerCookie } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Giới Thiệu Bạn Bè | Cùng Con Tự Học",
  description: "Giới thiệu bạn bè dùng Cùng Con Tự Học và nhận ưu đãi hấp dẫn.",
  alternates: { canonical: "https://cungcontuhoc.vn/referral" },
};

export default async function ReferralPublicPage() {
  const parent = await getParentFromServerCookie();

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Chia sẻ niềm vui học tập</h1>
        <p>
          Mỗi khi bạn giới thiệu thêm một gia đình bắt đầu hành trình học cùng con, cộng đồng học tập sẽ lớn mạnh hơn và
          bạn nhận thêm quyền lợi từ chương trình giới thiệu.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>1. Đăng ký tài khoản</h2>
          <p className="muted-text">Tạo tài khoản phụ huynh và kích hoạt hồ sơ bé.</p>
        </article>

        <article className="card">
          <h2>2. Chia sẻ liên kết</h2>
          <p className="muted-text">Gửi mã hoặc liên kết giới thiệu cho bạn bè, người thân.</p>
        </article>

        <article className="card">
          <h2>3. Nhận phần thưởng</h2>
          <p className="muted-text">Khi lời mời hợp lệ, phần thưởng sẽ được ghi nhận trong dashboard của bạn.</p>
        </article>
      </section>

      <section className="card">
        <h2>Bắt đầu ngay</h2>
        <p className="muted-text">
          {parent
            ? "Bạn đã đăng nhập. Truy cập dashboard để lấy liên kết giới thiệu của riêng bạn."
            : "Bạn chưa đăng nhập. Tạo tài khoản để tham gia chương trình giới thiệu."}
        </p>
        <div className="hero-actions">
          {parent ? (
            <Link href="/parent/dashboard" className="solid-button">
              Mở dashboard phụ huynh
            </Link>
          ) : (
            <Link href="/auth/signup" className="solid-button">
              Đăng ký tài khoản
            </Link>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Điều khoản ngắn gọn</h2>
        <ul>
          <li>Phần thưởng chỉ áp dụng cho lượt giới thiệu hợp lệ theo chính sách chương trình.</li>
          <li>Cùng Con Tự Học có quyền từ chối các trường hợp gian lận hoặc trùng lặp.</li>
          <li>Điều khoản chi tiết có thể được cập nhật để đảm bảo công bằng cho cộng đồng.</li>
        </ul>
      </section>
    </div>
  );
}
