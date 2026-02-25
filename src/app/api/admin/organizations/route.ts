import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createOrganization, listAllOrganizations } from "@/modules/organizations/organization-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const organizations = await listAllOrganizations();
    return ok({ organizations });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const body = await request.json();
    const org = await createOrganization({
      name: body.name,
      slug: body.slug,
      primaryColor: body.primaryColor,
      logoUrl: body.logoUrl,
      domain: body.domain,
      billingStart: body.billingStart ? new Date(body.billingStart) : undefined,
      billingEnd: body.billingEnd ? new Date(body.billingEnd) : undefined,
    });
    return ok({ org }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
