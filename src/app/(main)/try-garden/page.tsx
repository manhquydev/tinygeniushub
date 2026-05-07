import type { Metadata } from "next";
import { TryGardenClient } from "./try-garden-client";

/**
 * /try-garden - Trang xem thử công khai.
 */
export const metadata: Metadata = {
  title: "Khu Vườn Trên Mây - Xem thử khóa học | TinyGenius Hub",
  description:
    "Khám phá Khu Vườn Trên Mây với trải nghiệm xem thử bài học tương tác cho bé 2-6 tuổi trước khi mua khóa.",
  keywords: ["xem thử khóa học", "học sớm cho bé", "toán tư duy cho bé", "tiếng Anh phonics", "TinyGenius Hub"],
  openGraph: {
    title: "Khu Vườn Trên Mây - Xem thử khóa học",
    description: "Khám phá thế giới học tập và xem thử bài học trước khi mua.",
    url: "https://tinygeniushubvn.tech/try-garden",
    siteName: "TinyGenius Hub",
    images: [
      {
        url: "/og-images/try-garden.png",
        width: 1200,
        height: 630,
        alt: "Khu Vườn Trên Mây - Xem thử",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Khu Vườn Trên Mây - Xem thử khóa học",
    description: "Xem bài học mẫu và chọn khóa học phù hợp với bé.",
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
    canonical: "https://tinygeniushubvn.tech/try-garden",
  },
};

export default function TryGardenPage() {
  return <TryGardenClient />;
}
