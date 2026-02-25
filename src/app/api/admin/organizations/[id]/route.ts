import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { updateOrganization, getOrganization } from "@/modules/organizations/organization-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  primaryColor: z.string().max(20).optional(),
  logoUrl: z.string().url().nullish(),
  domain: z.string().max(255).nullish(),
  isActive: z.boolean().optional(),
  billingStart: z.string().datetime().nullish(),
  billingEnd: z.string().datetime().nullish(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = updateOrgSchema.parse(await request.json());
    const org = await updateOrganization(id, {
      name: body.name,
      slug: body.slug,
      primaryColor: body.primaryColor,
      logoUrl: body.logoUrl ?? undefined,
      domain: body.domain ?? undefined,
      isActive: body.isActive,
      billingStart: body.billingStart ? new Date(body.billingStart) : undefined,
      billingEnd: body.billingEnd ? new Date(body.billingEnd) : undefined,
    });
    return ok({ org });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const { id } = await params;
    const existing = await getOrganization(id);
    if (!existing) {
      throw new DomainError("Organization not found", 404, "NOT_FOUND");
    }
    const org = await updateOrganization(id, { isActive: false });
    return ok({ org });
  } catch (error) {
    return handleRouteError(error);
  }
}
