import { z } from "zod";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { enqueueTransactionalEmail } from "@/worker/queue";

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
    await enqueueTransactionalEmail({
      to: adminRecipient,
      subject: "[Waitlist] New registration",
      text: [
        "There is a new waitlist registration from the website.",
        `Email: ${email}`,
        `Baby's age:${childAge ?? "does not provide"}`,
        `IP: ${ip}`,
      ].join("\n"),
      tags: [{ name: "feature", value: "waitlist_admin" }],
    });
  }

  await enqueueTransactionalEmail({
    to: email,
    subject: "Waitlist registration received",
    text: [
      "TinyGenius Hub has received your registration.",
      childAge ? `Baby age information:${childAge}year old.` : "You have not provided the child's age.",
      "The team will send updates soon via this email.",
      "",
      "Best regards,",
      "TinyGenius Hub",
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
