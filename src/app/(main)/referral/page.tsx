import type { Metadata } from "next";
import Link from "next/link";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";
import { buildReferralUrl } from "@/modules/sharing/share-link-builder";
import { IconGift, IconUsers } from "@/components/icons";
import "./referral.css";

export const metadata: Metadata = {
  title: "Refer friends",
  description: "Invite friends to join TinyGenius Hub so you can both receive discounts on the course.",
  alternates: { canonical: "https://www.tinygeniushubvn.tech/referral" },
};

const TIERS = [
  { referrals: 1, reward: "Discount voucher 50,000 VND" },
  { referrals: 3, reward: "Discount voucher 200,000 VND" },
  { referrals: 10, reward: "Give away 1 free course" },
] as const;

export default async function ReferralPublicPage() {
  const parent = await getParentFromServerCookie();
  const summary = parent ? await getReferralSummaryForParentReadOnly(parent.id) : null;

  const referralUrl = summary?.code ? buildReferralUrl(summary.code, "facebook", "referral_page") : null;

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Introduce friends, both receive gifts</h1>
        <p>
          Each invited family will receive a discount for their first application. You also receive a reward when the referral is completed
          payment successful.
        </p>
      </section>

      <section className="card-grid">
        <article className="card referral-reward-card">
          <IconGift size={28} className="referral-card-icon" />
          <h2>You receive</h2>
          <p className="muted-text">Voucher rewards based on number of valid referrals.</p>
        </article>
        <article className="card referral-reward-card">
          <IconUsers size={28} className="referral-card-icon" />
          <h2>Your friends receive</h2>
          <p className="muted-text">Welcome offer for first course purchase.</p>
        </article>
      </section>

      <section className="card">
        <h2>Bonus level based on number of referrals</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>Successful referrals</th>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>Your reward</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => (
              <tr key={tier.referrals}>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>{tier.referrals} families</td>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>{tier.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {parent && summary ? (
        <section className="card">
          <h2>Your referral link</h2>
          {referralUrl ? (
            <>
              <p className="muted-text">Send this link to your friends:</p>
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
                  Open the parent dashboard
                </Link>
              </div>
              <p className="muted-text" style={{ marginTop: "16px" }}>
                Referred: <strong>{summary.totalReferrals}</strong> families &nbsp;·&nbsp; Paid:{" "}
                <strong>{summary.paidReferrals}</strong>
                &nbsp;·&nbsp; Rewarded: <strong>{summary.rewardedReferrals}</strong>
              </p>
            </>
          ) : (
            <p className="muted-text">Generating referral code...</p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>Get started now</h2>
          <p className="muted-text">Create an account to receive your own referral link.</p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="solid-button">
              Create an account
            </Link>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Short terms</h2>
        <ul className="referral-terms-list">
          <li>Rewards are only applicable to valid referrals according to program policies.</li>
          <li>Duplicate or fraudulent accounts may be denied credit.</li>
          <li>Program terms may be updated to ensure fairness for all users.</li>
        </ul>
      </section>
    </div>
  );
}
