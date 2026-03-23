import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { getReaderFromRequest } from "@/lib/auth/reader";
import { handleRouteError } from "@/lib/route-error";
import { countUnreadNotifications } from "@/modules/reader/reader-service";

export async function GET(request: NextRequest) {
  try {
    const reader = await getReaderFromRequest(request);
    if (!reader) {
      return ok({ count: 0 });
    }

    const count = await countUnreadNotifications(reader.id);
    return ok({ count });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.notifications.unread_count",
    });
  }
}
