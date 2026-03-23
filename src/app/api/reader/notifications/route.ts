import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireReaderFromRequest } from "@/lib/auth/reader";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import {
  listNotifications,
  markAllNotificationsRead,
} from "@/modules/reader/reader-service";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const markAllSchema = z.object({
  action: z.literal("mark_all_read"),
});

export async function GET(request: NextRequest) {
  try {
    const reader = await requireReaderFromRequest(request);
    const query = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const notifications = await listNotifications(reader.id, query.limit);
    return ok({ notifications });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.notifications.list",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const reader = await requireReaderFromRequest(request);
    const rateLimit = await enforceRateLimit({
      key: `reader:notifications:mutation:${reader.id}`,
      limit: 60,
      windowMs: 60_000,
      storeFailureMode: "deny",
    });
    if (!rateLimit.allowed) {
      return fail("Too many notification requests. Please retry later.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    markAllSchema.parse(await request.json());
    const result = await markAllNotificationsRead(reader.id);
    return ok(result);
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.notifications.mark_all_read",
    });
  }
}
