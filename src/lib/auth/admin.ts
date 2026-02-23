import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getAuthenticatedParentFromRequest, getAuthenticatedParentFromServerCookie } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { DomainError } from "@/modules/platform/errors";

export function isAdminEmail(email: string, adminEmails = env.ADMIN_EMAILS) {
  const normalizedEmail = email.trim().toLowerCase();
  return adminEmails.includes(normalizedEmail);
}

export function isParentAdmin(parent: { email: string }) {
  return isAdminEmail(parent.email);
}

export async function requireAdminParent() {
  const parent = await getAuthenticatedParentFromServerCookie();

  if (!parent) {
    redirect("/auth/login");
  }

  if (!isParentAdmin(parent)) {
    redirect("/parent/dashboard");
  }

  return parent;
}

export async function requireAdminFromRequest(request: NextRequest) {
  const parent = await getAuthenticatedParentFromRequest(request);
  if (!parent) {
    throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!isParentAdmin(parent)) {
    throw new DomainError("Admin access required", 403, "ADMIN_ONLY");
  }

  return parent;
}
