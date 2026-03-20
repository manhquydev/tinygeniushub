import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  ageGroup: z.enum(["UNDER_3", "AGE_3_5", "AGE_6_8", "AGE_9_12", "ALL_AGES"]).optional(),
  type: z.enum(["ARTICLE", "TIP", "NEWS", "GUIDE", "RESEARCH", "STORY"]).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value ? value === "true" : undefined)),
  sort: z.enum(["latest", "popular", "trending"]).optional(),
});

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = querySchema.parse(params);

    const result = await blogService.listPosts(query);

    const response = NextResponse.json({
      posts: result.posts,
      pagination: {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });

    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=3600");
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.posts.list",
    });
  }
}

