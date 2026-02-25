import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { addMember, removeMember } from "@/modules/organizations/organization-service";
import { OrgRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = await request.json();
    const member = await addMember(id, body.parentId, (body.role as OrgRole) ?? OrgRole.STUDENT_PARENT);
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
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = await request.json();
    await removeMember(id, body.parentId);
    return ok({ removed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
