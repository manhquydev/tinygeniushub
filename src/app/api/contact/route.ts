import { z } from "zod";
import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

const contactPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  subject: z.enum(["Hỗ trợ kỹ thuật", "Hợp tác / B2B", "Báo lỗi", "Khác"]),
  message: z.string().trim().min(10).max(500),
});

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_LIMIT = 5;

async function sendContactEmail(payload: z.infer<typeof contactPayloadSchema>, clientIp: string) {
  const recipient = env.ADMIN_EMAILS[0] ?? env.REPORT_EMAIL_FROM;
  if (!recipient) {
    logWarn("contact.email_recipient_missing", {
      provider: env.REPORT_EMAIL_PROVIDER,
    });
    return;
  }

  const text = [
    "Yêu cầu liên hệ mới từ website Cùng Con Tự Học",
    `Họ tên: ${payload.name}`,
    `Email: ${payload.email}`,
    `Chủ đề: ${payload.subject}`,
    `IP: ${clientIp}`,
    "",
    "Nội dung:",
    payload.message,
  ].join("\n");

  await sendTransactionalEmail({
    to: recipient,
    subject: `[Liên hệ] ${payload.subject} - ${payload.name}`,
    text,
    tags: [{ name: "feature", value: "contact_form" }],
  });
}

async function sendContactAcknowledgementEmail(payload: z.infer<typeof contactPayloadSchema>) {
  const text = [
    `Xin chào ${payload.name},`,
    "",
    "Cùng Con Tự Học đã nhận được yêu cầu hỗ trợ của bạn.",
    `Chủ đề: ${payload.subject}`,
    "Đội ngũ sẽ phản hồi trong thời gian sớm nhất.",
    "",
    "Nội dung bạn đã gửi:",
    payload.message,
  ].join("\n");

  await sendTransactionalEmail({
    to: payload.email,
    subject: `[Cùng Con Tự Học] Đã tiếp nhận yêu cầu: ${payload.subject}`,
    text,
    tags: [{ name: "feature", value: "contact_form_ack" }],
  });
}

export async function POST(request: Request) {
  let clientIp = "unknown";

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    clientIp = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `contact:submit:${clientIp}`,
      limit: CONTACT_LIMIT,
      windowMs: CONTACT_WINDOW_MS,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      return fail("Bạn gửi biểu mẫu quá nhanh. Vui lòng thử lại sau.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const payload = contactPayloadSchema.parse(await request.json());
    await sendContactEmail(payload, clientIp);
    try {
      await sendContactAcknowledgementEmail(payload);
    } catch (error) {
      logWarn("contact.ack_email_failed", {
        ip: clientIp,
        email: payload.email,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    logInfo("contact.form_submitted", {
      ip: clientIp,
      subject: payload.subject,
      email: payload.email,
    });

    return ok({
      success: true,
      message: "Đã nhận được tin nhắn của bạn",
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "contact.submit",
      ip: clientIp,
    });
  }
}
