import { z } from "zod";
import { env } from "@/lib/env";
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
  message: z.string().trim().min(10).max(2000),
});

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_LIMIT = 5;

async function sendContactEmail(payload: z.infer<typeof contactPayloadSchema>, clientIp: string) {
  if (env.REPORT_EMAIL_PROVIDER !== "resend") {
    console.log("[contact] received message", {
      provider: env.REPORT_EMAIL_PROVIDER,
      payload,
      clientIp,
    });
    return;
  }

  const recipient = env.REPORT_EMAIL_TO_OVERRIDE ?? env.ADMIN_EMAILS[0] ?? env.REPORT_EMAIL_FROM;
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

  const response = await fetch(`${env.REPORT_EMAIL_RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.REPORT_EMAIL_RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.REPORT_EMAIL_FROM,
      to: [recipient],
      subject: `[Liên hệ] ${payload.subject} - ${payload.name}`,
      text,
      ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
      tags: [
        { name: "feature", value: "contact_form" },
        { name: "environment", value: env.NODE_ENV },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Contact email delivery failed: status=${response.status}`);
  }
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
