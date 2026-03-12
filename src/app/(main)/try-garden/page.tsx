import type { Metadata } from "next";
import { TryGardenClient } from "./try-garden-client";

/**
 * /try-garden - Public Preview Route
 * 
 * Shareable public preview page for viral growth.
 * No authentication required.
 * Shows CloudWorldMap with limited unlocked zones.
 * Locked zone clicks trigger sign-up modal.
 * 
 * Features:
 * - Fullscreen CloudWorldMap (Today + Math zones unlocked)
 * - Social sharing buttons (Facebook, Zalo, copy link)
 * - Analytics tracking (zone clicks, modal opens, sign-ups)
 * - OpenGraph tags for social previews
 */

export const metadata: Metadata = {
  title: "Khu Vườn Trên Mây - Dùng Thử Miễn Phí | Cùng Con Tự Học",
  description:
    "Khám phá Khu Vườn Trên Mây - Học Toán & Tiếng Anh qua trò chơi tương tác dành cho bé 2-6 tuổi. Dùng thử miễn phí ngay hôm nay!",
  keywords: [
    "học toán cho trẻ",
    "học tiếng anh cho trẻ",
    "khu vườn trên mây",
    "giáo dục sớm",
    "dùng thử miễn phí",
  ],
  openGraph: {
    title: "Khu Vườn Trên Mây - Dùng Thử Miễn Phí",
    description:
      "Khám phá Khu Vườn Trên Mây - Học Toán & Tiếng Anh qua trò chơi tương tác. Dành cho bé 2-6 tuổi.",
    url: "https://cungcontuhoc.io.vn/try-garden",
    siteName: "Cùng Con Tự Học",
    images: [
      {
        url: "/og-images/try-garden.png",
        width: 1200,
        height: 630,
        alt: "Khu Vườn Trên Mây - Preview",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Khu Vườn Trên Mây - Dùng Thử Miễn Phí",
    description:
      "Khám phá Khu Vườn Trên Mây - Học Toán & Tiếng Anh qua trò chơi tương tác cho bé 2-6 tuổi.",
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
    canonical: "https://cungcontuhoc.io.vn/try-garden",
  },
};

export default function TryGardenPage() {
  return <TryGardenClient />;
}
