import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { newsletterService } from "@/modules/blog/newsletter-service";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (token) {
      await newsletterService.unsubscribe(token);
    }

    return NextResponse.redirect(new URL("/blog?unsubscribed=true", request.url));
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.unsubscribe",
    });
  }
}
