import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminActionLog } from "@/modules/admin/service";
import { hash } from "bcryptjs";
import { z } from "zod";

const createAdminStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
  role: z.enum(["SUPER_ADMIN", "CONTENT_EDITOR", "SUPPORT_AGENT"]),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const users = await prisma.adminAccount.findMany({
      orderBy: { createdAt: "asc" },
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
    return ok({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const body = createAdminStaffSchema.parse(await request.json());
    const passwordHash = await hash(body.password, 12);

    const user = await prisma.adminAccount.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName,
        role: body.role,
        isActive: true,
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
      action: "CREATE_STAFF_ACCOUNT",
      target: user.email,
      detail: {
        role: user.role,
      },
    });
    return ok({ user }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
