import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cùng Con Tự Học - Abeka Curriculum',
  description: 'Hệ thống giáo dục trực tuyến với chương trình Abeka chuẩn Mỹ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
