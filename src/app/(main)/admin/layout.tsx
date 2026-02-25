import type { ReactNode } from "react";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { requireAdminSession } from "@/modules/admin/admin-auth-service";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();
  const role = (session.user as any).role as string;

  return (
    <div className="page-stack">
      <div className="md:hidden">
        <AdminShellNav mode="mobile" role={role} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <AdminShellNav mode="desktop" role={role} />
        </aside>

        <div className="min-w-0 page-stack">{children}</div>
      </div>
    </div>
  );
}
