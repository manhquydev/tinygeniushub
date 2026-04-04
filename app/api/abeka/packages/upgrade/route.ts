/**
 * POST /api/abeka/packages/upgrade
 * Upgrade to a new package with optional proration
 * 
 * Body: {
 *   targetPackageId: string,
 *   childId?: string,
 *   prorate?: boolean // default: true
 * }
 */

import { NextRequest } from "next/server";
import { createUpgradeCheckout, upgradePackageSchema } from "@/modules/billing/package-service";
import { getParentFromRequest } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/route-error";
import { fail, ok } from "@/lib/http";
import { assertTrustedOrigin } from "@/lib/security/csrf";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const input = upgradePackageSchema.parse(body);

    const result = await createUpgradeCheckout(parent.id, input);

    return ok({
      checkoutUrl: result.checkoutUrl,
      proratedAmount: result.proratedAmount,
      currency: result.currency,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
