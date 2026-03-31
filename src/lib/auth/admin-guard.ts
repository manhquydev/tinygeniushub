/**
 * Admin Authorization Guard
 * Middleware functions for protecting admin-only API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { auth } from "@/lib/auth/better-auth";

/**
 * Check if an email is in the admin allowlist
 * @param email - User email to check
 * @returns boolean indicating admin status
 */
export function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return env.ADMIN_EMAILS.includes(normalizedEmail);
}

/**
 * Require admin authorization for a request
 * Returns null if authorized, or a Response with error if not
 * @param request - Next.js request object
 * @returns null if authorized, NextResponse with error otherwise
 */
export async function requireAdmin(
  request: NextRequest
): Promise<null | NextResponse> {
  // Get session using Better Auth
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = session.user.email;
  if (!userEmail || !isAdminEmail(userEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null; // No error, proceed
}

/**
 * Require admin authorization from server context (no request object)
 * Use this in server components or server actions
 * @returns null if authorized, NextResponse with error otherwise
 */
export async function requireAdminServer(): Promise<null | NextResponse> {
  // This variant is for server components
  // For simplicity, returns error since we need request headers
  return NextResponse.json(
    { error: "Admin authorization requires request context" },
    { status: 400 }
  );
}
