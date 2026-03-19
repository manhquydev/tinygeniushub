import { redirect } from "next/navigation";
import { requireAdminParent } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSkillsPanel } from "@/components/admin/skills/admin-skills-panel";
import { listAllSkillsAsTree } from "@/modules/adaptive/skill-taxonomy-service";
import { Sparkles } from "lucide-react";

export default async function AdminSkillsPage() {
  const admin = await requireAdminParent();
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");

  const skills = await listAllSkillsAsTree();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Skills Mapping"
        description="Quản lý phân loại kỹ năng học tập và ánh xạ bài học."
        icon={<Sparkles size={18} />}
        eyebrow="Governance"
      />
      <AdminSkillsPanel initialSkills={skills} />
    </div>
  );
}
