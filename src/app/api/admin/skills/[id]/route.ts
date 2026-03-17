/**
 * PATCH /api/admin/skills/[id] — update a skill
 */

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { getSkillWithPrerequisites, updateSkill } from "@/modules/adaptive/skill-taxonomy-service";
import { z } from "zod";

const updateSkillSchema = z.object({
  nameVi: z.string().min(1).max(200).optional(),
  nameEn: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  orderNo: z.number().int().min(0).optional(),
  parentId: z.string().nullable().optional(),
  iconEmoji: z.string().max(10).nullable().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;
    const skill = await getSkillWithPrerequisites(id);
    if (!skill) return fail("Skill not found", 404);
    return ok({ skill });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = updateSkillSchema.parse(await request.json());
    const skill = await updateSkill(id, body);
    return ok({ skill });
  } catch (error) {
    return handleRouteError(error);
  }
}


