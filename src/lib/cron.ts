import { env } from "@/lib/env";
import type { NextRequest } from "next/server";

function readSecretFromHeaders(request: NextRequest) {
  const directHeader =
    request.headers.get("x-cron-secret") ??
    request.headers.get("cron-secret") ??
    request.headers.get("cron_secret") ??
    request.headers.get("CRON_SECRET");

  if (directHeader) {
    return directHeader;
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function isCronRequestAuthorized(request: NextRequest) {
  const headerSecret = readSecretFromHeaders(request);
  return Boolean(headerSecret && headerSecret === env.CRON_SECRET);
}

