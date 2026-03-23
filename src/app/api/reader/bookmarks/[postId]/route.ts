import type { NextRequest } from "next/server";
import { requireReaderFromRequest } from "@/lib/auth/reader";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { removeBookmark } from "@/modules/reader/reader-service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const reader = await requireReaderFromRequest(request);
    const rateLimit = await enforceRateLimit({
      key: `reader:bookmarks:mutation:${reader.id}`,
      limit: 30,
      windowMs: 60_000,
      storeFailureMode: "deny",
    });
    if (!rateLimit.allowed) {
      return fail("Too many bookmark requests. Please retry later.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const { postId } = await context.params;
    await removeBookmark(reader.id, postId);
    return ok({ removed: true });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.bookmarks.remove",
    });
  }
}
