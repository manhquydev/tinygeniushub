import type { Metadata } from "next";
import Link from "next/link";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";
import { buildReferralUrl } from "@/modules/sharing/share-link-builder";
import { IconGift, IconUsers } from "@/components/icons";
import "./referral.css";

export const metadata: Metadata = {
  title: "Giới thiệu bạn bè",
  description: "Mời bạn bè tham gia TinyGenius Hub để cả hai cùng nhận ưu đãi cho khóa học.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/referral" },
};

const TIERS = [
  { referrals: 1, reward: "Phiếu ưu đãi 50.000đ" },
  { referrals: 3, reward: "Phiếu ưu đãi 200.000đ" },
  { referrals: 10, reward: "Tặng 1 khóa học miễn phí" },
] as const;

export default async function ReferralPublicPage() {
  const parent = await getParentFromServerCookie();
  const summary = parent ? await getReferralSummaryForParentReadOnly(parent.id) : null;

  const referralUrl = summary?.code ? buildReferralUrl(summary.code, "facebook", "referral_page") : null;

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Giới thiệu bạn bè, cả hai cùng nhận quà</h1>
        <p>
          Mỗi gia đình được mời sẽ nhận ưu đãi cho đơn đầu tiên. Bạn cũng nhận thưởng khi lượt giới thiệu hoàn tất
          thanh toán thành công.
        </p>
      </section>

      <section className="card-grid">
        <article className="card referral-reward-card">
          <IconGift size={28} className="referral-card-icon" />
          <h2>Bạn nhận được</h2>
          <p className="muted-text">Voucher thưởng theo số lượt giới thiệu hợp lệ.</p>
        </article>
        <article className="card referral-reward-card">
          <IconUsers size={28} className="referral-card-icon" />
          <h2>Bạn bè của bạn nhận được</h2>
          <p className="muted-text">Ưu đãi chào mừng cho lần mua khóa học đầu tiên.</p>
        </article>
      </section>

      <section className="card">
        <h2>Mức thưởng theo số lượt giới thiệu</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>Lượt giới thiệu thành công</th>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>Phần thưởng của bạn</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => (
              <tr key={tier.referrals}>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>{tier.referrals} gia đình</td>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>{tier.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {parent && summary ? (
        <section className="card">
          <h2>Liên kết giới thiệu của bạn</h2>
          {referralUrl ? (
            <>
              <p className="muted-text">Gửi liên kết này cho bạn bè:</p>
              <code
                style={{
                  display: "block",
                  padding: "12px",
                  background: "var(--color-surface-alt, #f5f5f5)",
                  borderRadius: "6px",
                  wordBreak: "break-all",
                  marginBottom: "16px",
                }}
              >
                {referralUrl}
              </code>
              <div className="hero-actions">
                <Link href="/parent/dashboard" className="solid-button">
                  Mở bảng điều khiển phụ huynh
                </Link>
              </div>
              <p className="muted-text" style={{ marginTop: "16px" }}>
                Đã giới thiệu: <strong>{summary.totalReferrals}</strong> gia đình &nbsp;·&nbsp; Đã thanh toán:{" "}
                <strong>{summary.paidReferrals}</strong>
                &nbsp;·&nbsp; Đã nhận thưởng: <strong>{summary.rewardedReferrals}</strong>
              </p>
            </>
          ) : (
            <p className="muted-text">Đang tạo mã giới thiệu...</p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>Bắt đầu ngay</h2>
          <p className="muted-text">Tạo tài khoản để nhận liên kết giới thiệu riêng của bạn.</p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="solid-button">
              Tạo tài khoản
            </Link>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Điều khoản ngắn gọn</h2>
        <ul className="referral-terms-list">
          <li>Phần thưởng chỉ áp dụng cho lượt giới thiệu hợp lệ theo chính sách chương trình.</li>
          <li>Tài khoản trùng lặp hoặc gian lận có thể bị từ chối ghi nhận.</li>
          <li>Điều khoản chương trình có thể được cập nhật để đảm bảo công bằng cho tất cả người dùng.</li>
        </ul>
      </section>
    </div>
  );
}
