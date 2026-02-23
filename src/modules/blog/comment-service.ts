import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

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
    if (/https?:\/\//i.test(data.content) && (data.content.match(/https?:\/\//gi)?.length ?? 0) > 2) {
      throw new Error("Too many URLs detected.");
    }

    const verifyToken = randomUUID();
    const comment = await prisma.blogComment.create({
      data: {
        ...data,
        status: "PENDING",
        verifyToken,
      },
    });
    return { comment, verifyToken };
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
    return prisma.blogComment.update({ where: { id }, data: { status } });
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
