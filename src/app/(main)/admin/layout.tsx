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
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile top nav bar */}
      <div className="fixed inset-x-0 top-0 z-30 md:hidden">
        <AdminShellNav mode="mobile" role={role} />
      </div>

      {/* Desktop dark sidebar — fixed left */}
      <div className="hidden md:block">
        <div className="fixed inset-y-0 left-0 z-30 w-[220px]">
          <AdminShellNav mode="desktop" role={role} />
        </div>
      </div>

      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 md:ml-[220px]">
        {/* Mobile spacer for the fixed top nav */}
        <div className="h-12 md:hidden" />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
