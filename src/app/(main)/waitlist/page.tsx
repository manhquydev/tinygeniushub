import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { WaitlistForm } from "./waitlist-form";
import { IconCalendar, IconStar } from "@/components/icons";
import "./waitlist.css";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("waitlist.metadata.title", undefined, locale),
    description: translate("waitlist.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/waitlist" },
    robots: { index: false, follow: false },
  };
}

export default async function WaitlistPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{translate("waitlist.hero.title", undefined, locale)}</h1>
        <p>
          {translate("waitlist.hero.subtitle", { count: translate("waitlist.hero.countLabel", undefined, locale) }, locale)}
        </p>
      </section>

      <section className="card">
        <h2>{translate("waitlist.form.sectionTitle", undefined, locale)}</h2>
        <WaitlistForm />
      </section>

      <section className="card-grid">
        <article className="card waitlist-info-card">
          <IconStar size={28} className="waitlist-card-icon" />
          <h2>{translate("waitlist.earlyBenefits.title", undefined, locale)}</h2>
          <p className="muted-text">{translate("waitlist.earlyBenefits.desc", undefined, locale)}</p>
        </article>
        <article className="card waitlist-info-card">
          <IconCalendar size={28} className="waitlist-card-icon" />
          <h2>{translate("waitlist.timing.title", undefined, locale)}</h2>
          <p className="muted-text">{translate("waitlist.timing.desc", undefined, locale)}</p>
        </article>
      </section>

      <section style={{ textAlign: "center", padding: "16px 0" }}>
        <p className="muted-text">
          {translate("waitlist.alreadyAccount.text", undefined, locale)}{" "}
          <Link href="/auth/login" style={{ color: "var(--color-accent)" }}>
            {translate("waitlist.alreadyAccount.link", undefined, locale)}
          </Link>
        </p>
      </section>
    </div>
  );
}
