import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("about.metadata.title", undefined, locale),
    description: translate("about.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/about" },
  };
}

export default async function AboutPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <div>
      <section className="about-hero">
        <h1>{translate("about.hero.title", undefined, locale)}</h1>
        <p className="about-lead">{translate("about.hero.lead", undefined, locale)}</p>
      </section>

      <section className="about-mission">
        <article className="mission-card">
          <h2>{translate("about.mission.missionTitle", undefined, locale)}</h2>
          <p>{translate("about.mission.missionDesc", undefined, locale)}</p>
        </article>
        <article className="mission-card">
          <h2>{translate("about.mission.visionTitle", undefined, locale)}</h2>
          <p>{translate("about.mission.visionDesc", undefined, locale)}</p>
        </article>
      </section>

      <section className="about-why">
        <h2>{translate("about.why.title", undefined, locale)}</h2>
        <p>{translate("about.why.p1", undefined, locale)}</p>
        <p>{translate("about.why.p2", undefined, locale)}</p>
      </section>

      <section className="about-values">
        <h2>{translate("about.values.title", undefined, locale)}</h2>
        <div className="values-grid">
          <article>
            <h3>{translate("about.values.evidence.title", undefined, locale)}</h3>
            <p>{translate("about.values.evidence.desc", undefined, locale)}</p>
          </article>
          <article>
            <h3>{translate("about.values.childCentered.title", undefined, locale)}</h3>
            <p>{translate("about.values.childCentered.desc", undefined, locale)}</p>
          </article>
          <article>
            <h3>{translate("about.values.transparent.title", undefined, locale)}</h3>
            <p>{translate("about.values.transparent.desc", undefined, locale)}</p>
          </article>
        </div>
      </section>

      <section className="about-cta">
        <h2>{translate("about.cta.title", undefined, locale)}</h2>
        <p>{translate("about.cta.subtitle", undefined, locale)}</p>
        <Link href="/courses">{translate("about.cta.link", undefined, locale)}</Link>
      </section>
    </div>
  );
}
