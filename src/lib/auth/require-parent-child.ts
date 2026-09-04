import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireParentAndOwnedChild(request: NextRequest, childId: string) {
  const parent = await getParentFromRequest(request);
  if (!parent) {
    return { ok: false as const, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId: parent.id },
    select: { id: true, parentId: true },
  });
  if (!child) {
    return { ok: false as const, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, parent, child };
}
