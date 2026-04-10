import { NextResponse, type NextRequest } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import {
  hashCheckoutReturnState,
  verifyCheckoutReturnState,
} from "@/modules/courses/course-checkout-return-state";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

const CHECKOUT_RETURN_STATE_MAX_AGE_MS = 90 * 60 * 1000;
const CHECKOUT_RETURN_ERROR_PATH = "/courses?checkout=error";

function redirectTo(pathname: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: pathname,
    },
  });
}

export async function GET(request: NextRequest) {
  await assertRequestAllowedBySecurityControls(request);

  const ipPolicy = await getRateLimitPolicy("courses.checkout.return.ip");
  const rateLimit = await enforceRateLimit({
    key: `courses:checkout:return:ip:${getRequestIp(request)}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!rateLimit.allowed) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
  }

  const orderCode = request.nextUrl.searchParams.get("orderCode");
  const state = request.nextUrl.searchParams.get("state");
  const paymentLinkId = request.nextUrl.searchParams.get("id");
  const code = request.nextUrl.searchParams.get("code");
  const status = request.nextUrl.searchParams.get("status")?.toUpperCase() ?? null;
  const cancel = request.nextUrl.searchParams.get("cancel")?.toLowerCase();
  const cancelledByQuery = cancel === "true" || cancel === "1" || status === "CANCELLED";

  if (!orderCode || !state) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
  }

  const paymentRecord = await prisma.paymentRecord.findUnique({
    where: {
      provider_providerTransactionId: {
        provider: "payos",
        providerTransactionId: orderCode,
      },
    },
    select: {
      parentId: true,
      status: true,
      rawPayload: true,
    },
  });

  if (!paymentRecord) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
  }

  const raw =
    paymentRecord.rawPayload && typeof paymentRecord.rawPayload === "object"
      ? (paymentRecord.rawPayload as Record<string, unknown>)
      : null;
  const payos = raw?.payos && typeof raw.payos === "object" ? (raw.payos as Record<string, unknown>) : null;
  const expectedStateHash = typeof payos?.returnStateHash === "string" ? payos.returnStateHash : null;
  if (!expectedStateHash || hashCheckoutReturnState(state) !== expectedStateHash) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
  }

  const isStateValid = verifyCheckoutReturnState({
    state,
    orderCode,
    parentId: paymentRecord.parentId,
    maxAgeMs: CHECKOUT_RETURN_STATE_MAX_AGE_MS,
  });
  if (!isStateValid) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
  }

  const expectedPaymentLinkId = typeof payos?.paymentLinkId === "string" ? payos.paymentLinkId : null;
  if (paymentLinkId && expectedPaymentLinkId && paymentLinkId !== expectedPaymentLinkId) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
  }

  if (cancelledByQuery || status === "FAILED" || (code && code !== "00" && status !== "PAID")) {
    return redirectTo(CHECKOUT_RETURN_ERROR_PATH);
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
