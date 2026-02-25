import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { addMember, removeMember } from "@/modules/organizations/organization-service";
import { OrgRole } from "@prisma/client";
import { z } from "zod";

const addMemberSchema = z.object({
  parentId: z.string().min(1),
  role: z.nativeEnum(OrgRole).default(OrgRole.STUDENT_PARENT),
});

const removeMemberSchema = z.object({
  parentId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = addMemberSchema.parse(await request.json());
    const member = await addMember(id, body.parentId, body.role);
    return ok({ member }, { status: 201 });
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
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = removeMemberSchema.parse(await request.json());
    await removeMember(id, body.parentId);
    return ok({ removed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
