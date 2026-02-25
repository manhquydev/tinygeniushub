import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createOrganization, listAllOrganizations } from "@/modules/organizations/organization-service";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  primaryColor: z.string().max(20).optional(),
  logoUrl: z.string().url().optional(),
  domain: z.string().max(255).optional(),
  billingStart: z.string().datetime().optional(),
  billingEnd: z.string().datetime().optional(),
});

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
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const body = createOrgSchema.parse(await request.json());
    const org = await createOrganization({
      name: body.name,
      slug: body.slug,
      primaryColor: body.primaryColor ?? undefined,
      logoUrl: body.logoUrl ?? undefined,
      domain: body.domain ?? undefined,
      billingStart: body.billingStart ? new Date(body.billingStart) : undefined,
      billingEnd: body.billingEnd ? new Date(body.billingEnd) : undefined,
    });
    return ok({ org }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
