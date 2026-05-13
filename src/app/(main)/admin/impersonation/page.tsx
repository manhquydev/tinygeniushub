import { requireAdminParent } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminImpersonationPanel } from "@/components/admin/impersonation/admin-impersonation-panel";
import { ShieldUser } from "lucide-react";

export default async function AdminImpersonationPage() {
  await requireAdminParent();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Log in instead"
        description="Simulate a user login session for support or debugging. Super Admin only."
        icon={<ShieldUser size={18} />}
        eyebrow="System"
      />
      <AdminImpersonationPanel />
    </div>
  );
}
