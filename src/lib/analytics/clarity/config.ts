/**
 * Microsoft Clarity configuration
 * Uses validated env from central env.ts for type safety
 */

import { env } from "@/lib/env";

export const CLARITY_PROJECT_ID = env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

/**
 * Check if Clarity tracking is enabled
 */
export function isClarityEnabled(): boolean {
  return typeof CLARITY_PROJECT_ID === 'string' && 
         CLARITY_PROJECT_ID.length > 0;
}

/**
 * Get the configured project ID
 * Throws if not configured and strict mode enabled
 */
export function getProjectId(strict = false): string | null {
  if (!CLARITY_PROJECT_ID && strict) {
    throw new Error('NEXT_PUBLIC_CLARITY_PROJECT_ID is not configured');
  }
  return CLARITY_PROJECT_ID ?? null;
}

/**
 * Data export configuration (server-side)
 * These should NOT use NEXT_PUBLIC_ prefix
 */
export const CLARITY_DATA_EXPORT_CONFIG = {
  token: env.CLARITY_DATA_EXPORT_TOKEN,  // Server-side only, validated by env.ts
  baseUrl: 'https://clarity.microsoft.com/api/export',
} as const;

/**
 * Check if data export API is configured
 */
export function isDataExportEnabled(): boolean {
  return !!CLARITY_DATA_EXPORT_CONFIG.token;
}
