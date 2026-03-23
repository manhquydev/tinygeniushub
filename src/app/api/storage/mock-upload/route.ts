import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

function signPayload(payload: string) {
  return createHmac("sha256", env.MOCK_UPLOAD_SIGNING_SECRET).update(payload).digest("hex");
}

function isValidSignature(payload: string, signature: string) {
  const expected = signPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function PUT(request: Request) {
  if (env.NODE_ENV === "production" || env.STORAGE_PROVIDER !== "mock_r2") {
    return fail("Not found", 404);
  }

  try {
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("storage.mockUpload.ip");
    const ip = getRequestIp(request);
    const ipRateLimit = await enforceRateLimit({
      key: `storage:mock-upload:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipRateLimit.allowed) {
      return fail("Too many upload attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const url = new URL(request.url);
    const objectPath = url.searchParams.get("path");
    const expiresAtRaw = url.searchParams.get("expiresAt");
    const signature = url.searchParams.get("sig");

    if (!objectPath || !expiresAtRaw || !signature) {
      return fail("Missing signed upload query params", 400);
    }

    const expiresAt = new Date(expiresAtRaw);
    if (Number.isNaN(expiresAt.getTime())) {
      return fail("Invalid expiresAt", 400);
    }

    if (expiresAt.getTime() < Date.now()) {
      return fail("Signed upload URL has expired", 410);
    }

    const payload = `${objectPath}:${expiresAt.toISOString()}`;
    if (!isValidSignature(payload, signature)) {
      return fail("Invalid upload signature", 401);
    }

    return ok({
      uploaded: true,
      provider: "mock_r2",
      objectPath,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
