import type { ReactNode } from "react";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { requireAdminSession } from "@/modules/admin/admin-auth-service";

function resolveRole(user: unknown) {
  if (!user || typeof user !== "object") {
    return "";
  }
  const role = (user as Record<string, unknown>).role;
  return typeof role === "string" ? role : "";
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();
  const role = resolveRole(session.user);

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
