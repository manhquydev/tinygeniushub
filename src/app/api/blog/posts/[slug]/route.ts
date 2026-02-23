import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ slug: string }>;
  },
) {
  try {
    const { slug } = await context.params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const response = NextResponse.json(post);
    response.headers.set("Cache-Control", "public, max-age=600, s-maxage=600, stale-while-revalidate=7200");
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.posts.slug",
    });
  }
}

