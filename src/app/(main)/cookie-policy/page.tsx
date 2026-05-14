import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { CookieConsentActions } from "@/components/legal/cookie-consent-actions";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("cookiePolicy.metadata.title", undefined, locale),
    description: translate("cookiePolicy.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/cookie-policy" },
  };
}

export default async function CookiePolicyPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <article className="prose-page">
      <h1>{translate("cookiePolicy.h1", undefined, locale)}</h1>
      <p>{translate("cookiePolicy.intro", undefined, locale)}</p>

      <h2>{translate("cookiePolicy.s1.heading", undefined, locale)}</h2>
      <p>{translate("cookiePolicy.s1.body", undefined, locale)}</p>

      <h2>{translate("cookiePolicy.s2.heading", undefined, locale)}</h2>
      <ul>
        <li>
          <strong>{translate("cookiePolicy.s2.necessaryLabel", undefined, locale)}</strong>{" "}
          {translate("cookiePolicy.s2.necessaryDesc", undefined, locale)}
        </li>
        <li>
          <strong>{translate("cookiePolicy.s2.analyticalLabel", undefined, locale)}</strong>{" "}
          {translate("cookiePolicy.s2.analyticalDesc", undefined, locale)}
        </li>
        <li>
          <strong>{translate("cookiePolicy.s2.marketingLabel", undefined, locale)}</strong>{" "}
          {translate("cookiePolicy.s2.marketingDesc", undefined, locale)}
        </li>
      </ul>

      <h2>{translate("cookiePolicy.s3.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("cookiePolicy.s3.i1", undefined, locale)}</li>
        <li>{translate("cookiePolicy.s3.i2", undefined, locale)}</li>
        <li>{translate("cookiePolicy.s3.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("cookiePolicy.s4.heading", undefined, locale)}</h2>
      <p>{translate("cookiePolicy.s4.body", undefined, locale)}</p>
      <CookieConsentActions className="not-prose mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" />

      <h2>{translate("cookiePolicy.s5.heading", undefined, locale)}</h2>
      <ul>
        <li>
          <code>ccth_session</code>, <code>ccth_reader_session</code>:{" "}
          {translate("cookiePolicy.s5.i1", undefined, locale)}
        </li>
        <li>
          <code>ccth_cookie_consent_v1</code>: {translate("cookiePolicy.s5.i2", undefined, locale)}
        </li>
        <li>
          <code>ab_pricing_v</code>, <code>ab_courses_v</code>, <code>ccth_attr_v1</code>:{" "}
          {translate("cookiePolicy.s5.i3", undefined, locale)}
        </li>
      </ul>
      <p>{translate("cookiePolicy.s5.duration", undefined, locale)}</p>

      <h2>{translate("cookiePolicy.s6.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("cookiePolicy.s6.i1", undefined, locale)}</li>
        <li>{translate("cookiePolicy.s6.i2", undefined, locale)}</li>
        <li>{translate("cookiePolicy.s6.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("cookiePolicy.s7.heading", undefined, locale)}</h2>
      <p>
        {translate("cookiePolicy.s7.body", undefined, locale)}{" "}
        <a href="mailto:privacy@tinygeniushubvn.tech">
          {translate("cookiePolicy.s7.email", undefined, locale)}
        </a>
        .
      </p>

      <p className="last-updated">
        {translate("cookiePolicy.lastUpdated", undefined, locale)} {LEGAL_POLICY_LAST_UPDATED_LABEL}
      </p>
    </article>
  );
}
