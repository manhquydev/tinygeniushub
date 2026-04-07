import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";

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
  const parentLabel = input.parentDisplayName && input.parentDisplayName.length > 0 ? input.parentDisplayName : "Phụ huynh";
  const subject = "Thư mời caregiver từ Cùng Con Tự Học";
  const text = [
      `${parentLabel} đã mời bạn cùng theo dõi tiến độ học tập của bé.`,
      `Nhấn vào liên kết sau để chấp nhận lời mời: ${input.inviteUrl}`,
      `Lời mời hết hạn vào ngày ${formatExpiryDate(input.expiresAt)}.`,
    ].join("\n");

  const delivery = await sendTransactionalEmail({
    to: input.to,
    subject,
    text,
    tags: [
      { name: "feature", value: "caregiver_invite" },
    ],
  });

  return {
    provider: delivery.provider,
    attempted: delivery.attempted,
    sent: delivery.sent,
  };
}
