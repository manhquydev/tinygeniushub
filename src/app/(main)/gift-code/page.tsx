import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { GiftCodeForm } from "@/components/gift-code-form";

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("giftCode.metadata.title", undefined, locale),
    description: translate("giftCode.metadata.description", undefined, locale),
  };
}

export default async function GiftCodePage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <div className="page-stack">
      <section className="card" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>
          {translate("giftCode.hero.title", undefined, locale)}
        </h1>
        <p className="muted-text">
          {translate("giftCode.hero.subtitle", undefined, locale)}
        </p>
        <GiftCodeForm />
      </section>
    </div>
  );
}
