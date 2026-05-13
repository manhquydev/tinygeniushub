import { Link2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSocialLinksEditor } from "@/components/admin/site-settings/admin-social-links-editor";
import { getFooterSocialLinks } from "@/modules/platform/site-content-settings-service";

export const dynamic = "force-dynamic";

export default async function AdminSiteSettingsPage() {
  const socialLinks = await getFooterSocialLinks();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Page settings"
        description="Manage social network links and content settings displayed on the website."
        icon={<Link2 size={18} />}
        eyebrow="Site Settings"
      />

      <AdminSocialLinksEditor initialLinks={socialLinks} />
    </div>
  );
}
