import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

export async function GET() {
  try {
    const posts = await blogService.getFeaturedPosts();
    const response = NextResponse.json({ posts });
    response.headers.set("Cache-Control", "public, max-age=600");
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.featured",
    });
  }
}

