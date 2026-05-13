import type { Metadata } from "next";
import "@/components/homepage/cloud-garden-home.css";
import { CloudGardenHome } from "@/components/homepage/cloud-garden-home";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "TinyGenius Hub | Cloud Garden",
  },
  description:
    "Child-centered learning platform for children 2-6 years old. View sample lessons, choose the right course and start learning right away.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://www.tinygeniushubvn.tech",
  },
  openGraph: {
    title: "TinyGenius Hub | Cloud Garden",
    description: "View sample lessons, buy courses directly and track your child's progress through periodic reports.",
    url: "https://www.tinygeniushubvn.tech",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TinyGenius Hub - Cloud Garden",
      },
    ],
  },
  twitter: {
    title: "TinyGenius Hub | Cloud Garden",
    description: "Explore lessons, choose the right course and track clear progress with your child.",
    images: ["/opengraph-image"],
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TinyGenius Hub",
  url: "https://www.tinygeniushubvn.tech",
  inLanguage: "vi",
  description: "Interactive learning platform for children and parents.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.tinygeniushubvn.tech/courses?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TinyGenius Hub",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "vi",
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
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "TinyGenius Hub",
  url: "https://www.tinygeniushubvn.tech",
  logo: "https://www.tinygeniushubvn.tech/logo.png",
  description: "Early education platform for children aged 2-6 years old.",
  sameAs: ["https://www.facebook.com/tinygeniushub"],
  address: {
    "@type": "PostalAddress",
    addressCountry: "VN",
    addressLocality: "Hanoi",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@tinygeniushubvn.tech",
  },
};

const jsonLdCourse = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Cloud Garden - Math and English for children",
  description: "Interactive learning program for children 2-6 years old, with clear progress tracking for parents.",
  provider: {
    "@type": "Organization",
    name: "TinyGenius Hub",
    sameAs: "https://www.tinygeniushubvn.tech",
  },
  educationalLevel: "Preschool",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Children from 2-6 years old",
  },
  availableLanguage: "vi",
  isAccessibleForFree: false,
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT15M",
  },
};

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What ages is the platform suitable for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The program is designed for children 2-6 years old.",
      },
    },
    {
      "@type": "Question",
      name: "How do parents pay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parents can pay by bank transfer or QR following the instructions on the payment page.",
      },
    },
    {
      "@type": "Question",
      name: "When is the course active?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The course is activated automatically once the transaction is successfully confirmed.",
      },
    },
    {
      "@type": "Question",
      name: "Can I preview the lesson before buying?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Have. The system always displays sample lessons for parents to view before deciding to buy.",
      },
    },
  ],
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [jsonLdWebsite, jsonLdApp, jsonLdOrganization, jsonLdCourse, jsonLdFAQ],
  };

  return (
    <>
      <Link href="/try-garden" prefetch={true} style={{ display: "none" }} aria-hidden="true" />
      <Link href="/auth/signup" prefetch={true} style={{ display: "none" }} aria-hidden="true" />
      <Link href="/pricing" prefetch={true} style={{ display: "none" }} aria-hidden="true" />
      <Link href="/courses" prefetch={true} style={{ display: "none" }} aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CloudGardenHome />
    </>
  );
}
