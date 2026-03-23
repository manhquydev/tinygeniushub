import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/observability/logger";
import {
  buildRateLimitIdentity,
  enforceRateLimit,
  getRequestIp,
} from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { commentService } from "@/modules/blog/comment-service";
import { enqueueVerifyBlogComment } from "@/worker/queue";

const commentSchema = z.object({
  authorName: z.string().trim().min(2).max(50),
  authorEmail: z.string().trim().email(),
  content: z.string().trim().min(10).max(2000),
  parentId: z.string().optional(),
});

function buildRetryAfterHeader(retryAfterMs: number | undefined) {
  if (typeof retryAfterMs !== "number" || retryAfterMs <= 0) {
    return undefined;
  }

  return { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { comments: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const comments = await commentService.getApprovedComments(post.id);
    return NextResponse.json(
      { comments },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.comments.list",
    });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertTrustedOrigin(request);

    const ip = getRequestIp(request);
    const ipIdentity = buildRateLimitIdentity(ip);
    const rateLimit = await enforceRateLimit({
      key: `blog:comment:ip:${ipIdentity}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many comments. Please try again later." },
        {
          status: 429,
          headers: buildRetryAfterHeader(rateLimit.retryAfterMs),
        },
      );
    }

    const { slug } = await context.params;
    const body = commentSchema.parse(await request.json());

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { comment, verifyToken, shouldSendVerification, spamScore, urlCount } =
      await commentService.submitComment({
        postId: post.id,
        parentId: body.parentId,
        authorName: body.authorName,
        authorEmail: body.authorEmail.toLowerCase(),
        content: body.content,
        ipHash: ipIdentity,
      });

    if (shouldSendVerification && verifyToken) {
      await enqueueVerifyBlogComment({
        commentId: comment.id,
        authorName: body.authorName,
        authorEmail: body.authorEmail.toLowerCase(),
        postSlug: post.slug,
        verifyToken,
      });
    } else {
      logInfo("blog.comment.auto_flagged_spam", {
        commentId: comment.id,
        postId: post.id,
        spamScore,
        urlCount,
      });
    }

    return NextResponse.json(
      { message: "Vui lòng kiểm tra email để duyệt bình luận" },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.comments.create",
    });
  }
}
