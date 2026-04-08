/**
 * POST /api/webhooks/package-subscription
 * Handle package subscription payment webhooks
 * - Payment success/failure
 * - Update subscription status
 * - Send confirmation emails
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { logInfo, logWarn, logError } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { fail, ok } from "@/lib/http";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { PaymentStatus } from "@prisma/client";
import { enqueueTransactionalEmail } from "@/worker/queue";
import { createAuditLog } from "@/modules/platform/audit-service";

// Local enum until Prisma generates the full types
enum PackageSubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// Webhook payload schema (flexible for different providers)
interface WebhookPayload {
  provider: string;
  eventType: string;
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "CANCELLED";
  parentId: string;
  metadata?: {
    upgrade?: string;
    currentPackageId?: string;
    targetPackageId?: string;
    childId?: string;
    prorated?: string;
  };
  signature?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  let clientIp = "unknown";

  try {
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("billing.webhook.package.ip");
    clientIp = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `billing:webhook:package:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      logWarn("billing.webhook.package.rate_limited", {
        ip: clientIp,
        reason: rateLimit.reason,
      });
      return fail("Too many webhook requests", 429);
    }

    const contentLengthRaw = request.headers.get("content-length");
    if (contentLengthRaw) {
      const contentLength = Number.parseInt(contentLengthRaw, 10);
      if (Number.isFinite(contentLength) && contentLength > env.BILLING_WEBHOOK_MAX_BYTES) {
        logWarn("billing.webhook.package.payload_too_large", {
          ip: clientIp,
          contentLength,
        });
        return fail("Payload too large", 413);
      }
    }

    const payload = await request.json() as WebhookPayload;

    // Validate required fields
    if (!payload.paymentId || !payload.parentId || !payload.status) {
      logWarn("billing.webhook.package.invalid_payload", {
        ip: clientIp,
        payload: JSON.stringify(payload),
      });
      return fail("Invalid webhook payload", 400);
    }

    // Process based on status
    const result = await processWebhook(payload);

    logInfo("billing.webhook.package.processed", {
      ip: clientIp,
      paymentId: payload.paymentId,
      status: payload.status,
      result,
    });

    return ok({ success: true, result });
  } catch (error) {
    logError("billing.webhook.package.error", {
      ip: clientIp,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return handleRouteError(error, {
      routeId: "billing.webhook.package",
      ip: clientIp,
    });
  }
}

async function processWebhook(payload: WebhookPayload): Promise<{
  action: string;
  subscriptionId?: string;
  paymentRecordId?: string;
}> {
  const { paymentId, parentId, status, metadata, amount, currency, transactionId, provider } = payload;

  // Find or create payment record
  const existingPayment = await prisma.paymentRecord.findFirst({
    where: {
      OR: [
        { providerTransactionId: paymentId },
        { providerTransactionId: transactionId },
      ],
    },
  });

  let paymentRecordId: string = existingPayment?.id || "";

  // Create payment record if not exists
  if (!existingPayment) {
    const newPayment = await prisma.paymentRecord.create({
      data: {
        parentId,
        provider: provider || "UNKNOWN",
        providerTransactionId: paymentId,
        amountVnd: currency === "VND" ? amount : Math.round(amount * 25000), // Approximate conversion
        currency: currency || "VND",
        status: status === "SUCCESS" ? PaymentStatus.SUCCEEDED : 
                status === "FAILED" ? PaymentStatus.FAILED : PaymentStatus.PENDING,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawPayload: payload as any,
      },
    });
    paymentRecordId = newPayment.id;
  } else {
    // Update existing payment status
    await prisma.paymentRecord.update({
      where: { id: existingPayment.id },
      data: {
        status: status === "SUCCESS" ? PaymentStatus.SUCCEEDED : 
                status === "FAILED" ? PaymentStatus.FAILED : existingPayment.status,
      },
    });
  }

  // Process based on payment status
  if (status === "SUCCESS") {
    return await handlePaymentSuccess(parentId, metadata || {}, paymentRecordId);
  } else if (status === "FAILED") {
    return await handlePaymentFailure(parentId, metadata || {}, paymentRecordId);
  }

  return { action: "ignored", paymentRecordId };
}

async function handlePaymentSuccess(
  parentId: string,
  metadata: NonNullable<WebhookPayload["metadata"]> | Record<string, never>,
  paymentRecordId: string
): Promise<{ action: string; subscriptionId: string }> {
  const targetPackageId = metadata?.targetPackageId;
  const childId = metadata?.childId || null;
  const isUpgrade = metadata?.upgrade === "true";

  if (!targetPackageId) {
    throw new Error("Missing targetPackageId in metadata");
  }

  // Get the package details
  const package_ = await prisma.curriculumPackage.findUnique({
    where: { id: targetPackageId },
  });

  if (!package_) {
    throw new Error(`Package not found: ${targetPackageId}`);
  }

  // Calculate subscription dates
  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

  let subscriptionId: string;

  if (isUpgrade) {
    // Find existing subscription to update
    const existingSubscription = await prisma.packageSubscription.findFirst({
      where: {
        parentId,
        status: { in: [PackageSubscriptionStatus.ACTIVE] },
        endDate: { gte: now },
      },
      orderBy: { endDate: "desc" },
    });

    if (existingSubscription) {
      // Update existing subscription with new package
      const updated = await prisma.packageSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          packageId: targetPackageId,
          endDate,
          status: PackageSubscriptionStatus.ACTIVE,
          autoRenew: true,
        },
      });
      subscriptionId = updated.id;

      // Update payment record with subscription
      await prisma.paymentRecord.update({
        where: { id: paymentRecordId },
        data: { subscriptionId: updated.id },
      });

      await createAuditLog({
        actorType: "system",
        actorId: "webhook",
        action: "package.subscription.upgraded",
        resourceType: "package_subscription",
        resourceId: updated.id,
        metadata: {
          parentId,
          previousPackageId: existingSubscription.packageId,
          newPackageId: targetPackageId,
          childId,
          paymentId: paymentRecordId,
        },
      });
    } else {
      // Create new subscription
      subscriptionId = await createNewSubscription(parentId, targetPackageId, childId, now, endDate, paymentRecordId);
    }
  } else {
    // Create new subscription
    subscriptionId = await createNewSubscription(parentId, targetPackageId, childId, now, endDate, paymentRecordId);
  }

  // TODO: Send confirmation email (implement email service)
  await queueConfirmationEmail(parentId, targetPackageId, subscriptionId);

  return { action: isUpgrade ? "upgraded" : "created", subscriptionId };
}

async function createNewSubscription(
  parentId: string,
  packageId: string,
  childId: string | null,
  startDate: Date,
  endDate: Date,
  paymentRecordId: string
): Promise<string> {
  const subscription = await prisma.packageSubscription.create({
    data: {
      parentId,
      childId,
      packageId,
      status: PackageSubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      autoRenew: true,
    },
  });

  // Update payment record with subscription
  await prisma.paymentRecord.update({
    where: { id: paymentRecordId },
    data: { subscriptionId: subscription.id },
  });

  await createAuditLog({
    actorType: "system",
    actorId: "webhook",
    action: "package.subscription.created",
    resourceType: "package_subscription",
    resourceId: subscription.id,
    metadata: {
      parentId,
      packageId,
      childId,
      paymentId: paymentRecordId,
    },
  });

  return subscription.id;
}

async function handlePaymentFailure(
  parentId: string,
  metadata: NonNullable<WebhookPayload["metadata"]> | Record<string, never>,
  paymentRecordId: string
): Promise<{ action: string; paymentRecordId: string }> {
  // Log the failure
  await createAuditLog({
    actorType: "system",
    actorId: "webhook",
    action: "package.payment.failed",
    resourceType: "payment_record",
    resourceId: paymentRecordId,
    metadata: {
      parentId,
      targetPackageId: metadata?.targetPackageId,
      childId: metadata?.childId,
    },
  });

  // TODO: Send payment failure notification email
  await queueFailureNotification(parentId, paymentRecordId);

  return { action: "failed", paymentRecordId };
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function formatDateVi(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function queueConfirmationEmail(parentId: string, packageId: string, subscriptionId: string): Promise<void> {
  try {
    const [parent, packageInfo, subscription] = await Promise.all([
      prisma.parentAccount.findUnique({
        where: { id: parentId },
        select: { email: true, displayName: true },
      }),
      prisma.curriculumPackage.findUnique({
        where: { id: packageId },
        select: { name: true, yearlyPrice: true },
      }),
      prisma.packageSubscription.findUnique({
        where: { id: subscriptionId },
        select: { endDate: true },
      }),
    ]);

    if (!parent || !packageInfo || !subscription) {
      logWarn("email.confirmation.skipped_missing_context", {
        parentId,
        packageId,
        subscriptionId,
      });
      return;
    }

    const name = parent.displayName?.trim() || "phụ huynh";
    const appBaseUrl = resolveEmailPublicBaseUrl();
    const manageUrl = `${appBaseUrl}/parent/dashboard?utm_source=email&utm_medium=transactional&utm_campaign=package_subscription_success`;
    const text = [
      `Xin chào ${name},`,
      "",
      "Thanh toán gói học đã được xác nhận thành công.",
      `Gói đã kích hoạt: ${packageInfo.name}`,
      `Giá gói năm: ${formatVnd(packageInfo.yearlyPrice)} VND`,
      `Hiệu lực đến: ${formatDateVi(subscription.endDate)}`,
      `Mã đăng ký: ${subscriptionId}`,
      "",
      `Xem lộ trình và quản lý gói: ${manageUrl}`,
      "",
      "Nếu cần hỗ trợ, bạn có thể phản hồi email này.",
      "",
      "Trân trọng,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n");

    await enqueueTransactionalEmail({
      to: parent.email,
      subject: `[Cùng Con Tự Học] Thanh toán thành công: ${packageInfo.name}`,
      text,
      tags: [
        { name: "feature", value: "package_subscription_success" },
        { name: "subscription_id", value: subscriptionId },
      ],
    });

    logInfo("email.confirmation.sent", {
      parentId,
      packageId,
      subscriptionId,
      recipient: parent.email,
    });
  } catch (error) {
    logWarn("email.confirmation.failed", {
      parentId,
      packageId,
      subscriptionId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function queueFailureNotification(parentId: string, paymentRecordId: string): Promise<void> {
  try {
    const [parent, payment] = await Promise.all([
      prisma.parentAccount.findUnique({
        where: { id: parentId },
        select: { email: true, displayName: true },
      }),
      prisma.paymentRecord.findUnique({
        where: { id: paymentRecordId },
        select: {
          amountVnd: true,
          currency: true,
          providerTransactionId: true,
        },
      }),
    ]);

    if (!parent || !payment) {
      logWarn("email.failure.skipped_missing_context", {
        parentId,
        paymentRecordId,
      });
      return;
    }

    const name = parent.displayName?.trim() || "phụ huynh";
    const appBaseUrl = resolveEmailPublicBaseUrl();
    const retryUrl = `${appBaseUrl}/pricing?utm_source=email&utm_medium=transactional&utm_campaign=package_subscription_failed`;
    const supportEmail = env.REPORT_EMAIL_REPLY_TO ?? "support@cungcontuhoc.io.vn";
    const text = [
      `Xin chào ${name},`,
      "",
      "Chúng tôi chưa thể xác nhận thanh toán gói học của bạn.",
      `Số tiền: ${formatVnd(payment.amountVnd)} ${payment.currency}`,
      `Mã giao dịch: ${payment.providerTransactionId}`,
      "",
      `Bạn có thể thử thanh toán lại tại: ${retryUrl}`,
      `Nếu cần hỗ trợ, vui lòng liên hệ: ${supportEmail}`,
      "",
      "Trân trọng,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n");

    await enqueueTransactionalEmail({
      to: parent.email,
      subject: "[Cùng Con Tự Học] Thanh toán chưa thành công",
      text,
      tags: [
        { name: "feature", value: "package_subscription_failed" },
        { name: "payment_record_id", value: paymentRecordId },
      ],
    });

    logInfo("email.failure.sent", {
      parentId,
      paymentRecordId,
      recipient: parent.email,
    });
  } catch (error) {
    logWarn("email.failure.send_failed", {
      parentId,
      paymentRecordId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
