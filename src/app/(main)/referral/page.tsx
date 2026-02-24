import type { Metadata } from "next";
import Link from "next/link";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";
import { buildReferralUrl } from "@/modules/sharing/share-link-builder";
import { IconGift, IconUsers } from "@/components/icons";
import "./referral.css";

export const metadata: Metadata = {
  title: "Giới thiệu bạn bè",
  description:
    "Giới thiệu bạn bè dùng Cùng Con Tự Học — cả hai cùng nhận 7 ngày học miễn phí.",
  alternates: { canonical: "https://cungcontuhoc.vn/referral" },
};

const TIERS = [
  { referrals: 1, reward: "7 ngày Premium miễn phí" },
  { referrals: 3, reward: "1 tháng Premium miễn phí" },
  { referrals: 10, reward: "1 năm Premium miễn phí" },
] as const;

export default async function ReferralPublicPage() {
  const parent = await getParentFromServerCookie();
  const summary = parent
    ? await getReferralSummaryForParentReadOnly(parent.id)
    : null;

  const referralUrl = summary?.code
    ? buildReferralUrl(summary.code, "facebook", "referral_page")
    : null;

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Chia sẻ — cả hai cùng được</h1>
        <p>
          Mỗi gia đình bạn giới thiệu sẽ nhận <strong>7 ngày học miễn phí</strong>. Bạn
          cũng nhận thêm <strong>7 ngày Premium</strong> khi họ đăng ký thành công.
        </p>
      </section>

      {/* Dual-sided reward highlight */}
      <section className="card-grid">
        <article className="card referral-reward-card">
          <IconGift size={28} className="referral-card-icon" />
          <h2>Bạn nhận</h2>
          <p className="muted-text">+7 ngày Premium mỗi lần giới thiệu thành công.</p>
        </article>
        <article className="card referral-reward-card">
          <IconUsers size={28} className="referral-card-icon" />
          <h2>Bạn bè nhận</h2>
          <p className="muted-text">7 ngày dùng thử miễn phí — không cần thẻ tín dụng.</p>
        </article>
      </section>

      {/* Referral tiers */}
      <section className="card">
        <h2>Phần thưởng lũy tiến</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>Số lần giới thiệu thành công</th>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>Phần thưởng bạn nhận</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => (
              <tr key={tier.referrals}>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {tier.referrals} gia đình
                </td>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {tier.reward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Logged-in: show referral link + stats */}
      {parent && summary ? (
        <section className="card">
          <h2>Liên kết của bạn</h2>
          {referralUrl ? (
            <>
              <p className="muted-text">Chia sẻ link này với bạn bè:</p>
              <code style={{ display: "block", padding: "12px", background: "var(--color-surface-alt, #f5f5f5)", borderRadius: "6px", wordBreak: "break-all", marginBottom: "16px" }}>
                {referralUrl}
              </code>
              <div className="hero-actions">
                <Link href="/parent/dashboard" className="solid-button">
                  Xem dashboard phụ huynh
                </Link>
              </div>
              <p className="muted-text" style={{ marginTop: "16px" }}>
                Đã giới thiệu: <strong>{summary.totalReferrals}</strong> gia đình &nbsp;·&nbsp;
                Đã thanh toán: <strong>{summary.paidReferrals}</strong> &nbsp;·&nbsp;
                Phần thưởng đã nhận: <strong>{summary.rewardedReferrals}</strong> lần
              </p>
            </>
          ) : (
            <p className="muted-text">Đang tạo mã giới thiệu cho bạn...</p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>Bắt đầu ngay</h2>
          <p className="muted-text">
            Đăng ký tài khoản để nhận mã giới thiệu của riêng bạn.
          </p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="solid-button">
              Đăng ký miễn phí
            </Link>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Điều khoản ngắn gọn</h2>
        <ul className="referral-terms-list">
          <li>Phần thưởng chỉ áp dụng cho lượt giới thiệu hợp lệ theo chính sách chương trình.</li>
          <li>Cùng Con Tự Học có quyền từ chối các trường hợp gian lận hoặc trùng lặp.</li>
          <li>Điều khoản chi tiết có thể được cập nhật để đảm bảo công bằng cho cộng đồng.</li>
        </ul>
      </section>
    </div>
  );
}
