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
    absolute: "Cùng Con Tự Học - Lộ trình học tập cho trẻ 2-6 tuổi",
  },
  description:
    "Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ theo lộ trình. Dùng thử 7 ngày miễn phí, không cần thẻ tín dụng.",
  alternates: {
    canonical: "https://cungcontuhoc.vn",
  },
  openGraph: {
    title: "Cùng Con Tự Học - Learning Journey cho trẻ 2-6 tuổi",
    description: "15 phút mỗi ngày, có báo cáo tuần và bằng chứng tiến bộ rõ ràng cho phụ huynh.",
    url: "https://cungcontuhoc.vn",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    title: "Cùng Con Tự Học - Lộ trình học tập cho trẻ 2-6 tuổi",
    description: "Dùng thử 7 ngày miễn phí, không cần thẻ tín dụng.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cùng Con Tự Học",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "vi",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "240000",
    priceCurrency: "VND",
    offerCount: "2",
  },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
