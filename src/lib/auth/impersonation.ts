import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const IMPERSONATED_PARENT_ID_COOKIE_NAME = "ccth_impersonated_parent_id";
export const IMPERSONATING_COOKIE_NAME = "ccth_impersonating";
const IMPERSONATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;
const IMPERSONATION_SIGNING_SECRET = `${env.BETTER_AUTH_SECRET}:impersonation`;

type ImpersonationCookiePayload = {
  parentId: string;
  actorEmail: string;
  exp: number;
};

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  const entries = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex < 0) {
        return [part, ""] as const;
      }

      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      return [key, value] as const;
    });

  return new Map(entries);
}

function signTokenPayload(payload: string) {
  return createHmac("sha256", IMPERSONATION_SIGNING_SECRET)
    .update(payload)
    .digest("base64url");
}

function createImpersonationToken(input: {
  parentId: string;
  actorEmail: string;
}) {
  const payload: ImpersonationCookiePayload = {
    parentId: input.parentId,
    actorEmail: input.actorEmail.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + IMPERSONATION_COOKIE_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signTokenPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeAndVerifyImpersonationToken(token: string): ImpersonationCookiePayload | null {
  const [encodedPayload, signature] = token.split(".", 2);
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signTokenPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as
      | ImpersonationCookiePayload
      | null;
    if (!payload || typeof payload !== "object") {
      return null;
    }
    if (typeof payload.parentId !== "string" || payload.parentId.trim().length === 0) {
      return null;
    }
    if (typeof payload.actorEmail !== "string" || payload.actorEmail.trim().length === 0) {
      return null;
    }
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      parentId: payload.parentId.trim(),
      actorEmail: payload.actorEmail.trim().toLowerCase(),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function getImpersonatedParentIdFromCookieHeader(
  cookieHeader: string | null,
  actorEmail?: string,
) {
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies.get(IMPERSONATED_PARENT_ID_COOKIE_NAME);
  if (!token) {
    return null;
  }

  const payload = decodeAndVerifyImpersonationToken(token);
  if (!payload) {
    return null;
  }

  if (actorEmail) {
    const normalizedActorEmail = actorEmail.trim().toLowerCase();
    if (payload.actorEmail !== normalizedActorEmail) {
      return null;
    }
  }

  return payload.parentId;
}

export function setImpersonationCookie(
  response: NextResponse,
  input: {
    parentId: string;
    actorEmail: string;
  },
) {
  const token = createImpersonationToken({
    parentId: input.parentId,
    actorEmail: input.actorEmail,
  });

  response.cookies.set({
    name: IMPERSONATED_PARENT_ID_COOKIE_NAME,
    value: token,
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: IMPERSONATION_COOKIE_MAX_AGE_SECONDS,
  });
  response.cookies.set({
    name: IMPERSONATING_COOKIE_NAME,
    value: "1",
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: IMPERSONATION_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearImpersonationCookie(response: NextResponse) {
  response.cookies.set({
    name: IMPERSONATED_PARENT_ID_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  response.cookies.set({
    name: IMPERSONATING_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}
