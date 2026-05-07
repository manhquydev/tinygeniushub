import type { AbVariant } from "@/lib/ab-test-constants";

export const PILOT_ATTRIBUTION_COOKIE = "ccth_attr_v1";

const OWNED_DOMAIN_SUFFIX = "tinygeniushubvn.tech";
const SOCIAL_SOURCES = new Set([
  "facebook",
  "fb",
  "instagram",
  "ig",
  "youtube",
  "linkedin",
  "x",
  "twitter",
]);
const SEARCH_SOURCES = new Set(["google", "bing", "yahoo", "coccoc", "duckduckgo"]);
const EMAIL_MEDIUMS = new Set(["email", "newsletter"]);
const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paid_search", "paid_social", "ads"]);

export type PilotAttributionChannel =
  | "paid_search"
  | "paid_social"
  | "organic_search"
  | "organic_social"
  | "email"
  | "affiliate"
  | "referral"
  | "direct"
  | "other";

export type PilotAttributionSnapshot = {
  channel: PilotAttributionChannel;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  sourceParam: string | null;
  refParam: string | null;
  gclid: string | null;
  fbclid: string | null;
  landingPath: string | null;
  referrerHost: string | null;
  experimentPricingVariant: AbVariant | null;
  experimentCoursesVariant: AbVariant | null;
  capturedAt: string;
};

type PilotAttributionState = {
  v: 1;
  firstTouch: PilotAttributionSnapshot | null;
  lastTouch: PilotAttributionSnapshot | null;
};

function normalizeValue(input: string | null | undefined, maxLength = 80): string | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  if (!value) return null;
  return value.slice(0, maxLength);
}

function normalizeExperimentVariant(input: string | null | undefined): AbVariant | null {
  if (!input) return null;
  return input === "A" || input === "B" ? input : null;
}

function parseHost(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    return normalizeValue(new URL(rawUrl).hostname, 160);
  } catch {
    return null;
  }
}

function isInternalHost(host: string | null): boolean {
  if (!host) return false;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(`.${OWNED_DOMAIN_SUFFIX}`) ||
    host === OWNED_DOMAIN_SUFFIX
  );
}

export function derivePilotAttributionChannel(input: {
  utmSource: string | null;
  utmMedium: string | null;
  sourceParam: string | null;
  refParam: string | null;
  gclid: string | null;
  fbclid: string | null;
  referrerHost: string | null;
}): PilotAttributionChannel {
  const source = input.utmSource ?? input.sourceParam;
  const medium = input.utmMedium;
  const hasPaidClickId = Boolean(input.gclid || input.fbclid);

  if (hasPaidClickId) {
    if (input.fbclid || (source && SOCIAL_SOURCES.has(source))) {
      return "paid_social";
    }
    return "paid_search";
  }

  if (medium && PAID_MEDIUMS.has(medium)) {
    if (source && SOCIAL_SOURCES.has(source)) {
      return "paid_social";
    }
    return "paid_search";
  }

  if (medium && EMAIL_MEDIUMS.has(medium)) {
    return "email";
  }

  if (medium === "affiliate") {
    return "affiliate";
  }

  if (source && SEARCH_SOURCES.has(source)) {
    return "organic_search";
  }

  if (source && SOCIAL_SOURCES.has(source)) {
    return "organic_social";
  }

  if (medium === "organic") {
    return "organic_search";
  }

  if (input.refParam) {
    return "referral";
  }

  if (input.referrerHost && !isInternalHost(input.referrerHost)) {
    return "referral";
  }

  if (source || medium) {
    return "other";
  }

  return "direct";
}

export function parsePilotAttributionSnapshot(raw: unknown): PilotAttributionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;

  const channelRaw = normalizeValue(typeof candidate.channel === "string" ? candidate.channel : null, 40);
  if (
    channelRaw !== "paid_search" &&
    channelRaw !== "paid_social" &&
    channelRaw !== "organic_search" &&
    channelRaw !== "organic_social" &&
    channelRaw !== "email" &&
    channelRaw !== "affiliate" &&
    channelRaw !== "referral" &&
    channelRaw !== "direct" &&
    channelRaw !== "other"
  ) {
    return null;
  }

  const capturedAt =
    typeof candidate.capturedAt === "string" && candidate.capturedAt.length > 0
      ? candidate.capturedAt
      : new Date().toISOString();

  return {
    channel: channelRaw,
    utmSource: normalizeValue(typeof candidate.utmSource === "string" ? candidate.utmSource : null),
    utmMedium: normalizeValue(typeof candidate.utmMedium === "string" ? candidate.utmMedium : null),
    utmCampaign: normalizeValue(typeof candidate.utmCampaign === "string" ? candidate.utmCampaign : null, 120),
    utmTerm: normalizeValue(typeof candidate.utmTerm === "string" ? candidate.utmTerm : null, 120),
    utmContent: normalizeValue(typeof candidate.utmContent === "string" ? candidate.utmContent : null, 120),
    sourceParam: normalizeValue(typeof candidate.sourceParam === "string" ? candidate.sourceParam : null),
    refParam: normalizeValue(typeof candidate.refParam === "string" ? candidate.refParam : null, 120),
    gclid: normalizeValue(typeof candidate.gclid === "string" ? candidate.gclid : null, 140),
    fbclid: normalizeValue(typeof candidate.fbclid === "string" ? candidate.fbclid : null, 140),
    landingPath: normalizeValue(typeof candidate.landingPath === "string" ? candidate.landingPath : null, 180),
    referrerHost: normalizeValue(typeof candidate.referrerHost === "string" ? candidate.referrerHost : null, 160),
    experimentPricingVariant: normalizeExperimentVariant(
      typeof candidate.experimentPricingVariant === "string"
        ? candidate.experimentPricingVariant
        : null,
    ),
    experimentCoursesVariant: normalizeExperimentVariant(
      typeof candidate.experimentCoursesVariant === "string"
        ? candidate.experimentCoursesVariant
        : null,
    ),
    capturedAt,
  };
}

function parsePilotAttributionState(rawCookie: string | null | undefined): PilotAttributionState | null {
  if (!rawCookie) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie)) as {
      v?: unknown;
      firstTouch?: unknown;
      lastTouch?: unknown;
    };

    if (parsed.v !== 1) {
      return null;
    }

    return {
      v: 1,
      firstTouch: parsePilotAttributionSnapshot(parsed.firstTouch ?? null),
      lastTouch: parsePilotAttributionSnapshot(parsed.lastTouch ?? null),
    };
  } catch {
    return null;
  }
}

export function serializePilotAttributionState(input: {
  firstTouch: PilotAttributionSnapshot | null;
  lastTouch: PilotAttributionSnapshot | null;
}) {
  const payload: PilotAttributionState = {
    v: 1,
    firstTouch: input.firstTouch,
    lastTouch: input.lastTouch,
  };
  return encodeURIComponent(JSON.stringify(payload));
}

export function capturePilotAttributionFromVisit(input: {
  pathname: string;
  searchParams: URLSearchParams;
  referer: string | null;
  allowDirect: boolean;
}): PilotAttributionSnapshot | null {
  const utmSource = normalizeValue(input.searchParams.get("utm_source"));
  const utmMedium = normalizeValue(input.searchParams.get("utm_medium"));
  const utmCampaign = normalizeValue(input.searchParams.get("utm_campaign"), 120);
  const utmTerm = normalizeValue(input.searchParams.get("utm_term"), 120);
  const utmContent = normalizeValue(input.searchParams.get("utm_content"), 120);
  const sourceParam = normalizeValue(input.searchParams.get("source"));
  const refParam = normalizeValue(input.searchParams.get("ref"), 120);
  const gclid = normalizeValue(input.searchParams.get("gclid"), 140);
  const fbclid = normalizeValue(input.searchParams.get("fbclid"), 140);
  const referrerHost = parseHost(input.referer);

  const hasSignal = Boolean(
    utmSource ||
      utmMedium ||
      utmCampaign ||
      utmTerm ||
      utmContent ||
      sourceParam ||
      refParam ||
      gclid ||
      fbclid,
  );

  if (!hasSignal && !input.allowDirect) {
    return null;
  }

  const channel = derivePilotAttributionChannel({
    utmSource,
    utmMedium,
    sourceParam,
    refParam,
    gclid,
    fbclid,
    referrerHost,
  });

  if (!hasSignal && !input.allowDirect && channel === "direct") {
    return null;
  }

  return {
    channel,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    sourceParam,
    refParam,
    gclid,
    fbclid,
    landingPath: normalizeValue(input.pathname, 180),
    referrerHost,
    experimentPricingVariant: null,
    experimentCoursesVariant: null,
    capturedAt: new Date().toISOString(),
  };
}

export function mergePilotAttributionState(input: {
  existingCookieValue: string | null | undefined;
  nextTouch: PilotAttributionSnapshot;
}) {
  const existing = parsePilotAttributionState(input.existingCookieValue);
  return {
    firstTouch: existing?.firstTouch ?? input.nextTouch,
    lastTouch: input.nextTouch,
  };
}

export function resolvePilotAttributionForCheckout(input: {
  cookieValue: string | null | undefined;
  referer: string | null;
  pricingVariant: AbVariant | null;
  coursesVariant: AbVariant | null;
}): PilotAttributionSnapshot | null {
  const existing = parsePilotAttributionState(input.cookieValue);
  if (existing?.lastTouch) {
    return {
      ...existing.lastTouch,
      experimentPricingVariant: input.pricingVariant,
      experimentCoursesVariant: input.coursesVariant,
    };
  }

  const referrerHost = parseHost(input.referer);
  const channel: PilotAttributionChannel =
    referrerHost && !isInternalHost(referrerHost) ? "referral" : "direct";

  return {
    channel,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    sourceParam: null,
    refParam: null,
    gclid: null,
    fbclid: null,
    landingPath: null,
    referrerHost,
    experimentPricingVariant: input.pricingVariant,
    experimentCoursesVariant: input.coursesVariant,
    capturedAt: new Date().toISOString(),
  };
}
