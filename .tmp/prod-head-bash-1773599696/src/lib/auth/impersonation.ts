import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const IMPERSONATED_PARENT_ID_COOKIE_NAME = "ccth_impersonated_parent_id";
export const IMPERSONATING_COOKIE_NAME = "ccth_impersonating";
const IMPERSONATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

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

export function getImpersonatedParentIdFromCookieHeader(cookieHeader: string | null) {
  const cookies = parseCookieHeader(cookieHeader);
  const value = cookies.get(IMPERSONATED_PARENT_ID_COOKIE_NAME);
  return value && value.length > 0 ? value : null;
}

export function setImpersonationCookie(response: NextResponse, parentId: string) {
  response.cookies.set({
    name: IMPERSONATED_PARENT_ID_COOKIE_NAME,
    value: parentId,
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
