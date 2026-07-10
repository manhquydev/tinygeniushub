import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getLocale } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSecurityPanel } from "@/components/admin-security-panel";
import { getAdminSecuritySettings } from "@/modules/platform/security-policy-service";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { requireSuperAdminParent } from "@/lib/auth/admin";

export default async function AdminSecurityPage() {
  await requireSuperAdminParent();
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.security.${key}`, undefined, locale);
  const securitySettings = await getAdminSecuritySettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<ShieldAlert size={18} />}
        eyebrow={t("eyebrow")}
        actions={(
          <div className="flex items-center gap-2">
            <Link
              href="#parent-email-verification-module"
              className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              {t("openEmailVerification")}
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <ShieldAlert size={11} />
              {t("superAdminOnly")}
            </span>
          </div>
        )}
      />

      <AdminSecurityPanel
        initialSecurityPolicies={securitySettings.policies}
        initialSecurityControls={securitySettings.controls}
      />
    </div>
  );
}
