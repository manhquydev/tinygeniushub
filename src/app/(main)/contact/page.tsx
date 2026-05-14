import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MapPin } from "lucide-react";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { ContactForm } from "@/components/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("contact.metadata.title", undefined, locale),
    description: translate("contact.metadata.description", undefined, locale),
    alternates: { canonical: "https://www.tinygeniushubvn.tech/contact" },
  };
}

export default async function ContactPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <div className="contact-page">
      <header className="contact-header">
        <h1>{translate("contact.hero.title", undefined, locale)}</h1>
        <p className="muted-text">{translate("contact.hero.subtitle", undefined, locale)}</p>
      </header>

      <section className="contact-grid">
        <aside className="contact-info-card">
          <div className="contact-info-item">
            <Mail size={18} aria-hidden />
            <div>
              <strong>{translate("contact.info.emailLabel", undefined, locale)}</strong>
              <p>support@tinygeniushubvn.tech</p>
            </div>
          </div>

          <div className="contact-info-item">
            <Clock3 size={18} aria-hidden />
            <div>
              <strong>{translate("contact.info.responseLabel", undefined, locale)}</strong>
              <p>{translate("contact.info.responseValue", undefined, locale)}</p>
            </div>
          </div>

          <div className="contact-info-item">
            <MapPin size={18} aria-hidden />
            <div>
              <strong>{translate("contact.info.addressLabel", undefined, locale)}</strong>
              <p>{translate("contact.info.addressValue", undefined, locale)}</p>
            </div>
          </div>

          <p className="muted-text">
            {translate("contact.info.faqHint", undefined, locale)}{" "}
            <Link href="/#faq" className="hp-more-link">
              /#faq
            </Link>
            .
          </p>
        </aside>

        <ContactForm />
      </section>
    </div>
  );
}
