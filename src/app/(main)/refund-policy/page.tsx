import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { LEGAL_POLICY_LAST_UPDATED_LABEL } from "@/lib/legal/legal-policy-version";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("refundPolicy.metadata.title", undefined, locale),
    description: translate("refundPolicy.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/refund-policy" },
  };
}

export default async function RefundPolicyPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <article className="prose-page">
      <h1>{translate("refundPolicy.h1", undefined, locale)}</h1>
      <p>{translate("refundPolicy.intro", undefined, locale)}</p>

      <h2>{translate("refundPolicy.s1.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s1.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s1.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("refundPolicy.s2.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s2.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s2.i2", undefined, locale)}</li>
        <li>{translate("refundPolicy.s2.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("refundPolicy.s3.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s3.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s3.i2", undefined, locale)}</li>
        <li>{translate("refundPolicy.s3.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("refundPolicy.s4.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s4.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s4.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("refundPolicy.s5.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s5.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s5.i2", undefined, locale)}</li>
      </ul>

      <h2>{translate("refundPolicy.s6.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s6.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s6.i2", undefined, locale)}</li>
        <li>{translate("refundPolicy.s6.i3", undefined, locale)}</li>
      </ul>

      <h2>{translate("refundPolicy.s7.heading", undefined, locale)}</h2>
      <ul>
        <li>{translate("refundPolicy.s7.i1", undefined, locale)}</li>
        <li>{translate("refundPolicy.s7.i2", undefined, locale)}</li>
        <li>{translate("refundPolicy.s7.i3", undefined, locale)}</li>
        <li>{translate("refundPolicy.s7.i4", undefined, locale)}</li>
      </ul>

      <p className="last-updated">
        {translate("refundPolicy.lastUpdated", undefined, locale)} {LEGAL_POLICY_LAST_UPDATED_LABEL}
      </p>
    </article>
  );
}
