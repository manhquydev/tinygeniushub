import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { getReferralSummaryForParentReadOnly } from "@/modules/referral/service";
import { buildReferralUrl } from "@/modules/sharing/share-link-builder";
import { IconGift, IconUsers } from "@/components/icons";
import "./referral.css";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("referral.metadata.title", undefined, locale),
    description: translate("referral.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/referral" },
  };
}

const TIERS = [
  { referrals: 1, rewardKey: "referral.tiers.tier1Reward" },
  { referrals: 3, rewardKey: "referral.tiers.tier2Reward" },
  { referrals: 10, rewardKey: "referral.tiers.tier3Reward" },
] as const;

export default async function ReferralPublicPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  const parent = await getParentFromServerCookie();
  const summary = parent ? await getReferralSummaryForParentReadOnly(parent.id) : null;

  const referralUrl = summary?.code ? buildReferralUrl(summary.code, "facebook", "referral_page") : null;

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{translate("referral.hero.title", undefined, locale)}</h1>
        <p>{translate("referral.hero.subtitle", undefined, locale)}</p>
      </section>

      <section className="card-grid">
        <article className="card referral-reward-card">
          <IconGift size={28} className="referral-card-icon" />
          <h2>{translate("referral.youReceive.title", undefined, locale)}</h2>
          <p className="muted-text">{translate("referral.youReceive.desc", undefined, locale)}</p>
        </article>
        <article className="card referral-reward-card">
          <IconUsers size={28} className="referral-card-icon" />
          <h2>{translate("referral.friendReceives.title", undefined, locale)}</h2>
          <p className="muted-text">{translate("referral.friendReceives.desc", undefined, locale)}</p>
        </article>
      </section>

      <section className="card">
        <h2>{translate("referral.tiers.sectionTitle", undefined, locale)}</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                {translate("referral.tiers.colReferrals", undefined, locale)}
              </th>
              <th style={{ textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                {translate("referral.tiers.colReward", undefined, locale)}
              </th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => (
              <tr key={tier.referrals}>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {translate("referral.tiers.familiesUnit", { count: tier.referrals }, locale)}
                </td>
                <td style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {translate(tier.rewardKey, undefined, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {parent && summary ? (
        <section className="card">
          <h2>{translate("referral.yourLink.title", undefined, locale)}</h2>
          {referralUrl ? (
            <>
              <p className="muted-text">{translate("referral.yourLink.sendHint", undefined, locale)}</p>
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
                  {translate("referral.yourLink.ctaDashboard", undefined, locale)}
                </Link>
              </div>
              <p className="muted-text" style={{ marginTop: "16px" }}>
                {translate("referral.yourLink.referred", undefined, locale)} <strong>{summary.totalReferrals}</strong>{" "}
                {translate("referral.yourLink.familiesUnit", undefined, locale)} &nbsp;·&nbsp;{" "}
                {translate("referral.yourLink.paid", undefined, locale)} <strong>{summary.paidReferrals}</strong>
                &nbsp;·&nbsp; {translate("referral.yourLink.rewarded", undefined, locale)}{" "}
                <strong>{summary.rewardedReferrals}</strong>
              </p>
            </>
          ) : (
            <p className="muted-text">{translate("referral.yourLink.generating", undefined, locale)}</p>
          )}
        </section>
      ) : (
        <section className="card">
          <h2>{translate("referral.getStarted.title", undefined, locale)}</h2>
          <p className="muted-text">{translate("referral.getStarted.desc", undefined, locale)}</p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="solid-button">
              {translate("referral.getStarted.cta", undefined, locale)}
            </Link>
          </div>
        </section>
      )}

      <section className="card">
        <h2>{translate("referral.terms.title", undefined, locale)}</h2>
        <ul className="referral-terms-list">
          <li>{translate("referral.terms.term1", undefined, locale)}</li>
          <li>{translate("referral.terms.term2", undefined, locale)}</li>
          <li>{translate("referral.terms.term3", undefined, locale)}</li>
        </ul>
      </section>
    </div>
  );
}
