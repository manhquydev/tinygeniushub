import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logWarn } from "@/lib/observability/logger";
import { createAuditLog } from "@/modules/platform/audit-service";
import { DomainError } from "@/modules/platform/errors";
import {
  adminSecurityControlsSchema,
  applySecurityControlsToPolicy,
  clampRateLimitPolicy,
  getDefaultAdminSecurityControls,
  getDefaultRateLimitPolicies,
  getRateLimitPolicyDefinition,
  isRateLimitPolicyKey,
  rateLimitPolicyKeys,
  rateLimitPolicyOverridesSchema,
  type AdminSecurityControls,
  type RateLimitPolicyKey,
  type RateLimitPolicyValue,
  updateAdminRateLimitPoliciesSchema,
} from "@/modules/platform/security-policy";

const SECURITY_SETTINGS_ROW_ID = "default";
const CACHE_TTL_MS = 10_000;

type EffectivePolicyMap = Record<RateLimitPolicyKey, RateLimitPolicyValue>;

type EffectiveSecuritySettings = {
  policies: EffectivePolicyMap;
  controls: AdminSecurityControls;
};

let cachedSettings: EffectiveSecuritySettings | null = null;
let cacheExpiresAtMs = 0;
let inFlightLoad: Promise<EffectiveSecuritySettings> | null = null;
let settingsUnavailableLogged = false;

function invalidateSecurityPolicyCache() {
  cachedSettings = null;
  cacheExpiresAtMs = 0;
}

function withOverrides(defaults: EffectivePolicyMap, rawOverrides: unknown) {
  const parsed = rateLimitPolicyOverridesSchema.safeParse(rawOverrides);
  if (!parsed.success) {
    logWarn("security.rate_limit.override_invalid", {
      issues: parsed.error.issues,
    });
    return defaults;
  }

  const next: EffectivePolicyMap = { ...defaults };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!isRateLimitPolicyKey(key)) {
      continue;
    }
    next[key] = clampRateLimitPolicy(key, value);
  }
  return next;
}

function withControls(defaultControls: AdminSecurityControls, rawControls: unknown) {
  if (!rawControls) {
    return defaultControls;
  }

  const parsed = adminSecurityControlsSchema.safeParse(rawControls);
  if (!parsed.success) {
    logWarn("security.controls.invalid", {
      issues: parsed.error.issues,
    });
    return defaultControls;
  }

  return parsed.data;
}

async function loadEffectiveSettingsFromDb() {
  const defaultPolicies = getDefaultRateLimitPolicies();
  const defaultControls = getDefaultAdminSecurityControls();
  if (env.NODE_ENV === "test") {
    return {
      policies: defaultPolicies,
      controls: defaultControls,
    };
  }

  try {
    const row = await prisma.adminSecuritySettings.findUnique({
      where: { id: SECURITY_SETTINGS_ROW_ID },
      select: {
        rateLimitPolicies: true,
        securityControls: true,
      },
    });

    if (!row) {
      return {
        policies: defaultPolicies,
        controls: defaultControls,
      };
    }

    return {
      policies: withOverrides(defaultPolicies, row.rateLimitPolicies),
      controls: withControls(defaultControls, row.securityControls),
    };
  } catch (error) {
    if (!settingsUnavailableLogged) {
      settingsUnavailableLogged = true;
      logWarn("security.rate_limit.settings_unavailable", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return {
      policies: defaultPolicies,
      controls: defaultControls,
    };
  }
}

export async function getEffectiveSecuritySettings(options?: { forceRefresh?: boolean }) {
  const now = Date.now();
  if (!options?.forceRefresh && cachedSettings && cacheExpiresAtMs > now) {
    return cachedSettings;
  }

  if (!options?.forceRefresh && inFlightLoad) {
    return inFlightLoad;
  }

  inFlightLoad = loadEffectiveSettingsFromDb()
    .then((settings) => {
      cachedSettings = settings;
      cacheExpiresAtMs = Date.now() + CACHE_TTL_MS;
      return settings;
    })
    .finally(() => {
      inFlightLoad = null;
    });

  return inFlightLoad;
}

export async function getEffectiveRateLimitPolicies(options?: { forceRefresh?: boolean }) {
  const settings = await getEffectiveSecuritySettings(options);
  return settings.policies;
}

export async function getAdminSecurityControls(options?: { forceRefresh?: boolean }) {
  const settings = await getEffectiveSecuritySettings(options);
  return settings.controls;
}

export async function getRateLimitPolicy(key: RateLimitPolicyKey) {
  const settings = await getEffectiveSecuritySettings();
  return applySecurityControlsToPolicy(key, settings.policies[key], settings.controls);
}

function buildAdminRateLimitPolicyRows(input: EffectiveSecuritySettings) {
  return rateLimitPolicyKeys.map((key) => {
    const definition = getRateLimitPolicyDefinition(key);
    const configured = input.policies[key];
    const effective = applySecurityControlsToPolicy(key, configured, input.controls);

    return {
      key,
      label: definition.label,
      description: definition.description,
      keyStrategy: definition.keyStrategy,
      defaultLimit: definition.defaultLimit,
      defaultWindowMs: definition.defaultWindowMs,
      minLimit: definition.minLimit,
      maxLimit: definition.maxLimit,
      minWindowMs: definition.minWindowMs,
      maxWindowMs: definition.maxWindowMs,
      currentLimit: configured.limit,
      currentWindowMs: configured.windowMs,
      effectiveLimit: effective.limit,
      effectiveWindowMs: effective.windowMs,
    };
  });
}

export async function getAdminRateLimitPolicyRows() {
  const settings = await getEffectiveSecuritySettings();
  return buildAdminRateLimitPolicyRows(settings);
}

export async function getAdminSecuritySettings() {
  const settings = await getEffectiveSecuritySettings();
  return {
    controls: settings.controls,
    policies: buildAdminRateLimitPolicyRows(settings),
  };
}

export async function updateAdminRateLimitPolicies(params: {
  actorId: string;
  input: unknown;
}) {
  const payload = updateAdminRateLimitPoliciesSchema.parse(params.input);
  const current = await getEffectiveSecuritySettings();

  const sanitizedOverrides = Object.entries(payload.overrides).reduce<Record<string, RateLimitPolicyValue>>(
    (acc, [rawKey, value]) => {
      if (!isRateLimitPolicyKey(rawKey)) {
        return acc;
      }
      acc[rawKey] = clampRateLimitPolicy(rawKey, value);
      return acc;
    },
    {},
  );

  const nextControls = payload.controls ?? current.controls;

  try {
    await prisma.adminSecuritySettings.upsert({
      where: { id: SECURITY_SETTINGS_ROW_ID },
      update: {
        rateLimitPolicies: sanitizedOverrides,
        securityControls: nextControls,
        updatedByActorId: params.actorId,
      },
      create: {
        id: SECURITY_SETTINGS_ROW_ID,
        rateLimitPolicies: sanitizedOverrides,
        securityControls: nextControls,
        updatedByActorId: params.actorId,
      },
    });
  } catch (error) {
    logWarn("security.rate_limit.settings_write_failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw new DomainError(
      "Security settings store unavailable. Run latest database migrations.",
      503,
      "SECURITY_SETTINGS_UNAVAILABLE",
    );
  }

  await createAuditLog({
    actorType: "admin",
    actorId: params.actorId,
    action: "security.rate_limit.policies.updated",
    resourceType: "security_rate_limit_policy",
    resourceId: SECURITY_SETTINGS_ROW_ID,
    metadata: {
      reason: payload.reason ?? null,
      overrides: sanitizedOverrides,
      controls: nextControls,
    },
  });

  invalidateSecurityPolicyCache();
  return getAdminSecuritySettings();
}
