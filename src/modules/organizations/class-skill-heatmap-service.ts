/**
 * Class skill heatmap service for B2B organizations.
 * Delegates to analytics-service and enforces org membership access control.
 */

import { type SkillDomain } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { getClassSkillHeatmap, getSkillGapReport } from "@/modules/adaptive/analytics-service";

/** Verify the requesting parent is a TEACHER_ADMIN of the org. */
async function assertTeacherAdmin(orgId: string, parentId: string): Promise<void> {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_parentId: { organizationId: orgId, parentId } },
  });
  if (!member || member.role !== "TEACHER_ADMIN") {
    throw new DomainError("Only teacher admins can access class analytics", 403, "FORBIDDEN");
  }
}

/** Get heatmap data for a class, enforcing teacher-admin access. */
export async function getClassHeatmapForTeacher(
  orgId: string,
  teacherParentId: string,
  domain: SkillDomain,
) {
  await assertTeacherAdmin(orgId, teacherParentId);
  return getClassSkillHeatmap(orgId, domain);
}

/** Get skill gap report for a class, enforcing teacher-admin access. */
export async function getSkillGapReportForTeacher(
  orgId: string,
  teacherParentId: string,
  domain: SkillDomain,
) {
  await assertTeacherAdmin(orgId, teacherParentId);
  return getSkillGapReport(orgId, domain);
}
