import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AB_PRICING_COOKIE = "ab_pricing_v";
const AB_VARIANTS = ["A", "B"] as const;

/** Assign A/B variant cookie deterministically if not already set. */
function assignAbVariant(request: NextRequest, response: NextResponse): void {
  if (request.cookies.has(AB_PRICING_COOKIE)) return;
  const variant = AB_VARIANTS[Math.random() < 0.5 ? 0 : 1];
  response.cookies.set(AB_PRICING_COOKIE, variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    sameSite: "lax",
    httpOnly: false, // readable by client analytics
  });
}

export function middleware(request: NextRequest) {
  const maintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;

  if (maintenance && pathname !== "/maintenance") {
    if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "x-next-pathname": pathname,
      }),
    },
  });

  // Assign A/B pricing variant on first visit to pricing or homepage
  if (pathname === "/" || pathname === "/pricing") {
    assignAbVariant(request, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
