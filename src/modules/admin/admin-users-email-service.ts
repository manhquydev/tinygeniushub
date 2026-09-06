import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createNotificationForParent } from "@/modules/platform/notification-service";
import { DomainError } from "@/modules/platform/errors";
import { enqueueTransactionalEmail } from "@/worker/queue";
import { createAdminActionLog } from "./admin-user-service";

export const adminEmailActionSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
});

async function sendAdminManualEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    await enqueueTransactionalEmail({
      to: params.to,
      subject: params.subject,
      text: params.body,
      tags: [{ name: "feature", value: "admin_manual_email" }],
    });
    return { provider: env.REPORT_EMAIL_PROVIDER };
  } catch (error) {
    throw new DomainError(
      error instanceof Error ? `Admin email delivery failed: ${error.message}` : "Admin email delivery failed",
      502,
      "ADMIN_EMAIL_DELIVERY_FAILED",
    );
  }
}

export async function sendAdminEmailToParent(input: {
  parentId: string;
  subject: string;
  body: string;
  adminEmail: string;
}) {
  const payload = adminEmailActionSchema.parse({
    subject: input.subject,
    body: input.body,
  });

  const parent = await prisma.parentAccount.findUnique({
    where: { id: input.parentId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  const delivery = await sendAdminManualEmail({
    to: parent.email,
    subject: payload.subject,
    body: payload.body,
  });

  await createNotificationForParent({
    parentId: parent.id,
    parentEmail: parent.email,
    notification: {
      type: "TIP",
      title: payload.subject,
      message: payload.body.slice(0, 280),
      href: "/parent/dashboard",
    },
  });

  await createAdminActionLog({
    adminEmail: input.adminEmail,
    action: "SEND_USER_EMAIL",
    target: parent.email,
    detail: {
      subject: payload.subject,
      provider: delivery.provider,
    },
  });

  return {
    sent: true,
    provider: delivery.provider,
  };
}
