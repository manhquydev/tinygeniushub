import type { Metadata } from "next";
import "@/components/homepage/homepage.css";
import { SectionFaq } from "@/components/homepage/section-faq";
import { SectionFeatures } from "@/components/homepage/section-features";
import { SectionFinalCta } from "@/components/homepage/section-final-cta";
import { SectionHero } from "@/components/homepage/section-hero";
import { SectionHowItWorks } from "@/components/homepage/section-how-it-works";
import { SectionNav } from "@/components/homepage/section-nav";
import { SectionPricingPreview } from "@/components/homepage/section-pricing-preview";
import { SectionProblem } from "@/components/homepage/section-problem";
import { SectionProductDemo } from "@/components/homepage/section-product-demo";
import { SectionTestimonials } from "@/components/homepage/section-testimonials";
import { SectionTrustSignals } from "@/components/homepage/section-trust-signals";

export const metadata: Metadata = {
  title: {
    absolute: "Cùng Con Tự Học — Lộ trình học tập cho trẻ 2-6 tuổi",
  },
  description:
    "Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ theo lộ trình. Dùng thử 7 ngày miễn phí, không cần thẻ tín dụng.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://cungcontuhoc.vn",
  },
  openGraph: {
    title: "Cùng Con Tự Học — Lộ trình học tập cho trẻ 2-6 tuổi",
    description: "15 phút mỗi ngày, có báo cáo tuần và bằng chứng tiến bộ rõ ràng cho phụ huynh.",
    url: "https://cungcontuhoc.vn",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cùng Con Tự Học — Lộ trình học tập cho trẻ 2-6 tuổi",
      },
    ],
  },
  twitter: {
    title: "Cùng Con Tự Học — Lộ trình học tập cho trẻ 2-6 tuổi",
    description: "Dùng thử 7 ngày miễn phí, không cần thẻ tín dụng.",
    images: ["/opengraph-image"],
  },
};

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cùng Con Tự Học",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "vi",
  url: "https://cungcontuhoc.vn",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "120000",
    highPrice: "240000",
    priceCurrency: "VND",
    offerCount: "2",
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cùng Con Tự Học",
  url: "https://cungcontuhoc.vn",
  inLanguage: "vi",
  description: "Lộ trình học tập cho trẻ 2-6 tuổi. Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ.",
};

const jsonLdFaq = {
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
      name: "Con tôi chỉ cần học 15 phút mỗi ngày thôi sao?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Đúng vậy. Mỗi bài học gồm video ngắn + hoạt động offline + mini quiz. 15 phút đủ để duy trì thói quen học đều đặn.",
      },
    },
    {
      "@type": "Question",
      name: "Tôi có thể xem con học được gì không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Có. Dashboard phụ huynh hiển thị bài đã hoàn thành, điểm quiz, chuỗi ngày học. Báo cáo tuần tự động gửi qua email.",
      },
    },
    {
      "@type": "Question",
      name: "Thanh toán như thế nào?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Thanh toán trực tuyến qua chuyển khoản ngân hàng hoặc ví điện tử. Giá chỉ từ 120,000đ/năm — rẻ hơn 1 ly cà phê mỗi tháng.",
      },
    },
    {
      "@type": "Question",
      name: "Nếu không hài lòng, có được hoàn tiền không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Có. Hoàn tiền 100% trong 7 ngày đầu sau khi thanh toán, không hỏi lý do.",
      },
    },
  ],
};

export default function HomePage() {
  const jsonLd = { "@context": "https://schema.org", "@graph": [jsonLdApp, jsonLdWebsite, jsonLdFaq] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SectionHero />
      <SectionNav />
      <SectionProblem />
      <SectionHowItWorks />
      <SectionFeatures />
      <SectionTestimonials />
      <SectionProductDemo />
      <SectionPricingPreview />
      <SectionTrustSignals />
      <SectionFaq />
      <SectionFinalCta />
    </>
  );
}
