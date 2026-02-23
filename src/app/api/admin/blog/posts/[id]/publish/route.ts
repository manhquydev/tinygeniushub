import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/route-error";
import { blogService } from "@/modules/blog/blog-service";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await context.params;

    const published = await blogService.publishPost(id);
    return NextResponse.json({ success: true, publishedAt: published.publishedAt });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "admin.blog.posts.publish",
    });
  }
}

