import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { getAdminSession } from "@/modules/admin/admin-auth-service";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const role = session.user.role;
  const todayLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  const roleLabel = role === "SUPER_ADMIN" ? "Super admin" : "Staff admin";

  return (
    <SidebarProvider>
      <AdminShellNav role={role} />

      <SidebarInset style={{ backgroundColor: "var(--admin-content-bg)" }}>
        <header className="flex h-12 items-center gap-2 px-3 border-b border-slate-200 bg-white sticky top-0 z-10 md:h-14 md:gap-3 md:px-4">
          <SidebarTrigger className="shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-1" />
          <Separator orientation="vertical" className="h-5 shrink-0" />
          <div className="flex min-w-0 items-center gap-2 text-slate-600">
            <ShieldCheck size={14} className="shrink-0 text-teal-600" />
            <p className="truncate text-sm font-medium text-slate-800">
              Quản trị
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 border border-teal-200">
              {roleLabel}
            </span>
            <span className="hidden lg:inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {todayLabel}
            </span>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-slate-700 leading-tight">{session.user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
