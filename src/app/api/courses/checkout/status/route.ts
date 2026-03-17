import { PaymentStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

function parseRawPayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }

  return rawPayload as Record<string, unknown>;
}

async function resolveSuccessRedirectPath(input: {
  parentId: string;
  rawPayload: unknown;
}) {
  const raw = parseRawPayload(input.rawPayload);
  const target =
    raw?.target && typeof raw.target === "object"
      ? (raw.target as Record<string, unknown>)
      : null;
  const targetKind = typeof target?.kind === "string" ? target.kind : null;

  if (targetKind === "bundle") {
    const entryCourseSlug =
      typeof target?.entryCourseSlug === "string"
        ? target.entryCourseSlug
        : null;

    if (entryCourseSlug) {
      const firstChild = await prisma.childProfile.findFirst({
        where: { parentId: input.parentId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      return firstChild
        ? `/kid/courses/${encodeURIComponent(entryCourseSlug)}?childId=${encodeURIComponent(firstChild.id)}`
        : `/kid/courses/${encodeURIComponent(entryCourseSlug)}`;
    }
  }

  if (targetKind === "course") {
    const courseSlug =
      typeof target?.courseSlug === "string" ? target.courseSlug : null;

    if (courseSlug) {
      const firstChild = await prisma.childProfile.findFirst({
        where: { parentId: input.parentId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      return firstChild
        ? `/kid/courses/${encodeURIComponent(courseSlug)}?childId=${encodeURIComponent(firstChild.id)}`
        : `/kid/courses/${encodeURIComponent(courseSlug)}`;
    }
  }

  return "/parent/courses?checkout=success";
}

export async function GET(request: NextRequest) {
  try {
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const orderCode = request.nextUrl.searchParams.get("orderCode");
    if (!orderCode) {
      return fail("Missing orderCode", 400);
    }

    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: {
        parentId: parent.id,
        provider: "payos",
        providerTransactionId: orderCode,
      },
      select: {
        status: true,
        rawPayload: true,
      },
    });

    if (!paymentRecord) {
      return ok({
        status: "not_found",
      });
    }

    if (paymentRecord.status === PaymentStatus.SUCCEEDED) {
      const redirectTo = await resolveSuccessRedirectPath({
        parentId: parent.id,
        rawPayload: paymentRecord.rawPayload,
      });

      return ok({
        status: "succeeded",
        redirectTo,
      });
    }

    if (
      paymentRecord.status === PaymentStatus.FAILED ||
      paymentRecord.status === PaymentStatus.REFUNDED
    ) {
      return ok({
        status: "failed",
      });
    }

    return ok({
      status: "pending",
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "courses.checkout.status",
    });
  }
}

