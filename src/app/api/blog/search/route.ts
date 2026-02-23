import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      return fail("Toi thieu 2 ky tu", 400);
    }

    const posts = await blogService.searchPosts(query);
    return NextResponse.json({ posts });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.search",
    });
  }
}

