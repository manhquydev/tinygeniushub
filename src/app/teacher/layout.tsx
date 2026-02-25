import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — Giáo viên | Cùng Con Tự Học",
    default: "Dashboard Giáo viên | Cùng Con Tự Học",
  },
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-shell">
      <div className="container">{children}</div>
    </div>
  );
}
