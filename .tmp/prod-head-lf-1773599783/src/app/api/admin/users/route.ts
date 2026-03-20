import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listAdminUsers } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const searchParams = request.nextUrl.searchParams;
    const query = {
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") || undefined,
      sort: searchParams.get("sort") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const data = await listAdminUsers(query);
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
