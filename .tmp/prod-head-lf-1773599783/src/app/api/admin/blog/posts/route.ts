import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { blogService } from "@/modules/blog/blog-service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

const createBlogPostInputSchema = z.object({
  slug: z.string().trim().min(2).max(160),
  type: z.enum(["ARTICLE", "TIP", "NEWS", "GUIDE", "RESEARCH", "STORY"]),
  titleVi: z.string().trim().min(2).max(250),
  titleEn: z.string().trim().min(2).max(250).optional(),
  excerptVi: z.string().trim().min(10).max(1000),
  contentMarkdown: z.string().trim().min(10),
  categoryId: z.string().min(1),
  authorId: z.string().min(1),
  ageGroup: z.enum(["UNDER_3", "AGE_3_5", "AGE_6_8", "AGE_9_12", "ALL_AGES"]),
  tagIds: z.array(z.string().min(1)).default([]),
  coverImageUrl: z.string().url().optional(),
  metaTitleVi: z.string().trim().min(2).max(250).optional(),
  metaDescVi: z.string().trim().min(2).max(500).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const query = listQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { titleVi: { contains: query.q, mode: "insensitive" as const } },
              { excerptVi: { contains: query.q, mode: "insensitive" as const } },
              { slug: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          slug: true,
          titleVi: true,
          status: true,
          coverImageUrl: true,
          publishedAt: true,
          viewCount: true,
          category: {
            select: {
              nameVi: true,
              slug: true,
            },
          },
          author: {
            select: {
              displayName: true,
            },
          },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts: rows,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.list",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request);
    const payload = createBlogPostInputSchema.parse(await request.json());
    const post = await blogService.createPost(payload, admin.email);
    return NextResponse.json({ post });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.create",
    });
  }
}




