import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listLevelsForTrack } from "@/modules/admin/content-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const trackId = request.nextUrl.searchParams.get("trackId")?.trim() ?? "";

    if (trackId.length === 0) {
      return fail("Missing trackId", 400);
    }

    const levels = await listLevelsForTrack(trackId);
    return ok({ levels });
  } catch (error) {
    return handleRouteError(error);
  }
}
