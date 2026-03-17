"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart2,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  Gift,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Newspaper,
  PenSquare,
  Settings,
  ShieldAlert,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";

type AdminShellNavMode = "mobile" | "desktop";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
  superAdminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  superAdminOnly?: boolean;
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { href: "/admin/overview", label: "Tổng quan", icon: LayoutDashboard },
    ],
  },
  {
    label: "DỮ LIỆU",
    items: [
      { href: "/admin/analytics", label: "Phân tích", icon: BarChart2 },
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/courses", label: "Khoá học", icon: GraduationCap },
      {
        href: "/admin/organizations",
        label: "Tổ chức",
        icon: Building2,
        superAdminOnly: true,
      },
    ],
  },
  {
    label: "VẬN HÀNH",
    items: [
      { href: "/admin/operations", label: "Vận hành", icon: Settings },
      { href: "/admin/gift-codes", label: "Mã quà tặng", icon: Gift },
      { href: "/admin/content", label: "Nội dung", icon: BookOpen },
      {
        href: "/admin/blog",
        label: "Blog",
        icon: PenSquare,
        children: [
          { href: "/admin/blog/posts", label: "Bài viết", icon: PenSquare },
          { href: "/admin/blog/categories", label: "Danh mục", icon: Tag },
          { href: "/admin/blog/authors", label: "Tác giả", icon: Users },
          {
            href: "/admin/blog/newsletter",
            label: "Bản tin",
            icon: Newspaper,
          },
          {
            href: "/admin/blog/analytics",
            label: "Phân tích Blog",
            icon: BarChart2,
          },
          {
            href: "/admin/blog/comments",
            label: "Bình luận",
            icon: MessageCircle,
          },
        ],
      },
    ],
  },
  {
    label: "HỆ THỐNG",
    superAdminOnly: true,
    items: [
      { href: "/admin/staff", label: "Nhân sự", icon: UserCheck },
      { href: "/admin/security", label: "Bảo mật", icon: ShieldAlert },
      { href: "/admin/log", label: "Nhật ký", icon: Clock },
    ],
  },
];

// Flat list for mobile view (no groups)
const MOBILE_NAV_FLAT: NavItem[] = [
  { href: "/admin/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Phân tích", icon: BarChart2 },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/courses", label: "Khoá học", icon: GraduationCap },
  { href: "/admin/operations", label: "Vận hành", icon: Settings },
  { href: "/admin/gift-codes", label: "Mã quà tặng", icon: Gift },
  { href: "/admin/content", label: "Nội dung", icon: BookOpen },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  {
    href: "/admin/organizations",
    label: "Tổ chức",
    icon: Building2,
    superAdminOnly: true,
  },
  {
    href: "/admin/staff",
    label: "Nhân sự",
    icon: UserCheck,
    superAdminOnly: true,
  },
  {
    href: "/admin/security",
    label: "Bảo mật",
    icon: ShieldAlert,
    superAdminOnly: true,
  },
  {
    href: "/admin/log",
    label: "Nhật ký",
    icon: Clock,
    superAdminOnly: true,
  },
];

const SUPER_ADMIN_ONLY_LABELS = new Set([
  "Tổ chức",
  "Nhân sự",
  "Bảo mật",
  "Nhật ký",
]);

function isPathActive(pathname: string, href: string) {
  if (href === "/admin/overview") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, items: NavItem[]): boolean {
  return items.some(
    (item) =>
      isPathActive(pathname, item.href) ||
      (item.children ?? []).some((child) =>
        isPathActive(pathname, child.href),
      ),
  );
}

/** Desktop sidebar item (no children) */
function SidebarItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isPathActive(pathname, item.href);

  return (
    <li>
      <Link
        href={item.href}
        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
          active
            ? "border-l-2 border-teal-400 bg-slate-800 pl-[10px] text-white"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        }`}
      >
        <Icon
          size={15}
          className={`shrink-0 transition-colors ${active ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}`}
        />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

/** Desktop collapsible group item (Blog with children) */
function SidebarGroupItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const childActive = (item.children ?? []).some((c) =>
    isPathActive(pathname, c.href),
  );
  const selfActive = isPathActive(pathname, item.href);
  const anyActive = childActive || selfActive;

  const [open, setOpen] = useState(anyActive);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
          anyActive
            ? "border-l-2 border-teal-400 bg-slate-800 pl-[10px] text-white"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        }`}
      >
        <Icon
          size={15}
          className={`shrink-0 ${anyActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}`}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown size={13} className="shrink-0 text-slate-500" />
        ) : (
          <ChevronRight size={13} className="shrink-0 text-slate-500" />
        )}
      </button>

      {open && item.children ? (
        <ul className="mt-0.5 space-y-0.5 pl-[22px]">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            const childIsActive = isPathActive(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    childIsActive
                      ? "border-l-2 border-teal-400 bg-slate-800 pl-[10px] text-white"
                      : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
                  }`}
                >
                  <ChildIcon
                    size={13}
                    className={`shrink-0 ${childIsActive ? "text-teal-400" : "text-slate-600"}`}
                  />
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function AdminShellNav({
  mode,
  role,
}: {
  mode: AdminShellNavMode;
  role: string;
}) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN";

  // ── Mobile nav ──────────────────────────────────────────────
  if (mode === "mobile") {
    const visibleItems = MOBILE_NAV_FLAT.filter(
      (item) => !item.superAdminOnly || isSuperAdmin,
    );

    return (
      <nav
        aria-label="Điều hướng quản trị"
        className="border-b border-slate-800 bg-slate-900 px-4 py-2"
      >
        <div className="overflow-x-auto">
          <ul className="flex min-w-max list-none gap-1 p-0">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-slate-700 text-teal-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Icon size={13} className="shrink-0" />
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

  // ── Desktop dark sidebar ─────────────────────────────────────
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !SUPER_ADMIN_ONLY_LABELS.has(item.label) || isSuperAdmin,
    ),
  })).filter((group) => {
    if (group.superAdminOnly && !isSuperAdmin) return false;
    return group.items.length > 0;
  });

  return (
    <nav
      aria-label="Điều hướng quản trị"
      className="sticky top-0 flex h-screen w-[220px] flex-col bg-slate-900"
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500">
          <ShieldAlert size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          CCTH Admin
        </span>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) =>
                  item.children ? (
                    <SidebarGroupItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                    />
                  ) : (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                    />
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer logout hint */}
      <div className="shrink-0 border-t border-slate-800 px-3 py-3">
        <Link
          href="/admin/login"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
        >
          <LogOut size={13} className="shrink-0" />
          Đăng xuất
        </Link>
      </div>
    </nav>
  );
}
