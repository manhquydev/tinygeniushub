import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { TryGardenClient } from "./try-garden-client";

/**
 * /try-garden - Public preview page.
 * Body delegates entirely to TryGardenClient (client component).
 * Only metadata is wired here.
 */
export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);
  return {
    title: translate("tryGarden.metadata.title", undefined, locale),
    description: translate("tryGarden.metadata.description", undefined, locale),
    keywords: ["check out the course", "early learning for children", "mental math for children", "English phonics", "TinyGenius Hub"],
    openGraph: {
      title: translate("tryGarden.metadata.ogTitle", undefined, locale),
      description: translate("tryGarden.metadata.ogDescription", undefined, locale),
      url: "https://www.tinygeniushubvn.tech/try-garden",
      siteName: "TinyGenius Hub",
      images: [
        {
          url: "/og-images/try-garden.png",
          width: 1200,
          height: 630,
          alt: translate("tryGarden.metadata.ogImageAlt", undefined, locale),
        },
      ],
      locale: "en_US",
      alternateLocale: ["vi_VN"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: translate("tryGarden.metadata.twitterTitle", undefined, locale),
      description: translate("tryGarden.metadata.twitterDescription", undefined, locale),
      images: ["/og-images/try-garden.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: "https://www.tinygeniushubvn.tech/try-garden",
    },
  };
}

export default function TryGardenPage() {
  return <TryGardenClient />;
}
