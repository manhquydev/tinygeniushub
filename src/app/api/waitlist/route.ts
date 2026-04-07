import { z } from "zod";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";

const schema = z.object({
  email: z.string().email().max(254),
  childAge: z.coerce.number().int().min(1).max(8).optional(),
});

// 3 submissions per IP per hour
const WAITLIST_WINDOW_MS = 60 * 60 * 1000;
const WAITLIST_LIMIT = 3;

async function sendWaitlistEmails(email: string, childAge: number | null, ip: string) {
  const adminRecipient = env.ADMIN_EMAILS[0] ?? env.REPORT_EMAIL_FROM;

  if (adminRecipient) {
    await sendTransactionalEmail({
      to: adminRecipient,
      subject: "[Waitlist] Đăng ký mới",
      text: [
        "Có đăng ký waitlist mới từ website.",
        `Email: ${email}`,
        `Độ tuổi bé: ${childAge ?? "không cung cấp"}`,
        `IP: ${ip}`,
      ].join("\n"),
      tags: [{ name: "feature", value: "waitlist_admin" }],
    });
  }

  await sendTransactionalEmail({
    to: email,
    subject: "Đã nhận đăng ký danh sách chờ",
    text: [
      "Cùng Con Tự Học đã nhận đăng ký của bạn.",
      childAge ? `Thông tin độ tuổi bé: ${childAge} tuổi.` : "Bạn chưa cung cấp độ tuổi bé.",
      "Đội ngũ sẽ gửi cập nhật sớm qua email này.",
      "",
      "Trân trọng,",
      "Cùng Con Tự Học",
    ].join("\n"),
    tags: [{ name: "feature", value: "waitlist_confirmation" }],
  });
}

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const rateLimit = await enforceRateLimit({
      key: `waitlist:${ip}`,
      limit: WAITLIST_LIMIT,
      windowMs: WAITLIST_WINDOW_MS,
      storeFailureMode: "deny",
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many submissions. Please try again later.",
          retryAfterMs: rateLimit.retryAfterMs ?? WAITLIST_WINDOW_MS,
        },
        {
          status: 429,
          headers:
            typeof rateLimit.retryAfterMs === "number" && rateLimit.retryAfterMs > 0
              ? {
                  "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
                }
              : undefined,
        },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const childAge = parsed.data.childAge ?? null;

    // Keep log stream for ops; upgrade to DB table when waitlist volume grows.
    logInfo("waitlist_signup", {
      email: normalizedEmail,
      childAge,
      ip,
    });

    try {
      await sendWaitlistEmails(normalizedEmail, childAge, ip);
    } catch (error) {
      logWarn("waitlist_signup_email_failed", {
        email: normalizedEmail,
        childAge,
        ip,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
