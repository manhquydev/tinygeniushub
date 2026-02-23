import type { NextRequest } from "next/server";
import { z } from "zod";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { prisma } from "@/lib/db";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { createChildProfile } from "@/modules/progress/children-service";
import { DomainError } from "@/modules/platform/errors";

const onboardingCompleteSchema = z.object({
  nickname: z.string().trim().min(1).max(60),
  avatarId: z.string().trim().min(1).max(120),
  ageBand: z.enum(["2-3", "3-4", "4-5", "5-6"]).optional(),
});

async function enforceOnboardingRateLimit(request: NextRequest, parentId: string) {
  const [ipPolicy, parentPolicy] = await Promise.all([
    getRateLimitPolicy("children.mutation.ip"),
    getRateLimitPolicy("children.mutation.parent"),
  ]);

  const ip = getRequestIp(request);
  const ipLimit = await enforceRateLimit({
    key: `onboarding:complete:ip:${ip}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!ipLimit.allowed) {
    return fail("Too many onboarding requests. Please retry later.", 429, {
      retryAfterMs: ipLimit.retryAfterMs,
    });
  }

  const parentLimit = await enforceRateLimit({
    key: `onboarding:complete:parent:${buildRateLimitIdentity(parentId)}`,
    limit: parentPolicy.limit,
    windowMs: parentPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!parentLimit.allowed) {
    return fail("Too many onboarding requests. Please retry later.", 429, {
      retryAfterMs: parentLimit.retryAfterMs,
    });
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const rateLimitResult = await enforceOnboardingRateLimit(request, parent.id);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const input = onboardingCompleteSchema.parse(await request.json());
    const existingChildCount = await prisma.childProfile.count({
      where: { parentId: parent.id },
    });

    if (existingChildCount > 0) {
      throw new DomainError("Onboarding already completed for this account.", 409, "ONBOARDING_ALREADY_COMPLETED");
    }

    const child = await createChildProfile(parent.id, {
      nickname: input.nickname,
      ageBand: input.ageBand ?? "3-4",
      avatarId: input.avatarId,
    });

    return ok({ child }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
