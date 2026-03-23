import type { NextRequest } from "next/server";
import { requireReaderFromRequest } from "@/lib/auth/reader";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { markNotificationRead } from "@/modules/reader/reader-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;
    const result = await markNotificationRead(reader.id, id);
    return ok(result);
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.notifications.mark_read",
    });
  }
}
