import { getLocale } from "next-intl/server";
import { requireSuperAdminParent } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminImpersonationPanel } from "@/components/admin/impersonation/admin-impersonation-panel";
import { ShieldUser } from "lucide-react";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export default async function AdminImpersonationPage() {
  await requireSuperAdminParent();
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.impersonation.${key}`, undefined, locale);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<ShieldUser size={18} />}
        eyebrow={t("eyebrow")}
      />
      <AdminImpersonationPanel />
    </div>
  );
}
