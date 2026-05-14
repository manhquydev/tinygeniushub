import "./pricing.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { IconCheckCircle, IconInfo } from "@/components/icons";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("pricing.metadata.title", undefined, locale),
    description: translate("pricing.metadata.description", undefined, locale),
    alternates: {
      canonical: "https://www.tinygeniushubvn.tech/pricing",
    },
    openGraph: {
      title: translate("pricing.metadata.ogTitle", undefined, locale),
      description: translate("pricing.metadata.ogDescription", undefined, locale),
      url: "https://www.tinygeniushubvn.tech/pricing",
      type: "website",
    },
  };
}

export default async function PricingPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  const FAQ_ITEMS = [
    {
      q: translate("pricing.faq.q1", undefined, locale),
      a: translate("pricing.faq.a1", undefined, locale),
    },
    {
      q: translate("pricing.faq.q2", undefined, locale),
      a: translate("pricing.faq.a2", undefined, locale),
    },
    {
      q: translate("pricing.faq.q3", undefined, locale),
      a: translate("pricing.faq.a3", undefined, locale),
    },
    {
      q: translate("pricing.faq.q4", undefined, locale),
      a: translate("pricing.faq.a4", undefined, locale),
    },
  ];

  const CONVERSION_POINTS = [
    {
      title: translate("pricing.conversion.point1Title", undefined, locale),
      description: translate("pricing.conversion.point1Desc", undefined, locale),
    },
    {
      title: translate("pricing.conversion.point2Title", undefined, locale),
      description: translate("pricing.conversion.point2Desc", undefined, locale),
    },
    {
      title: translate("pricing.conversion.point3Title", undefined, locale),
      description: translate("pricing.conversion.point3Desc", undefined, locale),
    },
  ];

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{translate("pricing.hero.title", undefined, locale)}</h1>
        <p>{translate("pricing.hero.subtitle", undefined, locale)}</p>
        <div className="hero-actions">
          <Link href="/courses" className="solid-button">
            {translate("pricing.hero.ctaCourseList", undefined, locale)}
          </Link>
          <Link href="/courses" className="ghost-button">
            {translate("pricing.hero.ctaSampleLesson", undefined, locale)}
          </Link>
        </div>
        <p className="pricing-hero-proof">{translate("pricing.hero.proof", undefined, locale)}</p>
      </section>

      <section className="card pricing-conversion">
        <h2>{translate("pricing.conversion.sectionTitle", undefined, locale)}</h2>
        <div className="pricing-conversion-grid">
          {CONVERSION_POINTS.map((point) => (
            <article key={point.title} className="pricing-conversion-item">
              <h3>{point.title}</h3>
              <p className="muted-text">{point.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card pricing-social-proof">
        <p className="muted-text pricing-trust-row">
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> {translate("pricing.trust.fastCheckout", undefined, locale)}
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> {translate("pricing.trust.refund30", undefined, locale)}
          </span>
          <span className="pricing-trust-sep">·</span>
          <span className="pricing-trust-item">
            <IconCheckCircle size={15} /> {translate("pricing.trust.autoActivation", undefined, locale)}
          </span>
        </p>
      </section>

      <section className="card">
        <div style={{ display: "grid", gap: "0.4rem" }}>
          <h2>{translate("pricing.coursesOpen.sectionTitle", undefined, locale)}</h2>
          <p className="muted-text">{translate("pricing.coursesOpen.subtitle", undefined, locale)}</p>
          <p className="pricing-card__tip muted-text">
            <IconInfo size={14} className="pricing-tip-icon" />
            {translate("pricing.coursesOpen.tip", undefined, locale)}
          </p>
        </div>
        <div style={{ marginTop: "0.8rem" }}>
          <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
            {translate("pricing.coursesOpen.cta", undefined, locale)}
          </Link>
        </div>
      </section>

      <section className="card">
        <h2>{translate("pricing.faq.sectionTitle", undefined, locale)}</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={idx} className="faq-item">
              <summary className="faq-question">{item.q}</summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card pricing-final-cta">
        <h2>{translate("pricing.finalCta.title", undefined, locale)}</h2>
        <p className="muted-text">{translate("pricing.finalCta.subtitle", undefined, locale)}</p>
        <div className="pricing-final-cta__actions">
          <Link href="/courses" className="solid-button">
            {translate("pricing.finalCta.ctaCourse", undefined, locale)}
          </Link>
          <Link href="/blog" className="ghost-button">
            {translate("pricing.finalCta.ctaBlog", undefined, locale)}
          </Link>
        </div>
      </section>
    </div>
  );
}
