/**
 * GET /api/admin/skills — list all skills as tree
 * POST /api/admin/skills — create a new skill
 */

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { createSkill, listAllSkillsAsTree } from "@/modules/adaptive/skill-taxonomy-service";
import { z } from "zod";

const createSkillSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/),
  domain: z.enum(["MATH", "ENGLISH_PHONICS"]),
  nameVi: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  gradeLevel: z.number().int().min(1).max(12),
  orderNo: z.number().int().min(0).default(0),
  parentId: z.string().optional(),
  iconEmoji: z.string().max(10).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const tree = await listAllSkillsAsTree();
    return ok({ skills: tree });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const body = createSkillSchema.parse(await request.json());
    const skill = await createSkill(body);
    return ok({ skill }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}


