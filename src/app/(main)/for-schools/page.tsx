import "./for-schools.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("forSchools.metadata.title", undefined, locale),
    description: translate("forSchools.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/for-schools" },
    openGraph: {
      title: translate("forSchools.metadata.ogTitle", undefined, locale),
      description: translate("forSchools.metadata.ogDescription", undefined, locale),
      url: "https://www.tinygeniushubvn.tech/for-schools",
      type: "website",
    },
  };
}

export default async function ForSchoolsPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  const BENEFITS = [
    {
      icon: "📱",
      title: translate("forSchools.benefits.b1Title", undefined, locale),
      desc: translate("forSchools.benefits.b1Desc", undefined, locale),
    },
    {
      icon: "📊",
      title: translate("forSchools.benefits.b2Title", undefined, locale),
      desc: translate("forSchools.benefits.b2Desc", undefined, locale),
    },
    {
      icon: "⚡",
      title: translate("forSchools.benefits.b3Title", undefined, locale),
      desc: translate("forSchools.benefits.b3Desc", undefined, locale),
    },
  ];

  const PLANS = [
    {
      name: translate("forSchools.plans.p1Name", undefined, locale),
      price: translate("forSchools.plans.contactPrice", undefined, locale),
      desc: translate("forSchools.plans.p1Desc", undefined, locale),
      highlight: false,
    },
    {
      name: translate("forSchools.plans.p2Name", undefined, locale),
      price: translate("forSchools.plans.contactPrice", undefined, locale),
      desc: translate("forSchools.plans.p2Desc", undefined, locale),
      highlight: true,
    },
    {
      name: translate("forSchools.plans.p3Name", undefined, locale),
      price: translate("forSchools.plans.contactPrice", undefined, locale),
      desc: translate("forSchools.plans.p3Desc", undefined, locale),
      highlight: false,
    },
  ];

  return (
    <div className="page-stack">
      <section className="schools-hero">
        <div className="schools-hero-inner">
          <div className="schools-hero-badge">{translate("forSchools.hero.badge", undefined, locale)}</div>
          <h1 className="schools-hero-title">
            {translate("forSchools.hero.title", undefined, locale)}<br />
            <span className="schools-hero-accent">{translate("forSchools.hero.titleAccent", undefined, locale)}</span>
          </h1>
          <p className="schools-hero-sub">
            {translate("forSchools.hero.subtitle", undefined, locale)}
          </p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button schools-hero-cta">
            {translate("forSchools.hero.cta", undefined, locale)}
          </Link>
        </div>
      </section>

      <section className="container">
        <h2 className="schools-section-title">{translate("forSchools.benefits.sectionTitle", undefined, locale)}</h2>
        <div className="card-grid">
          {BENEFITS.map((b) => (
            <article key={b.title} className="card schools-benefit-card">
              <span className="schools-benefit-icon" aria-hidden="true">
                {b.icon}
              </span>
              <h3 className="schools-benefit-title">{b.title}</h3>
              <p className="schools-benefit-desc">{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container">
        <h2 className="schools-section-title">{translate("forSchools.plans.sectionTitle", undefined, locale)}</h2>
        <div className="card-grid">
          {PLANS.map((p) => (
            <article key={p.name} className={`card schools-plan-card ${p.highlight ? "schools-plan-highlight" : ""}`}>
              <div className="schools-plan-name">{p.name}</div>
              <div className="schools-plan-price">{p.price}</div>
              <p className="schools-plan-desc">{p.desc}</p>
              <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="ghost-button schools-plan-cta">
                {translate("forSchools.plans.planCta", undefined, locale)}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="schools-demo-cta container">
        <div className="page-card schools-demo-inner">
          <h2>{translate("forSchools.demoCta.title", undefined, locale)}</h2>
          <p>{translate("forSchools.demoCta.subtitle", undefined, locale)}</p>
          <Link href="/contact?subject=H%E1%BB%A3p+t%C3%A1c+%2F+B2B" className="solid-button">
            {translate("forSchools.demoCta.cta", undefined, locale)}
          </Link>
        </div>
      </section>
    </div>
  );
}
