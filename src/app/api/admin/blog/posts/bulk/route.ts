import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BlogPostStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { invalidateBlogCache } from "@/lib/blog-cache";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createVersion, deleteOldVersions } from "@/modules/blog/blog-version-repository";
import { notifyNewPost } from "@/modules/reader/reader-service";
import { DomainError } from "@/modules/platform/errors";

const bulkPostsSchema = z.object({
  action: z.enum(["publish", "archive", "delete"]),
  postIds: z.array(z.string().min(1)).min(1).max(50),
});

function toVersionSnapshot(post: {
  titleVi: string;
  contentMarkdown: string;
  excerptVi: string;
  metaTitleVi: string | null;
  metaDescVi: string | null;
  coverImageUrl: string | null;
  status: BlogPostStatus;
}) {
  return {
    titleVi: post.titleVi,
    contentMarkdown: post.contentMarkdown,
    excerptVi: post.excerptVi,
    metaTitleVi: post.metaTitleVi,
    metaDescVi: post.metaDescVi,
    coverImageUrl: post.coverImageUrl,
    status: post.status,
  };
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    const admin = await requireAdminFromRequest(request);
    const payload = bulkPostsSchema.parse(await request.json());
    const postIds = [...new Set(payload.postIds)];

    if (postIds.length === 0) {
      return NextResponse.json({ updatedCount: 0 });
    }

    const posts = await prisma.blogPost.findMany({
      where: {
        id: {
          in: postIds,
        },
      },
      select: {
        id: true,
        titleVi: true,
        contentMarkdown: true,
        excerptVi: true,
        metaTitleVi: true,
        metaDescVi: true,
        coverImageUrl: true,
        status: true,
        publishedAt: true,
      },
    });

    if (posts.length !== postIds.length) {
      throw new DomainError("One or more blog posts were not found", 404, "BLOG_POST_NOT_FOUND");
    }

    const postById = new Map(posts.map((post) => [post.id, post]));
    const now = new Date();
    const publishedNowIds: string[] = [];
    const versionCleanupPostIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const postId of postIds) {
        const existingPost = postById.get(postId);
        if (!existingPost) {
          continue;
        }

        const nextStatus = payload.action === "publish" ? BlogPostStatus.PUBLISHED : BlogPostStatus.ARCHIVED;
        const updatedPost = await tx.blogPost.update({
          where: { id: postId },
          data:
            payload.action === "publish"
              ? {
                  status: BlogPostStatus.PUBLISHED,
                  publishedAt: existingPost.publishedAt ?? now,
                }
              : {
                  status: BlogPostStatus.ARCHIVED,
                },
          select: {
            id: true,
            titleVi: true,
            contentMarkdown: true,
            excerptVi: true,
            metaTitleVi: true,
            metaDescVi: true,
            coverImageUrl: true,
            status: true,
          },
        });

        if (existingPost.status !== nextStatus) {
          await createVersion(postId, toVersionSnapshot(updatedPost), admin.email, tx);
          versionCleanupPostIds.push(postId);
          if (payload.action === "publish") {
            publishedNowIds.push(postId);
          }
        }
      }
    });

    if (versionCleanupPostIds.length > 0) {
      await Promise.all(
        versionCleanupPostIds.map((postId) => deleteOldVersions(postId, 50)),
      );
    }

    if (publishedNowIds.length > 0) {
      await Promise.all(publishedNowIds.map((postId) => notifyNewPost(postId)));
    }
    await invalidateBlogCache("*");
    return NextResponse.json({ updatedCount: postIds.length });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.bulk",
    });
  }
}
