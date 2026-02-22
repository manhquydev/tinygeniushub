import Link from "next/link";
import { CheckoutPlanButton } from "@/components/checkout-plan-button";
import { getParentFromServerCookie } from "@/lib/auth/session";

export default async function PricingPage() {
  const parent = await getParentFromServerCookie();

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Bảng giá rõ ràng cho phụ huynh Việt</h1>
        <p>
          Trial 7 ngày để tạo thói quen + weekly report có số liệu thật. Sau trial, chọn gói năm phù hợp để tiếp tục lộ trình.
        </p>
        <div className="hero-actions">
          {!parent ? (
            <Link href="/auth/signup" className="solid-button">
              Dùng thử 7 ngày
            </Link>
          ) : (
            <Link href="/parent/dashboard" className="solid-button">
              Quay về dashboard
            </Link>
          )}
          <Link href="/parent/reports" className="ghost-button">
            Xem mẫu báo cáo tuần
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Standard (Yearly)</h2>
          <p>
            <strong>3 hồ sơ bé · 2 caregiver</strong>
          </p>
          <ul>
            <li>English + Math full track</li>
            <li>Weekly report in-app + email</li>
            <li>Portfolio retention 90 ngày</li>
            <li>120,000 VND / năm</li>
          </ul>
          {parent ? (
            <CheckoutPlanButton planCode="YEARLY_STANDARD" label="Thanh toán Standard" />
          ) : (
            <Link href="/auth/signup" className="solid-button">
              Chọn Standard
            </Link>
          )}
        </article>

        <article className="card">
          <h2>Family+ (Yearly)</h2>
          <p>
            <strong>5 hồ sơ bé · 4 caregiver</strong>
          </p>
          <ul>
            <li>Toàn bộ quyền lợi Standard</li>
            <li>Portfolio retention đến 365 ngày (opt-in)</li>
            <li>Báo cáo gộp theo gia đình</li>
            <li>240,000 VND / năm</li>
          </ul>
          {parent ? (
            <CheckoutPlanButton planCode="YEARLY_FAMILY_PLUS" label="Thanh toán Family+" />
          ) : (
            <Link href="/auth/signup" className="solid-button">
              Chọn Family+
            </Link>
          )}
        </article>
      </section>

      <section className="card">
        <h2>FAQ billing nhanh</h2>
        <ul>
          <li>Trial không yêu cầu nhập thẻ khi bắt đầu.</li>
          <li>Hủy gói bất kỳ lúc nào, quyền lợi giữ đến hết kỳ.</li>
          <li>Hoàn tiền 7 ngày cho thanh toán đầu tiên (theo chính sách).</li>
        </ul>
      </section>
    </div>
  );
}
