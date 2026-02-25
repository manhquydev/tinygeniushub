/**
 * POST /api/admin/skills/[id]/prerequisites — add a prerequisite to a skill
 * DELETE /api/admin/skills/[id]/prerequisites — remove a prerequisite
 */

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { addPrerequisite, removePrerequisite } from "@/modules/adaptive/skill-taxonomy-service";
import { z } from "zod";

const prerequisiteSchema = z.object({
  prerequisiteId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = prerequisiteSchema.parse(await request.json());
    await addPrerequisite(id, body.prerequisiteId);
    return ok({ message: "Prerequisite added" });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = prerequisiteSchema.parse(await request.json());
    await removePrerequisite(id, body.prerequisiteId);
    return ok({ message: "Prerequisite removed" });
  } catch (error) {
    return handleRouteError(error);
  }
}
