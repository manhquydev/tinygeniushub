import { NextResponse } from "next/server";
import { getCached } from "@/lib/blog-cache";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

export async function GET() {
  try {
    const posts = await getCached("featured", 10 * 60 * 1000, () =>
      blogService.getFeaturedPosts(),
    );

    const response = NextResponse.json({ posts });
    response.headers.set(
      "Cache-Control",
      "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.featured",
    });
  }
}
