import { NextResponse } from "next/server";
import { getCached } from "@/lib/blog-cache";
import { handleRouteError } from "@/lib/route-error";
import * as blogRepository from "@/modules/blog/blog-repository";

export async function GET() {
  try {
    const categories = await getCached("categories:all", 30 * 60 * 1000, () =>
      blogRepository.findCategories(),
    );

    const response = NextResponse.json({ categories });
    response.headers.set(
      "Cache-Control",
      "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
    );
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.categories",
    });
  }
}
