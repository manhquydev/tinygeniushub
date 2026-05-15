import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getPayablePlanConfig, payablePlanCodeSchema } from "@/modules/billing/plan-config";
import { resolveBillingProvider } from "@/modules/billing/providers";
import { createAuditLog } from "@/modules/platform/audit-service";
import { DomainError } from "@/modules/platform/errors";

export const createCheckoutSchema = z.object({
  planCode: payablePlanCodeSchema,
  successPath: z.string().min(1).optional().default("/parent/dashboard"),
  cancelPath: z.string().min(1).optional().default("/courses"),
});

function ensureSafePath(path: string) {
  if (!path.startsWith("/")) {
    throw new DomainError("Redirect path must start with '/'", 400, "INVALID_REDIRECT_PATH");
  }

  if (path.startsWith("//")) {
    throw new DomainError("Redirect path cannot start with '//'", 400, "INVALID_REDIRECT_PATH");
  }

  return path;
}

export function resolveCheckoutAbsoluteUrl(path: string) {
  const safePath = ensureSafePath(path);
  return new URL(safePath, env.BETTER_AUTH_URL).toString();
}

export async function createBillingCheckoutSession(params: {
  parentId: string;
  input: z.infer<typeof createCheckoutSchema>;
}) {
  const payload = createCheckoutSchema.parse(params.input);
  const parent = await prisma.parentAccount.findUnique({
    where: { id: params.parentId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  const planConfig = getPayablePlanConfig(payload.planCode);
  const successUrl = resolveCheckoutAbsoluteUrl(payload.successPath);
  const cancelUrl = resolveCheckoutAbsoluteUrl(payload.cancelPath);
  const provider = resolveBillingProvider();

  const session = await provider.createCheckoutSession({
    parentId: parent.id,
    parentEmail: parent.email,
    planCode: payload.planCode,
    amountVnd: planConfig.amountVnd,
    successUrl,
    cancelUrl,
  });

  await createAuditLog({
    actorType: "parent",
    actorId: parent.id,
    action: "billing.checkout.created",
    resourceType: "checkout_session",
    resourceId: session.externalSessionId,
    metadata: {
      provider: session.provider,
      planCode: payload.planCode,
      amountVnd: planConfig.amountVnd,
      successUrl,
      cancelUrl,
      expiresAt: session.expiresAt.toISOString(),
    },
  });

  return {
    provider: session.provider,
    planCode: payload.planCode,
    amountVnd: planConfig.amountVnd,
    checkoutUrl: session.checkoutUrl,
    externalSessionId: session.externalSessionId,
    expiresAt: session.expiresAt,
  };
}
