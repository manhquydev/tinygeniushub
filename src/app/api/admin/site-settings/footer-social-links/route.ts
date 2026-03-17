import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminActionLog } from "@/modules/admin/service";
import { footerSocialLinksSchema } from "@/modules/platform/footer-social-links-schema";
import {
  getFooterSocialLinks,
  updateFooterSocialLinks,
} from "@/modules/platform/site-content-settings-service";

const updateFooterSocialLinksPayloadSchema = z.object({
  links: footerSocialLinksSchema,
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const links = await getFooterSocialLinks();
    return ok({ links });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    const admin = await requireAdminFromRequest(request);
    const body = updateFooterSocialLinksPayloadSchema.parse(await request.json());
    const links = await updateFooterSocialLinks({
      actorId: admin.id,
      input: body.links,
    });

    await createAdminActionLog({
      adminEmail: admin.email,
      action: "UPDATE_FOOTER_SOCIAL_LINKS",
      target: "footer_social_links",
      detail: links,
    });

    return ok({ links });
  } catch (error) {
    return handleRouteError(error);
  }
}
