import { z } from "zod";
import { normalizeIpNetwork } from "@/lib/network/ip-network";

export type RateLimitPolicyDefinition = {
  label: string;
  description: string;
  keyStrategy: string;
  defaultLimit: number;
  defaultWindowMs: number;
  minLimit: number;
  maxLimit: number;
  minWindowMs: number;
  maxWindowMs: number;
};

export const rateLimitPolicyCatalog = {
  "auth.login.ip": {
    label: "Auth login / IP",
    description: "Limit repeated login attempts from a single IP address.",
    keyStrategy: "ip",
    defaultLimit: 20,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 5,
    maxLimit: 300,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60,
  },
  "auth.login.email": {
    label: "Auth login / email",
    description: "Limit repeated login attempts per email identity bucket.",
    keyStrategy: "email_bucket",
    defaultLimit: 15,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 3,
    maxLimit: 200,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60,
  },
  "auth.signup.ip": {
    label: "Auth signup / IP",
    description: "Limit account signup attempts from a single IP address.",
    keyStrategy: "ip",
    defaultLimit: 5,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 1,
    maxLimit: 60,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60,
  },
  "auth.signup.email": {
    label: "Auth signup / email",
    description: "Limit signup retries per email identity bucket.",
    keyStrategy: "email_bucket",
    defaultLimit: 4,
    defaultWindowMs: 1000 * 60 * 60,
    minLimit: 1,
    maxLimit: 30,
    minWindowMs: 1000 * 60 * 5,
    maxWindowMs: 1000 * 60 * 60 * 24,
  },
  "auth.logout.ip": {
    label: "Auth logout / IP",
    description: "Protect logout endpoint from burst abuse.",
    keyStrategy: "ip",
    defaultLimit: 120,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 10,
    maxLimit: 1000,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "admin.mutation.ip": {
    label: "Admin mutation / IP",
    description: "Protect admin mutation endpoints from abusive request bursts.",
    keyStrategy: "ip",
    defaultLimit: 120,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 5,
    maxLimit: 1200,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "children.mutation.ip": {
    label: "Child profile mutation / IP",
    description: "Limit child profile create/update/delete bursts from one IP.",
    keyStrategy: "ip",
    defaultLimit: 90,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 10,
    maxLimit: 900,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "children.mutation.parent": {
    label: "Child profile mutation / parent",
    description: "Limit child profile create/update/delete retries per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 60,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 5,
    maxLimit: 600,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "referrals.claim.ip": {
    label: "Referral claim / IP",
    description: "Protect referral claim endpoint from repeated claim attempts from one IP.",
    keyStrategy: "ip",
    defaultLimit: 30,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 3,
    maxLimit: 300,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "referrals.claim.parent": {
    label: "Referral claim / parent",
    description: "Limit referral claim retries per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 15,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 2,
    maxLimit: 150,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "learning.watch.session.ip": {
    label: "Watch session / IP",
    description: "Protect watch-session creation endpoint from burst abuse.",
    keyStrategy: "ip",
    defaultLimit: 120,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 20,
    maxLimit: 1200,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "learning.watch.session.parent": {
    label: "Watch session / parent",
    description: "Limit concurrent-like session creation patterns per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 60,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 10,
    maxLimit: 600,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "learning.watch.heartbeat.ip": {
    label: "Watch heartbeat / IP",
    description: "Guard heartbeat endpoint against high-frequency flooding from an IP.",
    keyStrategy: "ip",
    defaultLimit: 240,
    defaultWindowMs: 1000 * 60,
    minLimit: 40,
    maxLimit: 2400,
    minWindowMs: 1000 * 10,
    maxWindowMs: 1000 * 60 * 10,
  },
  "learning.watch.heartbeat.parent": {
    label: "Watch heartbeat / parent",
    description: "Limit heartbeat spam from one parent account across children/lessons.",
    keyStrategy: "parent_bucket",
    defaultLimit: 120,
    defaultWindowMs: 1000 * 60,
    minLimit: 20,
    maxLimit: 1200,
    minWindowMs: 1000 * 10,
    maxWindowMs: 1000 * 60 * 10,
  },
  "learning.watch.complete.ip": {
    label: "Watch complete / IP",
    description: "Limit completion attempts from a single IP address.",
    keyStrategy: "ip",
    defaultLimit: 80,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 10,
    maxLimit: 800,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "learning.watch.complete.parent": {
    label: "Watch complete / parent",
    description: "Limit watch completion retries per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 40,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 5,
    maxLimit: 400,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "billing.webhook.mock.ip": {
    label: "Webhook ingest / IP",
    description: "Throttle webhook ingest bursts before signature validation.",
    keyStrategy: "ip",
    defaultLimit: 180,
    defaultWindowMs: 1000 * 60,
    minLimit: 20,
    maxLimit: 5000,
    minWindowMs: 1000 * 10,
    maxWindowMs: 1000 * 60 * 60,
  },
  "billing.webhook.stripe.ip": {
    label: "Stripe webhook ingest / IP",
    description: "Throttle Stripe webhook ingest bursts before signature validation.",
    keyStrategy: "ip",
    defaultLimit: 180,
    defaultWindowMs: 1000 * 60,
    minLimit: 20,
    maxLimit: 5000,
    minWindowMs: 1000 * 10,
    maxWindowMs: 1000 * 60 * 60,
  },
  "billing.checkout.ip": {
    label: "Checkout / IP",
    description: "Limit checkout session creation spikes from one IP.",
    keyStrategy: "ip",
    defaultLimit: 30,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 5,
    maxLimit: 300,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "billing.checkout.parent": {
    label: "Checkout / parent",
    description: "Limit checkout retries per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 20,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 3,
    maxLimit: 200,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "reports.generate.ip": {
    label: "Report generate / IP",
    description: "Protect report generation endpoint from repeated expensive calls.",
    keyStrategy: "ip",
    defaultLimit: 30,
    defaultWindowMs: 1000 * 60 * 60,
    minLimit: 3,
    maxLimit: 300,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60 * 24,
  },
  "reports.generate.parent": {
    label: "Report generate / parent",
    description: "Limit report generation per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 12,
    defaultWindowMs: 1000 * 60 * 60,
    minLimit: 1,
    maxLimit: 120,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60 * 24,
  },
  "reports.sendEmail.ip": {
    label: "Report email / IP",
    description: "Protect report email delivery endpoint from abuse bursts.",
    keyStrategy: "ip",
    defaultLimit: 20,
    defaultWindowMs: 1000 * 60 * 60,
    minLimit: 2,
    maxLimit: 200,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60 * 24,
  },
  "reports.sendEmail.parent": {
    label: "Report email / parent",
    description: "Limit report email dispatch retries per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 8,
    defaultWindowMs: 1000 * 60 * 60,
    minLimit: 1,
    maxLimit: 80,
    minWindowMs: 1000 * 60,
    maxWindowMs: 1000 * 60 * 60 * 24,
  },
  "evidence.uploadUrl.ip": {
    label: "Upload URL / IP",
    description: "Throttle signed upload URL issuance from a single IP.",
    keyStrategy: "ip",
    defaultLimit: 180,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 10,
    maxLimit: 1800,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "evidence.uploadUrl.parent": {
    label: "Upload URL / parent",
    description: "Throttle signed upload URL issuance per parent account.",
    keyStrategy: "parent_bucket",
    defaultLimit: 120,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 10,
    maxLimit: 1200,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "storage.mockUpload.ip": {
    label: "Mock upload ingest / IP",
    description: "Throttle signed mock upload ingress by source IP.",
    keyStrategy: "ip",
    defaultLimit: 300,
    defaultWindowMs: 1000 * 60 * 10,
    minLimit: 20,
    maxLimit: 3000,
    minWindowMs: 1000 * 30,
    maxWindowMs: 1000 * 60 * 60,
  },
  "health.ready.ip": {
    label: "Readiness / IP",
    description: "Reduce dependency pressure from repeated readiness probes.",
    keyStrategy: "ip",
    defaultLimit: 90,
    defaultWindowMs: 1000 * 60,
    minLimit: 10,
    maxLimit: 1000,
    minWindowMs: 1000 * 10,
    maxWindowMs: 1000 * 60 * 10,
  },
} as const satisfies Record<string, RateLimitPolicyDefinition>;

export type RateLimitPolicyKey = keyof typeof rateLimitPolicyCatalog;

export type RateLimitPolicyValue = {
  limit: number;
  windowMs: number;
};

export const ddosModeSchema = z.enum(["normal", "elevated", "emergency"]);
export type DdosMode = z.infer<typeof ddosModeSchema>;

const ipNetworkEntrySchema = z.string().trim().superRefine((value, ctx) => {
  if (value.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "IP/CIDR entry cannot be empty",
    });
    return;
  }

  if (!normalizeIpNetwork(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid IP/CIDR entry: ${value}`,
    });
  }
});

const ipNetworkListSchema = z
  .array(ipNetworkEntrySchema)
  .max(500)
  .transform((value) => {
    const normalized = value
      .map((entry) => normalizeIpNetwork(entry))
      .filter((entry): entry is string => Boolean(entry));

    return Array.from(new Set(normalized));
  });

export const adminSecurityControlsSchema = z.object({
  ddosMode: ddosModeSchema.default("normal"),
  globalLimitMultiplier: z.coerce.number().min(0.2).max(1).default(1),
  blockedIpCidrs: ipNetworkListSchema.default([]),
  readinessAllowlistCidrs: ipNetworkListSchema.default([]),
});

export type AdminSecurityControls = z.infer<typeof adminSecurityControlsSchema>;

export const ddosModeRateLimitMultipliers: Record<DdosMode, number> = {
  normal: 1,
  elevated: 0.8,
  emergency: 0.6,
};

export const rateLimitPolicyKeys = Object.keys(rateLimitPolicyCatalog) as RateLimitPolicyKey[];
const rateLimitPolicyKeySet = new Set(rateLimitPolicyKeys);

const rateLimitPolicyOverrideEntrySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100_000),
  windowMs: z.coerce.number().int().min(1000).max(1000 * 60 * 60 * 24),
});

export const rateLimitPolicyOverridesSchema = z
  .record(z.string(), rateLimitPolicyOverrideEntrySchema)
  .superRefine((value, ctx) => {
    for (const key of Object.keys(value)) {
      if (!rateLimitPolicyKeySet.has(key as RateLimitPolicyKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown rate-limit policy key: ${key}`,
        });
      }
    }
  });

export const updateAdminRateLimitPoliciesSchema = z.object({
  overrides: rateLimitPolicyOverridesSchema,
  controls: adminSecurityControlsSchema.optional(),
  reason: z.string().trim().min(8).max(300).optional(),
});

export function isRateLimitPolicyKey(value: string): value is RateLimitPolicyKey {
  return rateLimitPolicyKeySet.has(value as RateLimitPolicyKey);
}

export function getDefaultRateLimitPolicies() {
  return rateLimitPolicyKeys.reduce<Record<RateLimitPolicyKey, RateLimitPolicyValue>>((acc, key) => {
    const definition = rateLimitPolicyCatalog[key];
    acc[key] = {
      limit: definition.defaultLimit,
      windowMs: definition.defaultWindowMs,
    };
    return acc;
  }, {} as Record<RateLimitPolicyKey, RateLimitPolicyValue>);
}

export function getDefaultAdminSecurityControls(): AdminSecurityControls {
  return {
    ddosMode: "normal",
    globalLimitMultiplier: 1,
    blockedIpCidrs: [],
    readinessAllowlistCidrs: [],
  };
}

export function clampRateLimitPolicy(key: RateLimitPolicyKey, input: RateLimitPolicyValue): RateLimitPolicyValue {
  const definition = rateLimitPolicyCatalog[key];
  return {
    limit: Math.min(Math.max(input.limit, definition.minLimit), definition.maxLimit),
    windowMs: Math.min(Math.max(input.windowMs, definition.minWindowMs), definition.maxWindowMs),
  };
}

export function getRateLimitPolicyDefinition(key: RateLimitPolicyKey) {
  return rateLimitPolicyCatalog[key];
}

export function applySecurityControlsToPolicy(
  key: RateLimitPolicyKey,
  policy: RateLimitPolicyValue,
  controls: AdminSecurityControls,
): RateLimitPolicyValue {
  const modeMultiplier = ddosModeRateLimitMultipliers[controls.ddosMode];
  const compositeMultiplier = modeMultiplier * controls.globalLimitMultiplier;
  const scaledLimit = Math.max(1, Math.floor(policy.limit * compositeMultiplier));

  return clampRateLimitPolicy(key, {
    limit: scaledLimit,
    windowMs: policy.windowMs,
  });
}
