/**
 * Microsoft Clarity Data Export API Route
 * Admin-only endpoint for exporting Clarity session data
 * GET /api/clarity/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createExportClient } from "@/lib/analytics/clarity/api-client";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { env } from "@/lib/env";

/**
 * GET handler for Clarity data export
 * Requires admin authentication
 * Query params: startDate, endDate (ISO 8601 format)
 */
export async function GET(request: NextRequest) {
  try {
    // Admin authorization check
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get project ID from environment
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

    // Validate required parameters
    if (!startDate || !endDate) {
      return fail("Missing required parameters: startDate, endDate", 400);
    }

    // Validate date format (basic ISO 8601 check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return fail(
        "Invalid date format. Use YYYY-MM-DD format (e.g., 2026-03-01)",
        400
      );
    }

    // Check project configuration
    if (!projectId) {
      return fail("Clarity project not configured", 503);
    }

    // Create export client
    const client = createExportClient(projectId);
    if (!client) {
      return fail(
        "Data export not configured. CLARITY_DATA_EXPORT_TOKEN required.",
        503
      );
    }

    // Fetch session data from Clarity
    const sessions = await client.exportSessions({
      startDate,
      endDate,
      format: "json",
    });

    // Return success response with metadata
    return ok({
      success: true,
      data: sessions,
      meta: {
        startDate,
        endDate,
        count: sessions.length,
        projectId,
      },
    });
  } catch (error) {
    console.error("Clarity export error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Clarity API errors
      if (errorMessage.includes("clarity export failed")) {
        return fail("Failed to export data from Clarity API", 502, {
          details: error.message,
        });
      }

      // Network/connection errors
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        return fail("Network error connecting to Clarity API", 502);
      }
    }

    // Generic error handling
    return handleRouteError(error, { route: "/api/clarity/export" });
  }
}
