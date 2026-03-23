import { NextResponse } from "next/server";
import { z } from "zod";
import { getCached } from "@/lib/blog-cache";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  ageGroup: z
    .enum([
      "UNDER_3",
      "AGE_3_5",
      "AGE_4_6",
      "AGE_6_8",
      "AGE_7_9",
      "AGE_9_12",
      "AGE_10_12",
      "ALL_AGES",
    ])
    .optional(),
  type: z
    .enum(["ARTICLE", "TIP", "NEWS", "GUIDE", "RESEARCH", "STORY"])
    .optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value ? value === "true" : undefined)),
  sort: z.enum(["latest", "popular", "trending"]).optional(),
});

function buildPostsCacheKey(query: z.infer<typeof querySchema>) {
  return [
    "posts",
    `p${query.page}`,
    `l${query.limit}`,
    `c${query.category ?? "all"}`,
    `t${query.tag ?? "all"}`,
    `a${query.author ?? "all"}`,
    `g${query.ageGroup ?? "all"}`,
    `y${query.type ?? "all"}`,
    `f${typeof query.featured === "boolean" ? String(query.featured) : "all"}`,
    `s${query.sort ?? "latest"}`,
  ].join(":");
}

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = querySchema.parse(params);

    const cacheKey = buildPostsCacheKey(query);
    const result = await getCached(cacheKey, 5 * 60 * 1000, () =>
      blogService.listPosts(query),
    );

    const response = NextResponse.json({
      posts: result.posts,
      pagination: {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });

    response.headers.set(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.posts.list",
    });
  }
}
