import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { createAdminNote, createAdminNoteSchema, getAdminNotes } from "@/modules/admin/service";

type RouteParams = {
  params: Promise<{ parentId: string }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    await requireAdminFromRequest(request);
    const { parentId } = await context.params;
    const notes = await getAdminNotes(parentId);
    return ok({ notes });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request);
    const { parentId } = await context.params;
    const body = createAdminNoteSchema.parse(await request.json());

    const note = await createAdminNote({
      parentId,
      note: body.note,
      adminEmail: admin.email,
    });

    return ok({ note });
  } catch (error) {
    return handleRouteError(error);
  }
}



