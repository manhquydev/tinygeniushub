"use client";

/** Read the A/B pricing variant assigned by middleware.
 *  Returns "A" | "B" | null (null = SSR / cookie not yet set) */
export function useAbPricingVariant(): "A" | "B" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)ab_pricing_v=([AB])/);
  return (match?.[1] as "A" | "B") ?? null;
}
