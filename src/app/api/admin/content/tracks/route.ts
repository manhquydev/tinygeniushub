import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listTracksWithStats } from "@/modules/admin/content-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const tracks = await listTracksWithStats();
    return ok({ tracks });
  } catch (error) {
    return handleRouteError(error);
  }
}
