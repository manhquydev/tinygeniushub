import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { updateOrganization, getOrganization } from "@/modules/organizations/organization-service";
import { DomainError } from "@/modules/platform/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = await request.json();
    const org = await updateOrganization(id, {
      name: body.name,
      slug: body.slug,
      primaryColor: body.primaryColor,
      logoUrl: body.logoUrl,
      domain: body.domain,
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
    await requireAdminFromRequest(request);
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
