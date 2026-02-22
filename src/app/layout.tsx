import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { MainShell } from "@/components/main-shell";
import { SiteFooter } from "@/components/site-footer";

const mainFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Cùng Con Tự Học",
    template: "%s | Cùng Con Tự Học",
  },
  description:
    "Learning Journey OS cho phụ huynh có con 2-6 tuổi. Mỗi ngày 15 phút, phụ huynh thấy rõ con tiến bộ.",
  metadataBase: new URL("https://cungcontuhoc.vn"),
  openGraph: {
    siteName: "Cùng Con Tự Học",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={mainFont.variable}>
        <AppNav />
        <MainShell>{children}</MainShell>
        <SiteFooter />
      </body>
    </html>
  );
}
