/**
 * POST /api/admin/lessons/[id]/skills — tag a lesson with skills
 * GET /api/admin/lessons/[id]/skills — get skills tagged to a lesson
 */

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { prisma } from "@/lib/db";
import { z } from "zod";

const tagSkillsSchema = z.object({
  skillIds: z.array(z.string().min(1)).min(1).max(10),
  primarySkillId: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    await requireAdminFromRequest(request);
    const { lessonId } = await params;
    const lessonSkills = await prisma.lessonSkill.findMany({
      where: { lessonId },
      include: {
        skill: {
          select: { id: true, code: true, nameVi: true, nameEn: true, domain: true, iconEmoji: true },
        },
      },
    });
    return ok({ lessonSkills });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { lessonId } = await params;
    const body = tagSkillsSchema.parse(await request.json());

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) return fail("Lesson not found", 404);

    // Upsert all skill tags
    const results = await Promise.all(
      body.skillIds.map((skillId) =>
        prisma.lessonSkill.upsert({
          where: { lessonId_skillId: { lessonId, skillId } },
          update: { isPrimary: skillId === body.primarySkillId },
          create: { lessonId, skillId, isPrimary: skillId === body.primarySkillId },
        })
      )
    );

    return ok({ tagged: results.length }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { lessonId } = await params;
    const body = z.object({ skillId: z.string() }).parse(await request.json());
    await prisma.lessonSkill.deleteMany({ where: { lessonId, skillId: body.skillId } });
    return ok({ message: "Skill removed from lesson" });
  } catch (error) {
    return handleRouteError(error);
  }
}


