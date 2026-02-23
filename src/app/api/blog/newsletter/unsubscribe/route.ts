import { NextResponse } from "next/server";
import { newsletterService } from "@/modules/blog/newsletter-service";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/blog?unsubscribed=false", request.url));
  }

  await newsletterService.unsubscribe(token);
  return NextResponse.redirect(new URL("/blog?unsubscribed=true", request.url));
}

