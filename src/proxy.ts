import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AB_COURSES_COOKIE,
  AB_PRICING_COOKIE,
  AB_VARIANTS,
  type AbVariant,
} from "@/lib/ab-test-constants";
import {
  PILOT_ATTRIBUTION_COOKIE,
  capturePilotAttributionFromVisit,
  mergePilotAttributionState,
  serializePilotAttributionState,
} from "@/modules/courses/pilot-attribution";
import { COOKIE_CONSENT_COOKIE_NAME, hasAnalyticsConsent } from "@/lib/legal/cookie-consent";

/** Assign A/B variant cookie if not already set. */
function assignAbVariantCookie(
  request: NextRequest,
  response: NextResponse,
  cookieName: string,
): void {
  if (request.cookies.has(cookieName)) return;
  const variant: AbVariant = AB_VARIANTS[Math.random() < 0.5 ? 0 : 1];
  response.cookies.set(cookieName, variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    sameSite: "lax",
    httpOnly: false, // readable by client analytics
  });
}

function shouldCaptureAttribution(request: NextRequest, pathname: string) {
  if (request.method !== "GET") return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.includes(".")) return false;
  return true;
}

function shouldManageAnalyticsCookies(request: NextRequest, pathname: string) {
  if (!shouldCaptureAttribution(request, pathname)) return false;
  const acceptHeader = request.headers.get("accept") ?? "";
  return acceptHeader.includes("text/html");
}

function assignAttributionCookie(request: NextRequest, response: NextResponse, pathname: string): void {
  if (!shouldCaptureAttribution(request, pathname)) return;

  const existingCookieValue = request.cookies.get(PILOT_ATTRIBUTION_COOKIE)?.value ?? null;
  const nextTouch = capturePilotAttributionFromVisit({
    pathname,
    searchParams: request.nextUrl.searchParams,
    referer: request.headers.get("referer"),
    allowDirect: !existingCookieValue,
  });

  if (!nextTouch) return;

  const merged = mergePilotAttributionState({
    existingCookieValue,
    nextTouch,
  });

  response.cookies.set(PILOT_ATTRIBUTION_COOKIE, serializePilotAttributionState(merged), {
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

function clearAnalyticsCookies(request: NextRequest, response: NextResponse) {
  response.cookies.delete(AB_PRICING_COOKIE);
  response.cookies.delete(AB_COURSES_COOKIE);
  response.cookies.delete(PILOT_ATTRIBUTION_COOKIE);
  response.cookies.delete("_ga");
  response.cookies.delete("_gid");
  response.cookies.delete("_gat");
  response.cookies.delete("_fbp");
  response.cookies.delete("_fbc");

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("_ga_")) {
      response.cookies.delete(cookie.name);
    }
  }
}

export function proxy(request: NextRequest) {
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
      headers: (() => {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-next-pathname", pathname);
        return requestHeaders;
      })(),
    },
  });

  const rawConsent = request.cookies.get(COOKIE_CONSENT_COOKIE_NAME)?.value ?? null;
  const analyticsAllowed = hasAnalyticsConsent(rawConsent);

  if (shouldManageAnalyticsCookies(request, pathname)) {
    if (analyticsAllowed) {
      // Assign A/B pricing variant on first homepage visit.
      if (pathname === "/") {
        assignAbVariantCookie(request, response, AB_PRICING_COOKIE);
      }

      // Assign A/B courses storefront variant on courses touchpoints.
      if (pathname === "/" || pathname === "/courses" || pathname.startsWith("/courses/")) {
        assignAbVariantCookie(request, response, AB_COURSES_COOKIE);
      }

      assignAttributionCookie(request, response, pathname);
    } else {
      // No consent (or outdated consent) must not keep non-essential cookies.
      clearAnalyticsCookies(request, response);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
