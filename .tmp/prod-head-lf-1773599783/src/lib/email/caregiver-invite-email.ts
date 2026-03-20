import { env } from "@/lib/env";

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
  if (env.REPORT_EMAIL_PROVIDER !== "resend") {
    // TODO: move caregiver invite emails to centralized transactional email queue.
    return {
      provider: env.REPORT_EMAIL_PROVIDER,
      attempted: false,
      sent: false,
    };
  }

  const parentLabel = input.parentDisplayName && input.parentDisplayName.length > 0 ? input.parentDisplayName : "Phụ huynh";
  const payload = {
    from: env.REPORT_EMAIL_FROM,
    to: [env.REPORT_EMAIL_TO_OVERRIDE ?? input.to],
    subject: "Thư mời caregiver từ Cùng Con Tự Học",
    text: [
      `${parentLabel} đã mời bạn cùng theo dõi tiến độ học tập của bé.`,
      `Nhấn vào liên kết sau để chấp nhận lời mời: ${input.inviteUrl}`,
      `Lời mời hết hạn vào ngày ${formatExpiryDate(input.expiresAt)}.`,
    ].join("\n"),
    ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
    tags: [
      { name: "feature", value: "caregiver_invite" },
      { name: "environment", value: env.NODE_ENV },
    ],
  };

  const response = await fetch(`${env.REPORT_EMAIL_RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.REPORT_EMAIL_RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Caregiver invite email delivery failed: status=${response.status}`);
  }

  return {
    provider: env.REPORT_EMAIL_PROVIDER,
    attempted: true,
    sent: true,
  };
}
