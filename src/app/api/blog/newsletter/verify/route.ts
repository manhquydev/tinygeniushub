import { NextResponse } from "next/server";
import { newsletterService } from "@/modules/blog/newsletter-service";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/blog?subscribed=false", request.url));
  }

  await newsletterService.verifySubscription(token);
  return NextResponse.redirect(new URL("/blog?subscribed=true", request.url));
}

