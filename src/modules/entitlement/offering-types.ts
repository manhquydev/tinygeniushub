export const OFFERING_KINDS = ["RECURRING", "ONE_TIME_PROGRAM", "ONE_TIME_LEVEL"] as const;
export type OfferingKind = (typeof OFFERING_KINDS)[number];

export const ENTITLEMENT_STATUSES = ["ACTIVE", "GRACE", "CANCELED", "EXPIRED"] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export const LIVE_ENTITLEMENT_STATUSES = ["ACTIVE", "GRACE"] as const;
export type LiveEntitlementStatus = (typeof LIVE_ENTITLEMENT_STATUSES)[number];

export const PLATFORM_PASS_KEY = "platform:pass";
export const PLATFORM_PASS_CODE = "platform-pass";

export const SEED_OFFERINGS: ReadonlyArray<{
  code: string;
  kind: OfferingKind;
  catalogKey: string;
}> = [
  { code: PLATFORM_PASS_CODE, kind: "RECURRING", catalogKey: PLATFORM_PASS_KEY },
  { code: "track-english", kind: "ONE_TIME_PROGRAM", catalogKey: "track:ENGLISH" },
  { code: "track-math", kind: "ONE_TIME_PROGRAM", catalogKey: "track:MATH" },
];
