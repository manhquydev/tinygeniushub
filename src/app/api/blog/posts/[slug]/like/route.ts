import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getReaderFromRequest } from "@/lib/auth/reader";
import {
  buildRateLimitIdentity,
  enforceRateLimit,
  getRequestIp,
} from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import * as blogRepository from "@/modules/blog/blog-repository";
import { BLOG_LIKE_SESSION_COOKIE_NAME } from "@/modules/blog/blog-repository";

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

    const reader = await getReaderFromRequest(request);
    const cookieHeader = request.headers.get("cookie");
    const existingSessionToken = getCookieValue(cookieHeader, BLOG_LIKE_SESSION_COOKIE_NAME);
    const sessionToken = existingSessionToken ?? randomUUID();
    const identityHash = blogRepository.getBlogLikeIdentityHash({
      readerId: reader?.id,
      sessionToken,
    });

    if (!identityHash) {
      return NextResponse.json({ error: "Unable to identify like session" }, { status: 400 });
    }

    const result = await blogRepository.registerPostLike(post.id, identityHash);
    const response = NextResponse.json({
      likeCount: result.likeCount,
      liked: result.created,
      alreadyLiked: !result.created,
    });

    if (!existingSessionToken && !reader) {
      response.cookies.set(BLOG_LIKE_SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.posts.like",
    });
  }
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const segments = cookieHeader.split(";");
  for (const segment of segments) {
    const [rawName, ...rawValue] = segment.trim().split("=");
    if (rawName !== name) {
      continue;
    }

    const value = rawValue.join("=").trim();
    return value.length > 0 ? value : null;
  }

  return null;
}
