import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/observability/logger";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { DomainError } from "@/modules/platform/errors";
import { notifyCommentReply } from "@/modules/reader/reader-service";
import { enqueueNotifyBlogCommentReply } from "@/worker/queue";

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

    const status = ACTION_STATUS_MAP[payload.action];
    const result = await prisma.$transaction(async (tx) => {
      const existingComments = await tx.blogComment.findMany({
        where: {
          id: {
            in: commentIds,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (existingComments.length !== commentIds.length) {
        throw new DomainError("One or more comments were not found", 404, "BLOG_COMMENT_NOT_FOUND");
      }

      const commentIdsToUpdate = existingComments
        .filter((comment) => comment.status !== status)
        .map((comment) => comment.id);

      if (commentIdsToUpdate.length === 0) {
        return {
          updatedCount: 0,
          replyNotifications: [] as Array<{
            parentCommentId: string;
            replyCommentId: string;
            postSlug: string;
            postTitle: string;
            recipientEmail: string;
          }>,
        };
      }

      await tx.blogComment.updateMany({
        where: {
          id: {
            in: commentIdsToUpdate,
          },
        },
        data: {
          status,
        },
      });

      if (status !== "APPROVED") {
        return {
          updatedCount: commentIdsToUpdate.length,
          replyNotifications: [] as Array<{
            parentCommentId: string;
            replyCommentId: string;
            postSlug: string;
            postTitle: string;
            recipientEmail: string;
          }>,
        };
      }

      const approvedReplies = await tx.blogComment.findMany({
        where: {
          id: {
            in: commentIdsToUpdate,
          },
          parentId: {
            not: null,
          },
          status: "APPROVED",
          parent: {
            status: "APPROVED",
            notifyOnReply: true,
          },
        },
        select: {
          id: true,
          post: {
            select: {
              slug: true,
              titleVi: true,
            },
          },
          parent: {
            select: {
              id: true,
              authorEmail: true,
            },
          },
        },
      });

      return {
        updatedCount: commentIdsToUpdate.length,
        replyNotifications: approvedReplies
          .filter((reply) => reply.parent !== null)
          .map((reply) => ({
            parentCommentId: reply.parent!.id,
            replyCommentId: reply.id,
            postSlug: reply.post.slug,
            postTitle: reply.post.titleVi,
            recipientEmail: reply.parent!.authorEmail,
          })),
      };
    });

    const sideEffectResults = await Promise.allSettled(
      result.replyNotifications.map(async (notification) => {
        await enqueueNotifyBlogCommentReply({
          parentCommentId: notification.parentCommentId,
          replyCommentId: notification.replyCommentId,
          postSlug: notification.postSlug,
        });
        await notifyCommentReply({
          recipientEmail: notification.recipientEmail,
          postTitle: notification.postTitle,
          postSlug: notification.postSlug,
        });
      }),
    );
    for (const sideEffect of sideEffectResults) {
      if (sideEffect.status !== "rejected") {
        continue;
      }

      logWarn("admin.blog.comments.bulk.notification_failed", {
        reason:
          sideEffect.reason instanceof Error
            ? sideEffect.reason.message
            : String(sideEffect.reason),
      });
    }

    return NextResponse.json({ updatedCount: result.updatedCount });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.comments.bulk",
    });
  }
}
