"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, LogOut, ShieldAlert } from "lucide-react";
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
import {
  buildAdminNavModel,
  type AdminModule,
  type AdminModuleChild,
} from "@/components/admin/admin-module-catalog";

function isPathActive(pathname: string, href: string) {
  if (href === "/admin/overview") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hasActiveChild(pathname: string, children: AdminModuleChild[]) {
  return children.some((child) => isPathActive(pathname, child.href));
}

function ModuleWithChildren({
  module,
  label,
  pathname,
  t,
}: {
  module: AdminModule & { children: AdminModuleChild[] };
  label: string;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = module.icon;
  const active = (module.href ? isPathActive(pathname, module.href) : false) || hasActiveChild(pathname, module.children);
  const [open, setOpen] = useState(active);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={active} tooltip={label} aria-label={label} className="text-sidebar-foreground">
            <Icon size={16} className="shrink-0" />
            <span>{label}</span>
            {open ? (
              <ChevronDown size={14} className="ml-auto" />
            ) : (
              <ChevronRight size={14} className="ml-auto" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {module.children.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isPathActive(pathname, child.href);
              const childKey = `nav.${module.key}.${child.key}`;
              const childLabel = t.has(childKey as never) ? t(childKey as never) : child.title;
              return (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <Link href={child.href}>
                      <ChildIcon size={14} className="shrink-0" />
                      <span>{childLabel}</span>
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
  const t = useTranslations("admin");

  const navModel = useMemo(() => buildAdminNavModel(role), [role]);

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
        {navModel.groups.map(({ group, modules }) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-[#94a3b8] px-2 mb-1">
              {t.has(`navGroup.${group.key}` as never) ? t(`navGroup.${group.key}` as never) : group.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {modules.map((module) => {
                const titleKey = `nav.${module.key}.title`;
                const label = t.has(titleKey as never) ? t(titleKey as never) : module.title;
                if (module.children?.length) {
                  return (
                    <ModuleWithChildren
                      key={module.key}
                      module={module as AdminModule & { children: AdminModuleChild[] }}
                      label={label}
                      pathname={pathname}
                      t={t}
                    />
                  );
                }
                const Icon = module.icon;
                const active = isPathActive(pathname, module.href as string);
                return (
                  <SidebarMenuItem key={module.key}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label} aria-label={label} className="text-sidebar-foreground">
                      <Link href={module.href as string}>
                        <Icon size={16} className="shrink-0" />
                        <span>{label}</span>
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
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
          </button>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
