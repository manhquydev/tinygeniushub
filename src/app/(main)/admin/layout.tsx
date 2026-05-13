import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ShieldCheck } from "lucide-react";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { getAdminSession } from "@/modules/admin/admin-auth-service";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  const role = session.user.role;
  const todayLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  const roleLabel = role === "SUPER_ADMIN" ? "Super admin" : "Staff admin";

  return (
    <SidebarProvider defaultOpen={sidebarOpen} className="admin-shell">
      <AdminShellNav role={role} />

      <SidebarInset className="min-w-0" style={{ backgroundColor: "var(--admin-content-bg)" }}>
        <header className="flex h-12 items-center gap-2 px-3 border-b border-[var(--admin-card-border)] bg-[var(--admin-header-bg)] sticky top-0 z-10 md:h-14 md:gap-3 md:px-4">
          <SidebarTrigger className="shrink-0 text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-sidebar-accent)] -ml-1" />
          <Separator orientation="vertical" className="h-5 shrink-0" />
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck size={14} className="shrink-0 text-teal-600" />
            <p className="truncate text-sm font-medium text-[var(--admin-text-primary)]">
              Administration
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full bg-teal-900/30 px-2.5 py-0.5 text-xs font-medium text-teal-400 border border-teal-800">
              {roleLabel}
            </span>
            <span className="hidden lg:inline-flex items-center rounded-full bg-[var(--admin-sidebar-accent)] px-2.5 py-0.5 text-xs text-[var(--admin-text-secondary)]">
              {todayLabel}
            </span>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-[var(--admin-text-primary)] leading-tight">{session.user.email}</span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
