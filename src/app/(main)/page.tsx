import type { Metadata } from "next";
import "@/components/homepage/cloud-garden-home.css";
import { CloudGardenHome } from "@/components/homepage/cloud-garden-home";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Cùng Con Tự Học | Khu Vườn Trên Mây",
  },
  description:
    "Nền tảng học tập lấy trẻ làm trung tâm cho bé 2-6 tuổi. Xem bài học mẫu, chọn khóa phù hợp và bắt đầu học ngay.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://cungcontuhoc.io.vn",
  },
  openGraph: {
    title: "Cùng Con Tự Học | Khu Vườn Trên Mây",
    description: "Xem bài học mẫu, mua khóa trực tiếp và theo dõi tiến bộ của bé qua báo cáo định kỳ.",
    url: "https://cungcontuhoc.io.vn",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cùng Con Tự Học - Khu Vườn Trên Mây",
      },
    ],
  },
  twitter: {
    title: "Cùng Con Tự Học | Khu Vườn Trên Mây",
    description: "Khám phá bài học, chọn đúng khóa và theo dõi tiến bộ rõ ràng cùng bé.",
    images: ["/opengraph-image"],
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cùng Con Tự Học",
  url: "https://cungcontuhoc.io.vn",
  inLanguage: "vi",
  description: "Nền tảng học tập tương tác cho trẻ nhỏ và phụ huynh.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://cungcontuhoc.io.vn/courses?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cùng Con Tự Học",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "vi",
  url: "https://cungcontuhoc.io.vn",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1250",
  },
  author: {
    "@type": "Organization",
    name: "Cùng Con Tự Học",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Cùng Con Tự Học",
  url: "https://cungcontuhoc.io.vn",
  logo: "https://cungcontuhoc.io.vn/logo.png",
  description: "Nền tảng giáo dục sớm dành cho trẻ từ 2-6 tuổi.",
  sameAs: ["https://www.facebook.com/cungcontuhoc", "https://zalo.me/cungcontuhoc"],
  address: {
    "@type": "PostalAddress",
    addressCountry: "VN",
    addressLocality: "Hà Nội",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@cungcontuhoc.io.vn",
  },
};

const jsonLdCourse = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Khu Vườn Trên Mây - Toán tư duy và Tiếng Anh cho bé",
  description: "Chương trình học tương tác cho trẻ 2-6 tuổi, có theo dõi tiến bộ rõ ràng cho phụ huynh.",
  provider: {
    "@type": "Organization",
    name: "Cùng Con Tự Học",
    sameAs: "https://cungcontuhoc.io.vn",
  },
  educationalLevel: "Mầm non",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Trẻ từ 2-6 tuổi",
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
      name: "Nền tảng phù hợp với độ tuổi nào?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chương trình được thiết kế cho trẻ từ 2-6 tuổi.",
      },
    },
    {
      "@type": "Question",
      name: "Phụ huynh thanh toán như thế nào?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Phụ huynh có thể thanh toán bằng chuyển khoản hoặc QR theo hướng dẫn trên trang thanh toán.",
      },
    },
    {
      "@type": "Question",
      name: "Khi nào khóa học được kích hoạt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Khóa học được kích hoạt tự động sau khi giao dịch được xác nhận thành công.",
      },
    },
    {
      "@type": "Question",
      name: "Có thể xem thử bài học trước khi mua không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Có. Hệ thống luôn hiển thị bài học mẫu để phụ huynh xem trước khi quyết định mua.",
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
