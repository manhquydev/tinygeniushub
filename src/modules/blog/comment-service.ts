import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  SPAM_THRESHOLD,
  calculateSpamScore,
  countUrls,
} from "@/modules/blog/comment-spam-detector";
import { notifyCommentReply } from "@/modules/reader/reader-service";
import { enqueueNotifyBlogCommentReply } from "@/worker/queue";

export const commentService = {
  async getApprovedComments(postId: string) {
    return prisma.blogComment.findMany({
      where: { postId, status: "APPROVED", parentId: null },
      include: {
        replies: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async submitComment(data: {
    postId: string;
    parentId?: string;
    authorName: string;
    authorEmail: string;
    content: string;
    ipHash?: string;
  }) {
    if (data.content.length < 10 || data.content.length > 2000) {
      throw new Error("Comment must be 10-2000 characters.");
    }

    const urlCount = countUrls(data.content);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCommentsByIp =
      data.ipHash && data.ipHash.length > 0
        ? await prisma.blogComment.count({
            where: {
              ipHash: data.ipHash,
              createdAt: {
                gte: oneHourAgo,
              },
            },
          })
        : 0;

    const spamScore = calculateSpamScore({
      content: data.content,
      authorName: data.authorName,
      urlCount,
      recentCommentsByIp,
    });
    const status = spamScore >= SPAM_THRESHOLD ? "SPAM" : "PENDING";
    const verifyToken = status === "PENDING" ? randomUUID() : null;

    const comment = await prisma.blogComment.create({
      data: {
        ...data,
        status,
        verifyToken,
      },
    });

    return {
      comment,
      verifyToken,
      shouldSendVerification: status === "PENDING" && verifyToken !== null,
      spamScore,
      urlCount,
    };
  },

  async verifyComment(token: string) {
    const comment = await prisma.blogComment.findUnique({ where: { verifyToken: token } });
    if (!comment) {
      return false;
    }
    await prisma.blogComment.update({
      where: { id: comment.id },
      data: { status: "APPROVED", verifyToken: null },
    });
    return true;
  },

  async moderateComment(id: string, status: "APPROVED" | "SPAM" | "DELETED") {
    const updatedComment = await prisma.blogComment.update({
      where: { id },
      data: { status },
      include: {
        post: {
          select: {
            slug: true,
            titleVi: true,
          },
        },
        parent: {
          select: {
            id: true,
            status: true,
            notifyOnReply: true,
            authorEmail: true,
          },
        },
      },
    });

    if (
      status === "APPROVED" &&
      updatedComment.parentId &&
      updatedComment.parent &&
      updatedComment.parent.status === "APPROVED" &&
      updatedComment.parent.notifyOnReply
    ) {
      await enqueueNotifyBlogCommentReply({
        parentCommentId: updatedComment.parent.id,
        replyCommentId: updatedComment.id,
        postSlug: updatedComment.post.slug,
      });
      await notifyCommentReply({
        recipientEmail: updatedComment.parent.authorEmail,
        postTitle: updatedComment.post.titleVi,
        postSlug: updatedComment.post.slug,
      });
    }

    return updatedComment;
  },

  async getPendingComments() {
    return prisma.blogComment.findMany({
      where: { status: "PENDING" },
      include: { post: { select: { slug: true, titleVi: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },
};
