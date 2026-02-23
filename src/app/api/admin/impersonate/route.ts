import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { setImpersonationCookie } from "@/lib/auth/impersonation";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createAdminActionLog } from "@/modules/admin/service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

const adminImpersonateSchema = z.object({
  parentId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    const payload = adminImpersonateSchema.parse(await request.json());
    const targetParent = await prisma.parentAccount.findUnique({
      where: {
        id: payload.parentId,
      },
      select: {
        id: true,
      },
    });

    if (!targetParent) {
      throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
    }

    const response = ok({ redirectTo: "/parent/dashboard" });
    setImpersonationCookie(response, payload.parentId);

    await createAdminActionLog({
      adminEmail: admin.email,
      action: "IMPERSONATE",
      target: payload.parentId,
      detail: {
        impersonatedParentId: payload.parentId,
      },
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
