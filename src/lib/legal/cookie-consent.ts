import { LEGAL_POLICY_VERSION } from "@/lib/legal/legal-policy-version";

export const COOKIE_CONSENT_COOKIE_NAME = "ccth_cookie_consent_v1";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export type CookieConsentState = {
  version: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

function isValidDateString(input: string) {
  return Number.isFinite(Date.parse(input));
}

export function buildCookieConsentState(input: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsentState {
  return {
    version: LEGAL_POLICY_VERSION,
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function serializeCookieConsent(state: CookieConsentState) {
  return encodeURIComponent(JSON.stringify(state));
}

export function parseCookieConsent(raw: string | null | undefined): CookieConsentState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<CookieConsentState>;

    if (typeof parsed.version !== "string" || parsed.version.length === 0) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.marketing !== "boolean") return null;
    if (typeof parsed.updatedAt !== "string" || !isValidDateString(parsed.updatedAt)) return null;

    return {
      version: parsed.version,
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function isCookieConsentCurrentVersion(state: CookieConsentState | null | undefined) {
  return state?.version === LEGAL_POLICY_VERSION;
}

export function hasAnalyticsConsent(raw: string | null | undefined) {
  const parsed = parseCookieConsent(raw);
  return parsed !== null && isCookieConsentCurrentVersion(parsed) && parsed.analytics === true;
}

export function hasMarketingConsent(raw: string | null | undefined) {
  const parsed = parseCookieConsent(raw);
  return parsed !== null && isCookieConsentCurrentVersion(parsed) && parsed.marketing === true;
}
