import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listUnitsForLevel } from "@/modules/admin/content-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const levelId = request.nextUrl.searchParams.get("levelId")?.trim() ?? "";

    if (levelId.length === 0) {
      return fail("Missing levelId", 400);
    }

    const units = await listUnitsForLevel(levelId);
    return ok({ units });
  } catch (error) {
    return handleRouteError(error);
  }
}
