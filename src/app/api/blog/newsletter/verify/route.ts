import { NextResponse } from "next/server";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { handleRouteError } from "@/lib/route-error";
import { newsletterService } from "@/modules/blog/newsletter-service";

function redirectToBlogWithSubscribeState(requestUrl: string, subscribed: "true" | "false") {
  const target = new URL("/blog", resolveEmailPublicBaseUrl(requestUrl));
  target.searchParams.set("subscribed", subscribed);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const verified = await newsletterService.verifySubscription(token);
    if (!verified) {
      return redirectToBlogWithSubscribeState(request.url, "false");
    }

    return redirectToBlogWithSubscribeState(request.url, "true");
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.verify",
    });
  }
}
