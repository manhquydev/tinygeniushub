import { NextResponse, type NextRequest } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

function redirectTo(pathname: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: pathname,
    },
  });
}

export async function GET(request: NextRequest) {
  const orderCode = request.nextUrl.searchParams.get("orderCode");
  const paymentLinkId = request.nextUrl.searchParams.get("id");
  const code = request.nextUrl.searchParams.get("code");
  const status = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? null;
  const cancel = request.nextUrl.searchParams.get("cancel")?.toLowerCase();
  const cancelledByQuery = cancel === "true" || cancel === "1" || status === "CANCELLED";

  if (!orderCode) {
    return redirectTo("/courses?checkout=invalid");
  }
  if (cancelledByQuery) {
    return redirectTo(`/courses?checkout=cancelled&orderCode=${encodeURIComponent(orderCode)}`);
  }
  if (status === "FAILED" || (code && code !== "00" && status !== "PAID")) {
    return redirectTo(`/courses?checkout=failed&orderCode=${encodeURIComponent(orderCode)}`);
  }

  const paymentRecord = await prisma.paymentRecord.findUnique({
    where: {
      provider_providerTransactionId: {
        provider: "payos",
        providerTransactionId: orderCode,
      },
    },
    select: {
      id: true,
      parentId: true,
      status: true,
      rawPayload: true,
    },
  });

  if (!paymentRecord) {
    return redirectTo("/courses?checkout=not_found");
  }

  const raw =
    paymentRecord.rawPayload && typeof paymentRecord.rawPayload === "object"
      ? (paymentRecord.rawPayload as Record<string, unknown>)
      : null;
  const payos = raw?.payos && typeof raw.payos === "object" ? (raw.payos as Record<string, unknown>) : null;
  const expectedPaymentLinkId = typeof payos?.paymentLinkId === "string" ? payos.paymentLinkId : null;
  if (paymentLinkId && expectedPaymentLinkId && paymentLinkId !== expectedPaymentLinkId) {
    return redirectTo("/courses?checkout=invalid");
  }

  if (paymentRecord.status !== PaymentStatus.SUCCEEDED) {
    if (status === "PAID") {
      return redirectTo(`/courses?checkout=processing&orderCode=${encodeURIComponent(orderCode)}`);
    }
    return redirectTo(`/courses?checkout=pending&orderCode=${encodeURIComponent(orderCode)}`);
  }

  const target = raw?.target && typeof raw.target === "object" ? (raw.target as Record<string, unknown>) : null;
  const targetKind = typeof target?.kind === "string" ? target.kind : null;

  if (targetKind === "bundle") {
    const entryCourseSlug = typeof target?.entryCourseSlug === "string" ? target.entryCourseSlug : null;
    if (entryCourseSlug) {
      const firstChild = await prisma.childProfile.findFirst({
        where: { parentId: paymentRecord.parentId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      const destinationWithChild = firstChild
        ? `/kid/courses/${encodeURIComponent(entryCourseSlug)}?childId=${encodeURIComponent(firstChild.id)}`
        : `/kid/courses/${encodeURIComponent(entryCourseSlug)}`;
      return redirectTo(destinationWithChild);
    }
  }

  if (targetKind === "course") {
    const courseSlug = typeof target?.courseSlug === "string" ? target.courseSlug : null;
    if (courseSlug) {
      const firstChild = await prisma.childProfile.findFirst({
        where: { parentId: paymentRecord.parentId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      const destinationWithChild = firstChild
        ? `/kid/courses/${encodeURIComponent(courseSlug)}?childId=${encodeURIComponent(firstChild.id)}`
        : `/kid/courses/${encodeURIComponent(courseSlug)}`;
      return redirectTo(destinationWithChild);
    }
  }

  return redirectTo("/parent/courses?checkout=success");
}
