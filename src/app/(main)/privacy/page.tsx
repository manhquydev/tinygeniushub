import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("privacy.metadata.title", undefined, locale),
    description: translate("privacy.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/privacy" },
  };
}

export default async function PrivacyPolicyPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <article className="prose-page">
      <h1>{translate("privacy.h1", undefined, locale)}</h1>
      <p>{translate("privacy.intro", undefined, locale)}</p>

      <h2>{translate("privacy.s1.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s1.i1", undefined, locale)}</li>
        <li>{translate("privacy.s1.i2", undefined, locale)}</li>
        <li>{translate("privacy.s1.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s2.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s2.i1", undefined, locale)}</li>
        <li>{translate("privacy.s2.i2", undefined, locale)}</li>
        <li>{translate("privacy.s2.i3", undefined, locale)}</li>
        <li>{translate("privacy.s2.i4", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s3.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s3.i1", undefined, locale)}</li>
        <li>{translate("privacy.s3.i2", undefined, locale)}</li>
        <li>{translate("privacy.s3.i3", undefined, locale)}</li>
        <li>{translate("privacy.s3.i4", undefined, locale)}</li>
        <li>{translate("privacy.s3.i5", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s4.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s4.i1", undefined, locale)}</li>
        <li>{translate("privacy.s4.i2", undefined, locale)}</li>
        <li>{translate("privacy.s4.i3", undefined, locale)}</li>
        <li>{translate("privacy.s4.i4", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s5.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s5.i1", undefined, locale)}</li>
        <li>{translate("privacy.s5.i2", undefined, locale)}</li>
        <li>{translate("privacy.s5.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s6.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s6.i1", undefined, locale)}</li>
        <li>{translate("privacy.s6.i2", undefined, locale)}</li>
        <li>{translate("privacy.s6.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s7.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s7.i1", undefined, locale)}</li>
        <li>{translate("privacy.s7.i2", undefined, locale)}</li>
        <li>{translate("privacy.s7.i3", undefined, locale)}</li>
        <li>{translate("privacy.s7.i4", undefined, locale)}</li>
      </ul>

      <h2>{translate("privacy.s8.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s8.i1", undefined, locale)}</li>
        <li>{translate("privacy.s8.i2", undefined, locale)}</li>
        <li>
          {translate("privacy.s8.i3prefix", undefined, locale)}
          <a href="/cookie-policy">{translate("privacy.s8.i3link", undefined, locale)}</a>.
        </li>
      </ul>

      <h2>{translate("privacy.s9.heading", undefined, locale)}</h2>
      <p>{translate("privacy.s9.body", undefined, locale)}</p>

      <h2>{translate("privacy.s10.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("privacy.s10.i1", undefined, locale)}</li>
        <li>{translate("privacy.s10.i2", undefined, locale)}</li>
      </ul>

      <p className="last-updated">
        {translate("privacy.lastUpdated", undefined, locale)} {LEGAL_POLICY_LAST_UPDATED_LABEL}
      </p>
    </article>
  );
}
