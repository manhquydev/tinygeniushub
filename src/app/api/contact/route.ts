import { z } from "zod";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { enqueueTransactionalEmail } from "@/worker/queue";

const contactPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  subject: z.enum(["Technical support", "Collaboration / B2B", "Report error", "Other"]),
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
    "Request new contact from TinyGenius Hub website",
    `Full name:${payload.name}`,
    `Email: ${payload.email}`,
    `Topic:${payload.subject}`,
    `IP: ${clientIp}`,
    "",
    "Content:",
    payload.message,
  ].join("\n");

  await enqueueTransactionalEmail({
    to: recipient,
    subject: `[Contact]${payload.subject} - ${payload.name}`,
    text,
    tags: [{ name: "feature", value: "contact_form" }],
  });
}

async function sendContactAcknowledgementEmail(payload: z.infer<typeof contactPayloadSchema>) {
  const text = [
    `Hello${payload.name},`,
    "",
    "TinyGenius Hub has received your support request.",
    `Topic:${payload.subject}`,
    "The team will respond as soon as possible.",
    "",
    "Content you sent:",
    payload.message,
  ].join("\n");

  await enqueueTransactionalEmail({
    to: payload.email,
    subject: `[TinyGenius Hub] Request received:${payload.subject}`,
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
      return fail("You submitted the form too quickly. Please try again later.", 429, {
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
      message: "Your message has been received",
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "contact.submit",
      ip: clientIp,
    });
  }
}
