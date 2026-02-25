import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminNote, getAdminNotes } from "@/modules/admin/service";

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
    const admin = await requireAdminFromRequest(request);
    const { parentId } = await context.params;
    const body = (await request.json()) as {
      note?: string;
    };

    const note = await createAdminNote({
      parentId,
      note: body.note ?? "",
      adminEmail: admin.email,
    });

    return ok({ note });
  } catch (error) {
    return handleRouteError(error);
  }
}
