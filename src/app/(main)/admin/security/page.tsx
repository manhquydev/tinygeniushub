import { ShieldAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFeatureFlagsPanel } from "@/components/admin-feature-flags-panel";
import { AdminSecurityPanel } from "@/components/admin-security-panel";
import { getAdminSecuritySettings } from "@/modules/platform/security-policy-service";

export default async function AdminSecurityPage() {
  const securitySettings = await getAdminSecuritySettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bảo mật hệ thống"
        description="DDoS mode, rate limits, blocklist IP và feature flags."
        icon={<ShieldAlert size={18} />}
        eyebrow="System Governance"
        actions={(
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <ShieldAlert size={11} />
            Chỉ SUPER_ADMIN
          </span>
        )}
      />

      <AdminSecurityPanel
        initialSecurityPolicies={securitySettings.policies}
        initialSecurityControls={securitySettings.controls}
      />
      <AdminFeatureFlagsPanel />
    </div>
  );
}
