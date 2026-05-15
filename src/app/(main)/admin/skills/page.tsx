import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { requireAdminParent } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSkillsPanel } from "@/components/admin/skills/admin-skills-panel";
import { listAllSkillsAsTree } from "@/modules/adaptive/skill-taxonomy-service";
import { Sparkles } from "lucide-react";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export default async function AdminSkillsPage() {
  const admin = await requireAdminParent();
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");

  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`admin.skills.${key}`, undefined, locale);
  const skills = await listAllSkillsAsTree();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<Sparkles size={18} />}
        eyebrow={t("eyebrow")}
      />
      <AdminSkillsPanel initialSkills={skills} />
    </div>
  );
}
