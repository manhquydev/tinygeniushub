import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE_NAME = "ccth_session";

type SessionUser = {
  id: string;
  email: string;
  parentId?: string | null;
};

async function resolveParentFromHeaders(requestHeaders: Headers) {
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

export async function getParentFromRequest(request: NextRequest) {
  return resolveParentFromHeaders(request.headers);
}

export async function getParentFromServerCookie() {
  const requestHeaders = await headers();
  return resolveParentFromHeaders(new Headers(requestHeaders));
}
