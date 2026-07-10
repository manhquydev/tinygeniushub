import { AdminStaffPanel } from "@/components/admin-staff-panel";
import { requireSuperAdminParent } from "@/lib/auth/admin";

export default async function AdminStaffPage() {
    await requireSuperAdminParent();
    return <AdminStaffPanel />;
}
