import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminActionLog } from "@/modules/admin/service";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateAdminStaffSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  role: z.enum(["SUPER_ADMIN", "CONTENT_EDITOR", "SUPPORT_AGENT"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const { id } = await context.params;
    const body = updateAdminStaffSchema.parse(await request.json());
    const isSelf = admin.id === id;
    const isDemoting = body.role !== undefined && body.role !== "SUPER_ADMIN";
    const isDeactivating = body.isActive === false;

    if (isSelf && (isDemoting || isDeactivating)) {
      return fail("Cannot demote or deactivate your own SUPER_ADMIN account.", 400);
    }

    const user = await prisma.adminAccount.update({
      where: { id },
      data: {
        displayName: body.displayName,
        role: body.role,
        isActive: body.isActive,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    await createAdminActionLog({
      adminEmail: admin.email,
      action: "UPDATE_STAFF_ACCOUNT",
      target: user.email,
      detail: {
        updatedFields: Object.keys(body),
      },
    });
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
