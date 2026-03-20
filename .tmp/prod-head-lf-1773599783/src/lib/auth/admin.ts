import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/modules/admin/admin-auth-service";
import { env } from "@/lib/env";

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
  const session = await requireAdminSession(allowedRoles);
  return session.user;
}
