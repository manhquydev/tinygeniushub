import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";

function resolveDays(range: string | null) {
  if (range === "7d") {
    return 7;
  }

  if (range === "90d") {
    return 90;
  }

  return 30;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const range = request.nextUrl.searchParams.get("range");
    const days = resolveDays(range);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalViews, totalLikes, totalSubscribers, totalPublishedPosts, topPosts, viewsByDay, categoryBreakdown, categories] =
      await prisma.$transaction([
        prisma.blogPost.aggregate({
          _sum: { viewCount: true },
          where: { status: "PUBLISHED" },
        }),
        prisma.blogPost.aggregate({
          _sum: { likeCount: true },
          where: { status: "PUBLISHED" },
        }),
        prisma.blogNewsletterSubscriber.count({
          where: { verified: true, unsubscribedAt: null },
        }),
        prisma.blogPost.count({
          where: { status: "PUBLISHED" },
        }),
        prisma.blogPost.findMany({
          where: { status: "PUBLISHED" },
          select: { titleVi: true, slug: true, viewCount: true, likeCount: true, readingTimeMin: true },
          orderBy: { viewCount: "desc" },
          take: 10,
        }),
        prisma.blogReadHistory.groupBy({
          by: ["readAt"],
          _count: { id: true },
          where: { readAt: { gte: since } },
          orderBy: { readAt: "asc" },
        }),
        prisma.blogPost.groupBy({
          by: ["categoryId"],
          _sum: { viewCount: true },
          where: { status: "PUBLISHED" },
          orderBy: {
            categoryId: "asc",
          },
        }),
        prisma.blogCategory.findMany({
          select: {
            id: true,
            nameVi: true,
          },
        }),
      ]);

    const categoryNameMap = new Map(categories.map((category) => [category.id, category.nameVi]));
    const categoryBreakdownWithName = categoryBreakdown.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categoryNameMap.get(item.categoryId) ?? item.categoryId,
      views: item._sum?.viewCount ?? 0,
    }));

    return NextResponse.json({
      totalViews: totalViews._sum.viewCount ?? 0,
      totalLikes: totalLikes._sum.likeCount ?? 0,
      totalSubscribers,
      totalPublishedPosts,
      topPosts,
      viewsByDay,
      categoryBreakdown: categoryBreakdownWithName,
      range: range ?? "30d",
      days,
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.analytics",
    });
  }
}
