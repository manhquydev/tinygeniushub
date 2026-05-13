import type { Metadata } from "next";
import { TryGardenClient } from "./try-garden-client";

/**
 * /try-garden - Public preview page.
 */
export const metadata: Metadata = {
  title: "Cloud Garden - Course Preview | TinyGenius Hub",
  description:
    "Explore the Cloud Garden with the experience of previewing interactive lessons for children 2-6 years old before purchasing the course.",
  keywords: ["check out the course", "early learning for children", "mental math for children", "English phonics", "TinyGenius Hub"],
  openGraph: {
    title: "Cloud Garden - Preview the course",
    description: "Explore the world of learning and preview lessons before you buy.",
    url: "https://www.tinygeniushubvn.tech/try-garden",
    siteName: "TinyGenius Hub",
    images: [
      {
        url: "/og-images/try-garden.png",
        width: 1200,
        height: 630,
        alt: "Cloud Garden - Check it out",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud Garden - Preview the course",
    description: "View sample lessons and choose the right course for your child.",
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

export default function TryGardenPage() {
  return <TryGardenClient />;
}
