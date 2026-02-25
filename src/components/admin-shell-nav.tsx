"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, BookOpen, Clock, GraduationCap, LayoutDashboard, MessageCircle, PenSquare, Settings, Shield, Users } from "lucide-react";

type AdminShellNavMode = "mobile" | "desktop";

const NAV = [
  { href: "/admin/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Khoá học", icon: GraduationCap },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  { href: "/admin/blog/posts", label: "Bài viết", icon: PenSquare },
  { href: "/admin/blog/categories", label: "Danh mục", icon: PenSquare },
  { href: "/admin/blog/authors", label: "Tác giả", icon: PenSquare },
  { href: "/admin/blog/newsletter", label: "Newsletter", icon: PenSquare },
  { href: "/admin/blog/analytics", label: "Phan tich", icon: BarChart2 },
  { href: "/admin/blog/comments", label: "Binh luan", icon: MessageCircle },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/content", label: "Nội dung", icon: BookOpen },
  { href: "/admin/analytics", label: "Phân tích", icon: BarChart2 },
  { href: "/admin/operations", label: "Vận hành", icon: Settings },
  { href: "/admin/security", label: "Bảo mật", icon: Shield },
  { href: "/admin/log", label: "Nhật ký", icon: Clock },
] as const;

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShellNav({ mode }: { mode: AdminShellNavMode }) {
  const pathname = usePathname();

  if (mode === "mobile") {
    return (
      <nav aria-label="Điều hướng quản trị">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <ul className="flex min-w-max list-none gap-2 p-0">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? "border-teal-300 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Điều hướng quản trị" className="sticky top-24 w-[200px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ul className="list-none space-y-1 p-0">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
