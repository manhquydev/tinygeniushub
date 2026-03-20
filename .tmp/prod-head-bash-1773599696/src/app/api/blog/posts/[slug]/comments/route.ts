import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import { commentService } from "@/modules/blog/comment-service";
import { enqueueVerifyBlogComment } from "@/worker/queue";

const commentSchema = z.object({
  authorName: z.string().trim().min(2).max(50),
  authorEmail: z.string().trim().email(),
  content: z.string().trim().min(10).max(2000),
  parentId: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ slug: string }>;
  },
) {
  try {
    const { slug } = await context.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ comments: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const comments = await commentService.getApprovedComments(post.id);
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.comments.list",
    });
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ slug: string }>;
  },
) {
  try {
    const { slug } = await context.params;
    const body = commentSchema.parse(await request.json());

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const ipRaw = request.headers.get("x-forwarded-for") ?? "";
    const ipHash = createHash("sha256").update(ipRaw).digest("hex").slice(0, 16);
    const { comment, verifyToken } = await commentService.submitComment({
      postId: post.id,
      parentId: body.parentId,
      authorName: body.authorName,
      authorEmail: body.authorEmail.toLowerCase(),
      content: body.content,
      ipHash,
    });

    await enqueueVerifyBlogComment({
      commentId: comment.id,
      authorName: body.authorName,
      authorEmail: body.authorEmail.toLowerCase(),
      postSlug: post.slug,
      verifyToken,
    });

    return NextResponse.json({ message: "Vui long kiem tra email de duyet binh luan" }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.comments.create",
    });
  }
}
