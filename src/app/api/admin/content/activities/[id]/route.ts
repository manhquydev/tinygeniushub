import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { deleteActivity, updateActivity } from "@/modules/admin/content-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      prompt?: string;
      spec?: object;
      passCriteria?: number;
    };

    const activity = await updateActivity(id, {
      prompt: body.prompt ?? "",
      spec: body.spec ?? {},
      passCriteria: body.passCriteria ?? 80,
    });

    return ok({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    await deleteActivity(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
