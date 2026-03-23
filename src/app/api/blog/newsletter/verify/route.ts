import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { newsletterService } from "@/modules/blog/newsletter-service";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const verified = await newsletterService.verifySubscription(token);
    if (!verified) {
      return NextResponse.redirect(new URL("/blog?subscribed=false", request.url));
    }

    return NextResponse.redirect(new URL("/blog?subscribed=true", request.url));
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.verify",
    });
  }
}
