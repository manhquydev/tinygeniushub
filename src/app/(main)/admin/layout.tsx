import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { getAdminSession } from "@/modules/admin/admin-auth-service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const role = session.user.role;

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
