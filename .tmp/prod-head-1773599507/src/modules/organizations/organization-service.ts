import { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { addDays } from "date-fns";

export type { OrgRole };

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  domain?: string;
  billingStart?: Date;
  billingEnd?: Date;
}

export async function createOrganization(data: CreateOrganizationInput) {
  return prisma.organization.create({ data });
}

export async function getOrganization(orgId: string) {
  return prisma.organization.findUnique({ where: { id: orgId } });
}

export async function updateOrganization(orgId: string, data: Partial<CreateOrganizationInput> & { isActive?: boolean }) {
  return prisma.organization.update({ where: { id: orgId }, data });
}

export async function addMember(orgId: string, parentId: string, role: OrgRole) {
  return prisma.organizationMember.upsert({
    where: { organizationId_parentId: { organizationId: orgId, parentId } },
    create: { organizationId: orgId, parentId, role },
    update: { role },
  });
}

export async function removeMember(orgId: string, parentId: string): Promise<void> {
  await prisma.organizationMember.deleteMany({
    where: { organizationId: orgId, parentId },
  });
}

export async function isTeacherAdmin(orgId: string, parentId: string): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_parentId: { organizationId: orgId, parentId } },
  });
  return member?.role === OrgRole.TEACHER_ADMIN;
}

export async function getOrgMembers(orgId: string, requestingParentId: string) {
  const isAdmin = await isTeacherAdmin(orgId, requestingParentId);
  if (!isAdmin) {
    throw new DomainError("Only teacher admins can view members", 403, "FORBIDDEN");
  }
  return prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { parent: { select: { id: true, email: true, displayName: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export interface StudentProgressRow {
  parentId: string;
  email: string;
  displayName: string | null;
  children: Array<{
    nickname: string;
    lessonsCompleted: number;
    streakDays: number;
    lastActiveAt: Date | null;
  }>;
}

export async function getOrgStudentProgress(
  orgId: string,
  teacherParentId: string,
): Promise<StudentProgressRow[]> {
  const isAdmin = await isTeacherAdmin(orgId, teacherParentId);
  if (!isAdmin) {
    throw new DomainError("Only teacher admins can view student progress", 403, "FORBIDDEN");
  }

  const since = addDays(new Date(), -30);

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId, role: OrgRole.STUDENT_PARENT },
    include: {
      parent: {
        select: {
          id: true,
          email: true,
          displayName: true,
          lastActiveAt: true,
          childProfiles: {
            select: {
              id: true,
              nickname: true,
              completions: {
                where: { completedAt: { gte: since } },
                select: { id: true },
              },
              progressStates: {
                select: { streakCount: true },
              },
            },
          },
        },
      },
    },
  });

  return members.map((m) => ({
    parentId: m.parent.id,
    email: m.parent.email,
    displayName: m.parent.displayName,
    children: m.parent.childProfiles.map((c) => ({
      nickname: c.nickname,
      lessonsCompleted: c.completions.length,
      streakDays: c.progressStates.reduce((max, ps) => Math.max(max, ps.streakCount), 0),
      lastActiveAt: m.parent.lastActiveAt,
    })),
  }));
}

export async function listAllOrganizations() {
  return prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
}
