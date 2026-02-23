import type { ReactNode } from "react";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { requireAdminParent } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminParent();

  return (
    <div className="page-stack">
      <div className="md:hidden">
        <AdminShellNav mode="mobile" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <AdminShellNav mode="desktop" />
        </aside>

        <div className="min-w-0 page-stack">{children}</div>
      </div>
    </div>
  );
}
