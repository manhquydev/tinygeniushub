import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { searchAdminUsersByEmail } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const limit = request.nextUrl.searchParams.get("limit") ?? undefined;

    if (q.length === 0) {
      return ok({ users: [] });
    }

    const users = await searchAdminUsersByEmail({ q, limit });
    return ok({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}
