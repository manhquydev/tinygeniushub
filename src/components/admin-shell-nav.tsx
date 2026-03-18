"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ElementType } from "react";
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
  Link2,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ElementType;
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
    label: "Tổng quan",
    items: [{ href: "/admin/overview", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Dữ liệu",
    items: [
      { href: "/admin/analytics", label: "Phân tích", icon: BarChart2 },
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/courses", label: "Khoá học", icon: GraduationCap },
      { href: "/admin/organizations", label: "Tổ chức", icon: Building2, superAdminOnly: true },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { href: "/admin/operations", label: "Vận hành", icon: Settings },
      { href: "/admin/gift-codes", label: "Mã quà tặng", icon: Gift },
      { href: "/admin/content", label: "Nội dung", icon: BookOpen },
      { href: "/admin/site-settings", label: "Cài đặt trang", icon: Link2 },
      {
        href: "/admin/blog",
        label: "Blog",
        icon: PenSquare,
        children: [
          { href: "/admin/blog/posts", label: "Bài viết", icon: PenSquare },
          { href: "/admin/blog/categories", label: "Danh mục", icon: Tag },
          { href: "/admin/blog/authors", label: "Tác giả", icon: Users },
          { href: "/admin/blog/newsletter", label: "Bản tin", icon: Newspaper },
          { href: "/admin/blog/analytics", label: "Analytics", icon: BarChart2 },
          { href: "/admin/blog/comments", label: "Bình luận", icon: MessageCircle },
        ],
      },
    ],
  },
  {
    label: "Hệ thống",
    superAdminOnly: true,
    items: [
      { href: "/admin/staff", label: "Nhân sự", icon: UserCheck, superAdminOnly: true },
      { href: "/admin/security", label: "Bảo mật", icon: ShieldAlert, superAdminOnly: true },
      { href: "/admin/log", label: "Nhật ký", icon: Clock, superAdminOnly: true },
    ],
  },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/admin/overview") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hasActiveChild(pathname: string, item: NavItem) {
  return (item.children ?? []).some((child) => isPathActive(pathname, child.href));
}

function isVisible(item: NavItem | NavGroup, isSuperAdmin: boolean) {
  return !item.superAdminOnly || isSuperAdmin;
}

function NavItemWithChildren({
  item,
  pathname,
  isSuperAdmin,
}: {
  item: NavItem & { children: NavItem[] };
  pathname: string;
  isSuperAdmin: boolean;
}) {
  const Icon = item.icon;
  const visibleChildren = item.children.filter((child) => isVisible(child, isSuperAdmin));
  const active = isPathActive(pathname, item.href) || hasActiveChild(pathname, item);
  const [open, setOpen] = useState(active);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={active} tooltip={item.label} aria-label={item.label} className="text-sidebar-foreground">
            <Icon size={16} className="shrink-0" />
            <span>{item.label}</span>
            {open ? (
              <ChevronDown size={14} className="ml-auto" />
            ) : (
              <ChevronRight size={14} className="ml-auto" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {visibleChildren.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isPathActive(pathname, child.href);
              return (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <Link href={child.href}>
                      <ChildIcon size={14} className="shrink-0" />
                      <span>{child.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AdminShellNav({ role }: { role: string }) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => isVisible(item, isSuperAdmin)),
    })).filter((group) => {
      if (!isVisible(group, isSuperAdmin)) return false;
      return group.items.length > 0;
    });
  }, [isSuperAdmin]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r-0")}
      style={
        {
          "--sidebar": "var(--admin-sidebar-bg)",
          "--sidebar-foreground": "var(--admin-sidebar-fg)",
          "--sidebar-accent": "var(--admin-sidebar-accent)",
          "--sidebar-accent-foreground": "var(--admin-sidebar-accent-fg)",
          "--sidebar-border": "#1e293b",
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="px-4 py-3 border-b border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0" aria-label="CCTH Admin">
            <ShieldAlert size={16} className="text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
            <p className="text-xs text-[#94a3b8]">
              {isSuperAdmin ? "Super Admin" : "Staff Admin"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-[#94a3b8] px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                if (item.children) {
                  return (
                    <NavItemWithChildren
                      key={item.href}
                      item={item as NavItem & { children: NavItem[] }}
                      pathname={pathname}
                      isSuperAdmin={isSuperAdmin}
                    />
                  );
                }
                const Icon = item.icon;
                const active = isPathActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label} aria-label={item.label} className="text-sidebar-foreground">
                      <Link href={item.href}>
                        <Icon size={16} className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
        <form action="/api/admin/auth/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Đăng xuất</span>
          </button>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
