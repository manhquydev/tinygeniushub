import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("terms.metadata.title", undefined, locale),
    description: translate("terms.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/terms" },
  };
}

export default async function TermsOfServicePage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <article className="prose-page">
      <h1>{translate("terms.h1", undefined, locale)}</h1>
      <p>{translate("terms.intro", undefined, locale)}</p>

      <h2>{translate("terms.s1.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s1.i1", undefined, locale)}</li>
        <li>{translate("terms.s1.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s2.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s2.i1", undefined, locale)}</li>
        <li>{translate("terms.s2.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s3.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s3.i1", undefined, locale)}</li>
        <li>{translate("terms.s3.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s4.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s4.i1", undefined, locale)}</li>
        <li>{translate("terms.s4.i2", undefined, locale)}</li>
        <li>{translate("terms.s4.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s5.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s5.i1", undefined, locale)}</li>
        <li>
          {translate("terms.s5.i2prefix", undefined, locale)}
          <a href="/refund-policy">{translate("terms.s5.i2link", undefined, locale)}</a>.
        </li>
      </ul>

      <h2>{translate("terms.s6.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s6.i1", undefined, locale)}</li>
        <li>{translate("terms.s6.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s7.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s7.i1", undefined, locale)}</li>
        <li>{translate("terms.s7.i2", undefined, locale)}</li>
        <li>{translate("terms.s7.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s8.heading", undefined, locale)}</h2>
      <ul>
        <li>
          {translate("terms.s8.i1prefix", undefined, locale)}
          <a href="/privacy">{translate("terms.s8.i1link", undefined, locale)}</a>.
        </li>
        <li>
          {translate("terms.s8.i2prefix", undefined, locale)}
          <a href="/cookie-policy">{translate("terms.s8.i2link", undefined, locale)}</a>.
        </li>
      </ul>

      <h2>{translate("terms.s9.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s9.i1", undefined, locale)}</li>
        <li>{translate("terms.s9.i2", undefined, locale)}</li>
        <li>{translate("terms.s9.i3", undefined, locale)}</li>
        <li>{translate("terms.s9.i4", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s10.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s10.i1", undefined, locale)}</li>
        <li>{translate("terms.s10.i2", undefined, locale)}</li>
        <li>{translate("terms.s10.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("terms.s11.heading", undefined, locale)}</h2>
      <p>{translate("terms.s11.body", undefined, locale)}</p>

      <h2>{translate("terms.s12.heading", undefined, locale)}</h2>
      <p>{translate("terms.s12.body", undefined, locale)}</p>

      <h2>{translate("terms.s13.heading", undefined, locale)}</h2>
      <p>{translate("terms.s13.email", undefined, locale)}</p>

      <h2>{translate("terms.s14.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("terms.s14.i1", undefined, locale)}</li>
        <li>{translate("terms.s14.i2", undefined, locale)}</li>
        <li>{translate("terms.s14.i3", undefined, locale)}</li>
        <li>{translate("terms.s14.i4", undefined, locale)}</li>
        <li>{translate("terms.s14.i5", undefined, locale)}</li>
      </ul>

      <p className="last-updated">
        {translate("terms.lastUpdated", undefined, locale)} {LEGAL_POLICY_LAST_UPDATED_LABEL}
      </p>
    </article>
  );
}
