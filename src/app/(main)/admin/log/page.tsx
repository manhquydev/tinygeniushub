import { AdminActionLogPanel } from "@/components/admin-action-log-panel";
import { requireSuperAdminParent } from "@/lib/auth/admin";

export default async function AdminLogPage() {
  await requireSuperAdminParent();
  return <AdminActionLogPanel />;
}
