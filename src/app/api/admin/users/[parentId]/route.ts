import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminParentDetail } from "@/modules/admin/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ parentId: string }> },
) {
  try {
    await requireAdminFromRequest(request);

    const { parentId } = await params;
    const detail = await getAdminParentDetail(parentId);

    return ok({ detail });
  } catch (error) {
    return handleRouteError(error);
  }
}
