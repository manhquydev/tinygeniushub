import { NextResponse } from "next/server";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { handleRouteError } from "@/lib/route-error";
import { newsletterService } from "@/modules/blog/newsletter-service";

function redirectToBlogUnsubscribed(requestUrl: string) {
  const target = new URL("/blog", resolveEmailPublicBaseUrl(requestUrl));
  target.searchParams.set("unsubscribed", "true");
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (token) {
      await newsletterService.unsubscribe(token);
    }

    return redirectToBlogUnsubscribed(request.url);
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.unsubscribe",
    });
  }
}
