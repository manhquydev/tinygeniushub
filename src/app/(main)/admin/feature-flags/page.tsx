import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { requireAdminParent } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFeatureFlagsPanel } from "@/components/admin-feature-flags-panel";
import { ToggleLeft } from "lucide-react";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export default async function AdminFeatureFlagsPage() {
  const admin = await requireAdminParent();
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");

  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.featureFlags.${key}`, undefined, locale);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<ToggleLeft size={18} />}
        eyebrow={t("eyebrow")}
      />
      <AdminFeatureFlagsPanel />
    </div>
  );
}
