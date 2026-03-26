import { describe, expect, it } from "vitest";
import { LEGAL_POLICY_VERSION } from "@/lib/legal/legal-policy-version";
import {
  buildCookieConsentState,
  hasAnalyticsConsent,
  hasMarketingConsent,
  parseCookieConsent,
  serializeCookieConsent,
} from "@/lib/legal/cookie-consent";

describe("cookie consent", () => {
  it("serializes and parses consent payload", () => {
    const state = buildCookieConsentState({
      analytics: true,
      marketing: false,
    });

    const parsed = parseCookieConsent(serializeCookieConsent(state));

    expect(parsed).toEqual(
      expect.objectContaining({
        version: LEGAL_POLICY_VERSION,
        necessary: true,
        analytics: true,
        marketing: false,
      }),
    );
  });

  it("accepts analytics and marketing only when current version matches", () => {
    const current = buildCookieConsentState({ analytics: true, marketing: true });
    const stale = {
      ...current,
      version: "2025-01-01",
    };

    expect(hasAnalyticsConsent(serializeCookieConsent(current))).toBe(true);
    expect(hasMarketingConsent(serializeCookieConsent(current))).toBe(true);
    expect(hasAnalyticsConsent(serializeCookieConsent(stale))).toBe(false);
    expect(hasMarketingConsent(serializeCookieConsent(stale))).toBe(false);
  });
});

