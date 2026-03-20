import { listAllOrganizations } from "@/modules/organizations/organization-service";
import { AdminOrganizationsPanel } from "@/components/admin-organizations-panel";

export default async function AdminOrganizationsPage() {
  const orgs = await listAllOrganizations();

  return (
    <AdminOrganizationsPanel
      initialOrgs={orgs.map((o) => ({
        ...o,
        billingStart: o.billingStart?.toISOString() ?? null,
        billingEnd: o.billingEnd?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
