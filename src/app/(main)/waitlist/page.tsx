import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Đăng ký trước — Cùng Con Tự Học",
  description:
    "Đăng ký trước để nhận thông báo khi Cùng Con Tự Học ra mắt và ưu đãi dành riêng cho 50 gia đình đầu tiên.",
  alternates: { canonical: "https://cungcontuhoc.vn/waitlist" },
  robots: { index: false, follow: false }, // noindex until launch
};

export default function WaitlistPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Tham gia danh sách chờ</h1>
        <p>
          Chúng tôi đang tìm <strong>50 gia đình đầu tiên</strong> để thử nghiệm miễn phí và định hình
          sản phẩm. Đăng ký để nhận ưu đãi ra mắt sớm nhất.
        </p>
      </section>

      <section className="card">
        <h2>Đăng ký nhận thông báo</h2>
        <form id="waitlist-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="wl-email" style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Email của bạn
            </label>
            <input
              id="wl-email"
              type="email"
              name="email"
              required
              placeholder="example@gmail.com"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border, #ddd)", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label htmlFor="wl-age" style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Bé nhà bạn bao nhiêu tuổi? <span style={{ fontWeight: 400, color: "var(--color-muted, #888)" }}>(không bắt buộc)</span>
            </label>
            <select
              id="wl-age"
              name="childAge"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--color-border, #ddd)", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box" }}
            >
              <option value="">Chọn độ tuổi</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((age) => (
                <option key={age} value={age}>{age} tuổi</option>
              ))}
            </select>
          </div>
          <button type="submit" className="solid-button">
            Đăng ký nhận thông báo
          </button>
          <p className="muted-text" style={{ fontSize: "0.875rem" }}>
            Không spam. Chỉ thông báo khi ra mắt và ưu đãi cho người đăng ký sớm.
          </p>
        </form>

        {/* Client-side form submission */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
document.getElementById('waitlist-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type=submit]');
  const email = this.email.value;
  const childAge = this.childAge.value || undefined;
  btn.disabled = true;
  btn.textContent = 'Đang gửi...';
  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, childAge: childAge ? Number(childAge) : undefined })
    });
    if (res.ok) {
      this.innerHTML = '<p style="color:var(--color-success,#16a34a);font-weight:600">✅ Đăng ký thành công! Chúng tôi sẽ liên hệ sớm nhất.</p>';
    } else {
      btn.disabled = false;
      btn.textContent = 'Đăng ký nhận thông báo';
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  } catch {
    btn.disabled = false;
    btn.textContent = 'Đăng ký nhận thông báo';
  }
});
            `,
          }}
        />
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Ưu đãi beta</h2>
          <p className="muted-text">50 gia đình đầu tiên nhận 1 tháng Premium miễn phí và không giới hạn feedback trực tiếp với team.</p>
        </article>
        <article className="card">
          <h2>Ra mắt khi nào?</h2>
          <p className="muted-text">Dự kiến tháng 3/2026. Beta families được dùng ngay từ tuần tới.</p>
        </article>
      </section>

      <section style={{ textAlign: "center", padding: "16px 0" }}>
        <p className="muted-text">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" style={{ color: "var(--color-accent)" }}>
            Đăng nhập tại đây
          </Link>
        </p>
      </section>
    </div>
  );
}
