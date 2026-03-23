import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { commentService } from "@/modules/blog/comment-service";
import { DomainError } from "@/modules/platform/errors";

const bulkCommentsSchema = z.object({
  action: z.enum(["approve", "reject", "spam"]),
  commentIds: z.array(z.string().min(1)).min(1).max(50),
});

const ACTION_STATUS_MAP = {
  approve: "APPROVED",
  reject: "DELETED",
  spam: "SPAM",
} as const;

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    await requireAdminFromRequest(request);
    const payload = bulkCommentsSchema.parse(await request.json());
    const commentIds = [...new Set(payload.commentIds)];

    const existingComments = await prisma.blogComment.findMany({
      where: {
        id: {
          in: commentIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingComments.length !== commentIds.length) {
      throw new DomainError("One or more comments were not found", 404, "BLOG_COMMENT_NOT_FOUND");
    }

    const status = ACTION_STATUS_MAP[payload.action];
    await Promise.all(commentIds.map((commentId) => commentService.moderateComment(commentId, status)));

    return NextResponse.json({ updatedCount: commentIds.length });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.comments.bulk",
    });
  }
}
