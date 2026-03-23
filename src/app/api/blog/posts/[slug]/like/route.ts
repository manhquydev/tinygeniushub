import { NextResponse } from "next/server";
import {
  buildRateLimitIdentity,
  enforceRateLimit,
  getRequestIp,
} from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import * as blogRepository from "@/modules/blog/blog-repository";

function buildRetryAfterHeader(retryAfterMs: number | undefined) {
  if (typeof retryAfterMs !== "number" || retryAfterMs <= 0) {
    return undefined;
  }

  return { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertTrustedOrigin(request);

    const ip = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `blog:like:ip:${buildRateLimitIdentity(ip)}`,
      limit: 10,
      windowMs: 60 * 1000,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many likes. Please try again later." },
        {
          status: 429,
          headers: buildRetryAfterHeader(rateLimit.retryAfterMs),
        },
      );
    }

    const { slug } = await context.params;
    const post = await blogRepository.findPostBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const likeCount = await blogRepository.incrementLikeCount(post.id);
    return NextResponse.json({ likeCount });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.posts.like",
    });
  }
}
