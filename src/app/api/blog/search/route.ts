import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json(
        { error: "Query too short, minimum 2 characters" },
        { status: 400 },
      );
    }

    const results = await blogService.searchPosts(q);
    return NextResponse.json({
      results,
      total: results.length,
      query: q,
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.search",
    });
  }
}
