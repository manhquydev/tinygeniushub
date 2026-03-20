import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listWebhookEventsAdmin } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const limit = request.nextUrl.searchParams.get("limit") ?? undefined;
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const webhooks = await listWebhookEventsAdmin({ limit, status });

    return ok({ webhooks });
  } catch (error) {
    return handleRouteError(error);
  }
}
