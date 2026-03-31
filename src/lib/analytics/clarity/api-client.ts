/**
 * Microsoft Clarity Data Export API Client
 * Provides JWT-based authentication for accessing Clarity export endpoints
 */

import { CLARITY_DATA_EXPORT_CONFIG } from "./config";
import type { ClarityExportParams, ClaritySession } from "./types";

const BASE_URL = "https://clarity.microsoft.com/api/export";

export class ClarityExportClient {
  private token: string;
  private projectId: string;

  constructor(token: string, projectId: string) {
    this.token = token;
    this.projectId = projectId;
  }

  /**
   * Export session data from Clarity
   * @param params - Date range and format parameters
   * @returns Array of Clarity sessions
   * @throws Error if the API request fails
   */
  async exportSessions(params: ClarityExportParams): Promise<ClaritySession[]> {
    const url = new URL(`${BASE_URL}/sessions`);
    url.searchParams.set("projectId", this.projectId);
    url.searchParams.set("startDate", params.startDate);
    url.searchParams.set("endDate", params.endDate);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Clarity export failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Export heatmap data for a specific URL
   * @param url - The page URL to get heatmap data for
   * @param device - Device type (desktop, tablet, mobile)
   * @returns Heatmap data object
   * @throws Error if the API request fails
   */
  async exportHeatmaps(
    url: string,
    device: "desktop" | "tablet" | "mobile" = "desktop"
  ): Promise<unknown> {
    const apiUrl = new URL(`${BASE_URL}/heatmaps`);
    apiUrl.searchParams.set("projectId", this.projectId);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("device", device);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Heatmap export failed: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Factory function using environment config
 * Returns null if the export token is not configured
 * @param projectId - Clarity project ID
 * @returns ClarityExportClient instance or null
 */
export function createExportClient(
  projectId: string
): ClarityExportClient | null {
  const token = CLARITY_DATA_EXPORT_CONFIG.token;
  if (!token) {
    return null;
  }
  return new ClarityExportClient(token, projectId);
}
