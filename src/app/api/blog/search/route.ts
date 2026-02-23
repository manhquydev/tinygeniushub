import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));

    if (query.length < 2) {
      return fail("Toi thieu 2 ky tu", 400);
    }

    const where: Prisma.BlogPostWhereInput = {
      status: "PUBLISHED",
      OR: [
        { titleVi: { contains: query, mode: "insensitive" } },
        { excerptVi: { contains: query, mode: "insensitive" } },
        {
          tags: {
            some: {
              tag: {
                OR: [
                  { nameVi: { contains: query, mode: "insensitive" } },
                  { slug: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ],
    };

    const [rows, total] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          slug: true,
          type: true,
          titleVi: true,
          excerptVi: true,
          coverImageUrl: true,
          publishedAt: true,
          readingTimeMin: true,
          viewCount: true,
          likeCount: true,
          ageGroup: true,
          author: {
            select: {
              displayName: true,
              avatarUrl: true,
              slug: true,
              role: true,
            },
          },
          category: {
            select: {
              nameVi: true,
              slug: true,
              emoji: true,
              color: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  slug: true,
                  nameVi: true,
                },
              },
            },
          },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    const results = rows.map((post) => ({
      ...post,
      tags: post.tags.map((entry) => entry.tag),
    }));

    return NextResponse.json({
      results,
      total,
      query,
      posts: results,
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.search",
    });
  }
}
