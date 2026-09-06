import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "@/components/homepage/cloud-garden-home.css";
import { CloudGardenHome } from "@/components/homepage/cloud-garden-home";
import Link from "next/link";
import { translate } from "@/i18n/translator";
import { resolveAppLocale, type AppLocale } from "@/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveAppLocale(await getLocale());
  const title = translate("metadata.homeTitle", undefined, locale);
  const description = translate("metadata.homeDescription", undefined, locale);
  return {
    title: { absolute: title },
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: "https://www.tinygeniushubvn.tech",
    },
    openGraph: {
      title,
      description: translate("metadata.homeOgDescription", undefined, locale),
      url: "https://www.tinygeniushubvn.tech",
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      alternateLocale: locale === "vi" ? ["en_US"] : ["vi_VN"],
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: translate("metadata.homeImageAlt", undefined, locale),
        },
      ],
    },
    twitter: {
      title,
      description: translate("metadata.homeTwitterDescription", undefined, locale),
      images: ["/opengraph-image"],
    },
  };
}

function jsonLdCopy(locale: AppLocale, key: string) {
  return translate(`metadata.jsonLd.${key}`, undefined, locale);
}

function buildHomeJsonLd(locale: AppLocale) {
  const inLanguage = locale;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "TinyGenius Hub",
        url: "https://www.tinygeniushubvn.tech",
        inLanguage,
        description: jsonLdCopy(locale, "websiteDescription"),
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://www.tinygeniushubvn.tech/courses?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "TinyGenius Hub",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        inLanguage,
        url: "https://www.tinygeniushubvn.tech",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "1250",
        },
        author: {
          "@type": "Organization",
          name: "TinyGenius Hub",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "TinyGenius Hub",
        url: "https://www.tinygeniushubvn.tech",
        logo: "https://www.tinygeniushubvn.tech/logo.png",
        description: jsonLdCopy(locale, "orgDescription"),
        sameAs: ["https://www.facebook.com/tinygeniushub"],
        address: {
          "@type": "PostalAddress",
          addressCountry: "VN",
          addressLocality: "Hanoi",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: jsonLdCopy(locale, "contactType"),
          email: "support@tinygeniushubvn.tech",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Course",
        name: jsonLdCopy(locale, "courseName"),
        description: jsonLdCopy(locale, "courseDescription"),
        provider: {
          "@type": "Organization",
          name: "TinyGenius Hub",
          sameAs: "https://www.tinygeniushubvn.tech",
        },
        educationalLevel: jsonLdCopy(locale, "educationalLevel"),
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "student",
          audienceType: jsonLdCopy(locale, "audienceType"),
        },
        availableLanguage: ["en", "vi"],
        isAccessibleForFree: false,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT15M",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage,
        mainEntity: [
          {
            "@type": "Question",
            name: jsonLdCopy(locale, "faq1q"),
            acceptedAnswer: { "@type": "Answer", text: jsonLdCopy(locale, "faq1a") },
          },
          {
            "@type": "Question",
            name: jsonLdCopy(locale, "faq2q"),
            acceptedAnswer: { "@type": "Answer", text: jsonLdCopy(locale, "faq2a") },
          },
          {
            "@type": "Question",
            name: jsonLdCopy(locale, "faq3q"),
            acceptedAnswer: { "@type": "Answer", text: jsonLdCopy(locale, "faq3a") },
          },
          {
            "@type": "Question",
            name: jsonLdCopy(locale, "faq4q"),
            acceptedAnswer: { "@type": "Answer", text: jsonLdCopy(locale, "faq4a") },
          },
        ],
      },
    ],
  };
}

export default async function HomePage() {
  const locale = resolveAppLocale(await getLocale());
  const jsonLd = buildHomeJsonLd(locale);

  return (
    <>
      <Link href="/try-garden" prefetch={true} style={{ display: "none" }} aria-hidden="true" />
      <Link href="/auth/signup" prefetch={true} style={{ display: "none" }} aria-hidden="true" />
      <Link href="/courses" prefetch={true} style={{ display: "none" }} aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CloudGardenHome />
    </>
  );
}
