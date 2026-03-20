import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/observability/logger";
import * as blogRepository from "@/modules/blog/blog-repository";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ slug: string }>;
  },
) {
  const { slug } = await context.params;

  void (async () => {
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
      return;
    }

    const parent = await getParentFromRequest(request);

    await Promise.all([
      prisma.blogReadHistory.create({
        data: {
          postId: post.id,
          parentId: parent?.id ?? null,
        },
      }),
      blogRepository.incrementViewCount(post.id),
    ]);
  })().catch((error) => {
    logError("blog.view_tracking.failed", {
      slug,
      error,
    });
  });

  return NextResponse.json({ ok: true });
}

