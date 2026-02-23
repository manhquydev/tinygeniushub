import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { commentService } from "@/modules/blog/comment-service";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/blog?comment-error=true", request.url));
  }

  const comment = await prisma.blogComment.findUnique({
    where: { verifyToken: token },
    select: {
      post: {
        select: {
          slug: true,
        },
      },
    },
  });

  const ok = await commentService.verifyComment(token);

  if (!ok || !comment) {
    return NextResponse.redirect(new URL("/blog?comment-error=true", request.url));
  }

  return NextResponse.redirect(new URL(`/blog/${comment.post.slug}?commented=true`, request.url));
}
