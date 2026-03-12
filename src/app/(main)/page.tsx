import type { Metadata } from "next";
import "@/components/homepage/cloud-garden-home.css";
import { CloudGardenHome } from "@/components/homepage/cloud-garden-home";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Cùng Con Tự Học | Khu Vườn Trên Mây",
  },
  description:
    "Trang chủ mới theo concept Khu Vườn Trên Mây: gieo cây theo khóa học, mở tầng theo tiến độ, vào học ngay từ hành trình của bé.",
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
    description:
      "Một trải nghiệm marketing và học tập trực quan cho phụ huynh và trẻ nhỏ: gieo cây, mở tầng mây, vào học ngay.",
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
    description: "Trang chủ phá cách theo hành trình cây đậu trên mây, tập trung trải nghiệm thay vì tường chữ.",
    images: ["/opengraph-image"],
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cùng Con Tự Học",
  url: "https://cungcontuhoc.io.vn",
  inLanguage: "vi",
  description:
    "Nền tảng học tập cho trẻ nhỏ với trải nghiệm Khu Vườn Trên Mây: lộ trình trực quan, tiến độ rõ ràng, phụ huynh theo dõi dễ dàng.",
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
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
    description: "Dùng thử miễn phí 7 ngày",
  },
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
  description:
    "Nền tảng giáo dục sớm cho trẻ 2-6 tuổi. Học Toán & Tiếng Anh qua trò chơi tương tác trong Khu Vườn Trên Mây.",
  sameAs: [
    "https://www.facebook.com/cungcontuhoc",
    "https://zalo.me/cungcontuhoc",
  ],
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
  name: "Khu Vườn Trên Mây - Học Toán & Tiếng Anh",
  description:
    "Chương trình học tập tương tác cho trẻ 2-6 tuổi. Bao gồm 5 khu vườn: Toán học, Tiếng Anh Phonics, Nghệ thuật, Âm nhạc, và Truyện kể.",
  provider: {
    "@type": "Organization",
    name: "Cùng Con Tự Học",
    sameAs: "https://cungcontuhoc.io.vn",
  },
  educationalLevel: "Preschool & Kindergarten",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Children aged 2-6",
  },
  availableLanguage: "vi",
  isAccessibleForFree: true,
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
      name: "Cùng Con Tự Học dành cho trẻ mấy tuổi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chương trình thiết kế cho trẻ 2-6 tuổi, với nội dung English và Math phù hợp theo từng độ tuổi.",
      },
    },
    {
      "@type": "Question",
      name: "Dùng thử 7 ngày có miễn phí thật không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hoàn toàn miễn phí, không cần nhập thẻ tín dụng. Hết 7 ngày, bạn tự chọn có tiếp tục hay không.",
      },
    },
    {
      "@type": "Question",
      name: "Học toán tư duy cho trẻ 2 tuổi có hiệu quả không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Có. Trẻ 2 tuổi học toán qua hình ảnh, màu sắc, và trò chơi tương tác. Khu vườn Toán học sử dụng phương pháp Montessori kết hợp gamification để bé tự nhiên tiếp thu khái niệm số, hình khối, và so sánh.",
      },
    },
    {
      "@type": "Question",
      name: "Học tiếng Anh cho trẻ mầm non bắt đầu từ đâu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bắt đầu từ Phonics (âm thanh chữ cái) và từ vựng đơn giản. Khu vườn Tiếng Anh sử dụng phương pháp TPR (Total Physical Response) - trẻ học qua hành động, âm nhạc, và lặp lại tự nhiên.",
      },
    },
    {
      "@type": "Question",
      name: "Khu Vườn Trên Mây là gì?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Khu Vườn Trên Mây là giao diện học tập dạng bản đồ tương tác. Mỗi khu vườn (Toán, Tiếng Anh, Nghệ thuật, Âm nhạc, Truyện) là một hành trình riêng. Trẻ chọn khu vườn → chọn bài học → hoàn thành để mở khóa bài tiếp theo.",
      },
    },
    {
      "@type": "Question",
      name: "Giá 799,000đ/năm bao gồm những gì?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gói Standard (799k/năm) bao gồm: Truy cập tất cả 5 khu vườn, lộ trình cá nhân hóa, báo cáo hàng tuần, PDF hoạt động offline, 3 hồ sơ con, và cập nhật bài học mới mỗi tháng. Không giới hạn số lần học.",
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
      {/* Prefetch key routes for faster navigation */}
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
