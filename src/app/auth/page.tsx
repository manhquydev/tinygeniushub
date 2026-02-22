import Link from "next/link";

export default function AuthIndexPage() {
  return (
    <section className="card">
      <h1>Chọn cách vào hệ thống</h1>
      <p className="muted-text">Phụ huynh có thể đăng nhập nếu đã có tài khoản hoặc tạo trial mới 7 ngày.</p>
      <div className="hero-actions">
        <Link href="/auth/login" className="solid-button">Đăng nhập</Link>
        <Link href="/auth/signup" className="ghost-button">Tạo tài khoản trial</Link>
      </div>
    </section>
  );
}
