import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

function readSecretFromHeaders(request: NextRequest) {
  const directHeader =
    request.headers.get("x-cron-secret") ??
    request.headers.get("cron-secret") ??
    request.headers.get("cron_secret") ??
    request.headers.get("CRON_SECRET");

  if (directHeader) {
    return directHeader.trim();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function constantTimeEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function isCronRequestAuthorized(request: NextRequest) {
  const headerSecret = readSecretFromHeaders(request);
  if (!headerSecret) {
    return false;
  }
  return constantTimeEquals(headerSecret, env.CRON_SECRET);
}
