/**
 * Microsoft Clarity Dashboard Service
 * Provides dashboard data and links for Clarity integration
 */

import { env } from "@/lib/env";

export interface ClarityDashboardData {
  projectId: string;
  sessions24h: number;
  recordingsAvailable: boolean;
  heatmapsAvailable: boolean;
}

export async function getClarityDashboardData(): Promise<ClarityDashboardData | null> {
  const projectId = env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!projectId) return null;

  // Note: Clarity doesn't have a simple "stats" API, so we'll return config
  // Real data would need to be fetched from Clarity dashboard via iframe
  return {
    projectId,
    sessions24h: 0, // Would need to fetch from export API
    recordingsAvailable: true,
    heatmapsAvailable: true,
  };
}
