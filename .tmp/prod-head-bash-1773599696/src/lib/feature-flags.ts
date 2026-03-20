/**
 * Feature flags helper.
 * Checks DB-backed FeatureFlag table and per-child adaptive flag.
 */

import { prisma } from "@/lib/db";

export const FEATURE_FLAGS = {
  ADAPTIVE_ENGINE_ENABLED: "ADAPTIVE_ENGINE_ENABLED",
  KID_SKY_GARDEN_MVP: "KID_SKY_GARDEN_MVP",
} as const;

/**
 * Check if a global feature flag is enabled in DB.
 */
export async function isFeatureFlagEnabled(key: string): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    return flag?.enabled ?? false;
  } catch {
    return false;
  }
}

/**
 * Check if adaptive engine is enabled globally.
 */
export async function isAdaptiveEngineEnabled(): Promise<boolean> {
  return isFeatureFlagEnabled(FEATURE_FLAGS.ADAPTIVE_ENGINE_ENABLED);
}

/**
 * Check if kid today page should use the new Sky Garden MVP scene.
 */
export async function isKidSkyGardenMvpEnabled(): Promise<boolean> {
  return isFeatureFlagEnabled(FEATURE_FLAGS.KID_SKY_GARDEN_MVP);
}

/**
 * Check if adaptive engine is enabled for a specific child.
 * Requires global flag to also be enabled.
 */
export async function isAdaptiveEnabledForChild(childId: string): Promise<boolean> {
  const [globalEnabled, child] = await Promise.all([
    isAdaptiveEngineEnabled(),
    prisma.childProfile.findUnique({ where: { id: childId }, select: { adaptiveEnabled: true } }),
  ]);
  if (!globalEnabled) return false;
  return child?.adaptiveEnabled ?? false;
}
