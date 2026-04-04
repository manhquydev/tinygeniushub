import type { Metadata } from "next";
import { Be_Vietnam_Pro, Nunito } from "next/font/google";
import { AnalyticsByConsent } from "@/components/legal/analytics-by-consent";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import "./globals.css";

const mainFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

const headingFont = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "TinyGeniusHub",
    template: "%s | TinyGeniusHub",
  },
  description:
    "Learning Journey OS cho phụ huynh có con 2-6 tuổi. Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ.",
  metadataBase: new URL("https://cungcontuhoc.io.vn"),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    siteName: "TinyGeniusHub",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/logos/tinygeniushub_app_icon.png",
    shortcut: "/logos/tinygeniushub_app_icon.png",
    apple: "/logos/tinygeniushub_app_icon.png",
  },
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const SW_VERSION = "20260402-cloud-garden-v4";
// GA4_ID and FB_PIXEL_ID MUST remain build-time NEXT_PUBLIC_ vars (not runtime/DB-driven)
// to avoid XSS via string interpolation in dangerouslySetInnerHTML below.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${mainFont.variable} ${headingFont.variable}`}>
        {children}

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){var params=new URLSearchParams(window.location.search);var hasRefreshParam=params.get('refresh')==='true';if(hasRefreshParam){Promise.all([navigator.serviceWorker.getRegistrations().then(function(regs){return Promise.all(regs.map(function(reg){return reg.unregister();}));}),('caches'in window?caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key.indexOf('offline-cache-')===0||key.indexOf('cloud-garden-')===0;}).map(function(key){return caches.delete(key);}));}):Promise.resolve())]).finally(function(){params.delete('refresh');var nextQuery=params.toString();var nextUrl=window.location.pathname+(nextQuery?('?'+nextQuery):'')+window.location.hash;window.history.replaceState(null,'',nextUrl);window.location.reload();});return;}navigator.serviceWorker.register('/sw.js?v=${SW_VERSION}').catch(function(e){console.warn('[SW]',e)})})}`,
          }}
        />

        <AnalyticsByConsent ga4Id={GA4_ID} fbPixelId={FB_PIXEL_ID} clarityProjectId={CLARITY_PROJECT_ID} />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
