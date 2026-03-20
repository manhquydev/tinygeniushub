import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import * as blogRepository from "@/modules/blog/blog-repository";

export async function GET() {
  try {
    const tags = await blogRepository.findTags();
    const response = NextResponse.json({ tags });
    response.headers.set("Cache-Control", "public, max-age=3600");
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.tags",
    });
  }
}

