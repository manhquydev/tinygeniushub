import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildRateLimitIdentity,
  enforceRateLimit,
  getRequestIp,
} from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

function buildRetryAfterHeader(retryAfterMs: number | undefined) {
  if (typeof retryAfterMs !== "number" || retryAfterMs <= 0) {
    return undefined;
  }

  return { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) };
}

export async function GET(request: Request) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `blog:search:ip:${buildRateLimitIdentity(ip)}`,
      limit: 30,
      windowMs: 60 * 1000,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again later." },
        {
          status: 429,
          headers: buildRetryAfterHeader(rateLimit.retryAfterMs),
        },
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const parsed = searchQuerySchema.parse({ q: searchParams.get("q") ?? "" });

    const results = await blogService.searchPosts(parsed.q);
    return NextResponse.json({
      results,
      total: results.length,
      query: parsed.q,
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.search",
    });
  }
}
