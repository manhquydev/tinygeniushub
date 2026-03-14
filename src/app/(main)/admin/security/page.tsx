import { AdminFeatureFlagsPanel } from "@/components/admin-feature-flags-panel";
import { AdminSecurityPanel } from "@/components/admin-security-panel";
import { getAdminSecuritySettings } from "@/modules/platform/security-policy-service";
import { ShieldAlert } from "lucide-react";

export default async function AdminSecurityPage() {
  const securitySettings = await getAdminSecuritySettings();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
          <ShieldAlert size={18} className="text-rose-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bảo mật hệ thống</h1>
          <p className="text-sm text-slate-500">
            Chế độ DDoS, giới hạn truy cập, danh sách IP và feature flags.
          </p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <ShieldAlert size={11} />
            Chỉ SUPER_ADMIN
          </span>
        </div>
      </div>

      <AdminSecurityPanel
        initialSecurityPolicies={securitySettings.policies}
        initialSecurityControls={securitySettings.controls}
      />
      <AdminFeatureFlagsPanel />
    </div>
  );
}
