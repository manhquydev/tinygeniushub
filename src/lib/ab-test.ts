"use client";

import { AB_COURSES_COOKIE, AB_PRICING_COOKIE, type AbVariant } from "@/lib/ab-test-constants";

function readAbVariantCookie(cookieName: string): AbVariant | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=([AB])`));
  return (match?.[1] as AbVariant) ?? null;
}

/** Read the A/B pricing variant assigned by middleware.
 *  Returns "A" | "B" | null (null = SSR / cookie not yet set) */
export function useAbPricingVariant(): AbVariant | null {
  return readAbVariantCookie(AB_PRICING_COOKIE);
}

/** Read the A/B courses storefront variant assigned by middleware.
 *  Returns "A" | "B" | null (null = SSR / cookie not yet set) */
export function useAbCoursesVariant(): AbVariant | null {
  return readAbVariantCookie(AB_COURSES_COOKIE);
}
