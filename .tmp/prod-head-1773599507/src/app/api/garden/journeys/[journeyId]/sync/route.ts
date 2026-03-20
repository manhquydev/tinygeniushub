import type { NextRequest } from "next/server";
import { z } from "zod";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { syncJourneyProgress } from "@/modules/garden/journey-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

const syncJourneySchema = z.object({
  childId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const payload = syncJourneySchema.parse(await request.json());
    const { journeyId } = await params;

    const result = await syncJourneyProgress({
      parentId: parent.id,
      childId: payload.childId,
      journeyId,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
