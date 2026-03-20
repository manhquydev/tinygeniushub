import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getImpersonatedParentIdFromCookieHeader } from "@/lib/auth/impersonation";

export const SESSION_COOKIE_NAME = "ccth_session";

type SessionUser = {
  id: string;
  email: string;
  parentId?: string | null;
};

function isAdminSessionEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return env.ADMIN_EMAILS.includes(normalizedEmail);
}

async function resolveAuthenticatedParentFromHeaders(requestHeaders: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    return null;
  }

  const user = session.user as SessionUser;
  const parent = user.parentId
    ? await prisma.parentAccount.findUnique({
        where: { id: user.parentId },
        include: {
          subscription: true,
          preferences: true,
        },
      })
    : await prisma.parentAccount.findFirst({
        where: {
          email: {
            equals: user.email,
            mode: "insensitive",
          },
        },
        include: {
          subscription: true,
          preferences: true,
        },
      });

  if (!parent) {
    return null;
  }

  if (user.parentId !== parent.id) {
    await prisma.user.updateMany({
      where: { id: user.id },
      data: { parentId: parent.id },
    });
  }

  return parent;
}

async function resolveParentFromHeaders(
  requestHeaders: Headers,
  options?: {
    includeImpersonation?: boolean;
  },
) {
  const authenticatedParent = await resolveAuthenticatedParentFromHeaders(requestHeaders);
  if (!authenticatedParent) {
    return null;
  }

  if (options?.includeImpersonation === false) {
    return authenticatedParent;
  }

  if (!isAdminSessionEmail(authenticatedParent.email)) {
    return authenticatedParent;
  }

  const impersonatedParentId = getImpersonatedParentIdFromCookieHeader(requestHeaders.get("cookie"));
  if (!impersonatedParentId || impersonatedParentId === authenticatedParent.id) {
    return authenticatedParent;
  }

  const impersonatedParent = await prisma.parentAccount.findUnique({
    where: {
      id: impersonatedParentId,
    },
    include: {
      subscription: true,
      preferences: true,
    },
  });

  return impersonatedParent ?? authenticatedParent;
}

export async function getParentFromRequest(request: NextRequest) {
  return resolveParentFromHeaders(request.headers);
}

export async function getAuthenticatedParentFromRequest(request: NextRequest) {
  return resolveParentFromHeaders(request.headers, {
    includeImpersonation: false,
  });
}

export async function getParentFromServerCookie() {
  const requestHeaders = await headers();
  return resolveParentFromHeaders(new Headers(requestHeaders));
}

export async function getAuthenticatedParentFromServerCookie() {
  const requestHeaders = await headers();
  return resolveParentFromHeaders(new Headers(requestHeaders), {
    includeImpersonation: false,
  });
}
