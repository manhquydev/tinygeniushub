import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/modules/admin/admin-auth-service";
import { env } from "@/lib/env";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

export function isAdminEmail(email: string, adminEmails = env.ADMIN_EMAILS) {
  const normalizedEmail = email.trim().toLowerCase();
  return adminEmails.includes(normalizedEmail);
}

export function isParentAdmin(parent: { email: string }) {
  return isAdminEmail(parent.email);
}

export async function requireAdminParent() {
  const session = await requireAdminSession().catch(() => null);

  if (!session) {
    redirect("/admin/login");
  }

  return session.user;
}

export async function requireAdminFromRequest(
  request: NextRequest,
  allowedRoles?: string[],
) {
  await assertRequestAllowedBySecurityControls(request);
  const session = await requireAdminSession(allowedRoles);
  return session.user;
}

/**
 * Server-page gate for surfaces restricted to SUPER_ADMIN (e.g. staff, security,
 * audit log, organizations, impersonation, skills mapping, feature flags).
 * Redirects non-super-admins to /admin instead of exposing the page.
 */
export async function requireSuperAdminParent() {
  const admin = await requireAdminParent();
  if (admin.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  return admin;
}

/** API-route gate for handlers restricted to SUPER_ADMIN. */
export async function requireSuperAdmin(request: NextRequest) {
  return requireAdminFromRequest(request, ["SUPER_ADMIN"]);
}
