import { requireAdminParent } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminImpersonationPanel } from "@/components/admin/impersonation/admin-impersonation-panel";
import { ShieldUser } from "lucide-react";

export default async function AdminImpersonationPage() {
  await requireAdminParent();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Đăng nhập thay"
        description="Giả lập phiên đăng nhập của người dùng để hỗ trợ hoặc gỡ lỗi. Chỉ Super Admin."
        icon={<ShieldUser size={18} />}
        eyebrow="System"
      />
      <AdminImpersonationPanel />
    </div>
  );
}
