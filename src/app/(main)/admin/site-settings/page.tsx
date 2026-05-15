import { Link2 } from "lucide-react";
import { getLocale } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSocialLinksEditor } from "@/components/admin/site-settings/admin-social-links-editor";
import { getFooterSocialLinks } from "@/modules/platform/site-content-settings-service";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export const dynamic = "force-dynamic";

export default async function AdminSiteSettingsPage() {
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.siteSettings.${key}`, undefined, locale);
  const socialLinks = await getFooterSocialLinks();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<Link2 size={18} />}
        eyebrow={t("eyebrow")}
      />

      <AdminSocialLinksEditor initialLinks={socialLinks} />
    </div>
  );
}
