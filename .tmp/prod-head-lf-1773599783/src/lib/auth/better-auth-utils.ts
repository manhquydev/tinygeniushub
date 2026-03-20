import { splitSetCookieHeader } from "better-auth/cookies";
import { DomainError } from "@/modules/platform/errors";

type BetterAuthApiError = Error & {
  body?: {
    message?: unknown;
  };
  statusCode?: unknown;
};

export function appendSetCookieHeaders(target: Response, sourceHeaders?: Headers | null) {
  const rawSetCookie = sourceHeaders?.get("set-cookie");
  if (!rawSetCookie) {
    return;
  }

  const cookies = splitSetCookieHeader(rawSetCookie);
  for (const cookie of cookies) {
    target.headers.append("set-cookie", cookie);
  }
}

export function normalizeBetterAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return error;
  }

  const authError = error as BetterAuthApiError;
  if (authError.name !== "APIError") {
    return error;
  }

  const status =
    typeof authError.statusCode === "number" && Number.isFinite(authError.statusCode)
      ? authError.statusCode
      : 400;

  const message =
    typeof authError.body?.message === "string"
      ? authError.body.message
      : authError.message || "Authentication request failed";

  return new DomainError(message, status, "AUTH_API_ERROR");
}
