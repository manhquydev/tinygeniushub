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
        <header className="flex h-14 items-center gap-3 px-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <SidebarTrigger className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck size={15} className="text-teal-600" />
            <div>
              <p className="text-sm font-medium text-slate-800 leading-tight">
                Bảng điều khiển quản trị
              </p>
              <p className="text-xs text-slate-400 leading-tight hidden sm:block">
                Giám sát vận hành, nội dung và bảo mật hệ thống
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 border border-teal-200">
              {roleLabel}
            </span>
            <span className="hidden md:inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {todayLabel}
            </span>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-700">{role}</span>
              <span className="text-xs text-slate-400">{session.user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
