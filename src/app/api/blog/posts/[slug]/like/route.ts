import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import * as blogRepository from "@/modules/blog/blog-repository";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ slug: string }>;
  },
) {
  try {
    const { slug } = await context.params;
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const likeCount = await blogRepository.incrementLikeCount(post.id);
    return NextResponse.json({ likeCount });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.posts.like",
    });
  }
}

