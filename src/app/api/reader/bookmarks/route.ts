import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireReaderFromRequest } from "@/lib/auth/reader";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { addBookmark, listBookmarks } from "@/modules/reader/reader-service";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createBookmarkSchema = z.object({
  postId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const reader = await requireReaderFromRequest(request);
    const query = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const result = await listBookmarks(reader.id, query.page, query.limit);

    return ok({
      ...result,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(result.total / query.limit)),
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.bookmarks.list",
    });
  }
}

export async function POST(request: NextRequest) {
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

    const payload = createBookmarkSchema.parse(await request.json());
    const bookmark = await addBookmark(reader.id, payload.postId);
    return ok({ bookmark });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.bookmarks.create",
    });
  }
}
