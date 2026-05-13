import { env } from "@/lib/env";
import { enqueueTransactionalEmail } from "@/worker/queue";

export type CaregiverInviteEmailDelivery = {
  provider: string;
  attempted: boolean;
  sent: boolean;
};

type CaregiverInviteEmailInput = {
  to: string;
  parentDisplayName: string | null;
  inviteUrl: string;
  expiresAt: Date;
};

function formatExpiryDate(date: Date) {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function sendCaregiverInviteEmail(input: CaregiverInviteEmailInput): Promise<CaregiverInviteEmailDelivery> {
  const parentLabel = input.parentDisplayName && input.parentDisplayName.length > 0 ? input.parentDisplayName : "Parents";
  const subject = "Caregiver invitation from TinyGenius Hub";
  const text = [
      `${parentLabel}invited you to follow your child's learning progress.`,
      `Click on the following link to accept the invitation:${input.inviteUrl}`,
      `Invitation expires on${formatExpiryDate(input.expiresAt)}.`,
    ].join("\n");

  await enqueueTransactionalEmail({
    to: input.to,
    subject,
    text,
    tags: [
      { name: "feature", value: "caregiver_invite" },
    ],
  });

  return {
    provider: env.REPORT_EMAIL_PROVIDER,
    attempted: true,
    sent: true,
  };
}
