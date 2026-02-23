import { AdminFeatureFlagsPanel } from "@/components/admin-feature-flags-panel";
import { AdminSecurityPanel } from "@/components/admin-security-panel";
import { getAdminSecuritySettings } from "@/modules/platform/security-policy-service";

export default async function AdminSecurityPage() {
  const securitySettings = await getAdminSecuritySettings();

  return (
    <div className="page-stack">
      <AdminSecurityPanel
        initialSecurityPolicies={securitySettings.policies}
        initialSecurityControls={securitySettings.controls}
      />
      <AdminFeatureFlagsPanel />
    </div>
  );
}
