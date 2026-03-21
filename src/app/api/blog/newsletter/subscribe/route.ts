import { z } from "zod";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { newsletterService } from "@/modules/blog/newsletter-service";

const payloadSchema = z.object({
  email: z.string().email(),
  nameVi: z.string().trim().min(1).max(120).optional(),
});

const IP_LIMIT = 10;
const IP_WINDOW_MS = 60_000;
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);

    const ip = getRequestIp(request);
    const ipRateLimit = await enforceRateLimit({
      key: `blog:newsletter:subscribe:ip:${buildRateLimitIdentity(ip)}`,
      limit: IP_LIMIT,
      windowMs: IP_WINDOW_MS,
      storeFailureMode: "deny",
    });
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please retry later." },
        {
          status: 429,
          headers:
            typeof ipRateLimit.retryAfterMs === "number" && ipRateLimit.retryAfterMs > 0
              ? { "Retry-After": String(Math.ceil(ipRateLimit.retryAfterMs / 1000)) }
              : undefined,
        },
      );
    }

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const emailRateLimit = await enforceRateLimit({
      key: `blog:newsletter:subscribe:email:${buildRateLimitIdentity(parsed.data.email)}`,
      limit: EMAIL_LIMIT,
      windowMs: EMAIL_WINDOW_MS,
      storeFailureMode: "deny",
    });
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please retry later." },
        {
          status: 429,
          headers:
            typeof emailRateLimit.retryAfterMs === "number" && emailRateLimit.retryAfterMs > 0
              ? { "Retry-After": String(Math.ceil(emailRateLimit.retryAfterMs / 1000)) }
              : undefined,
        },
      );
    }

    await newsletterService.subscribe(parsed.data.email, {
      nameVi: parsed.data.nameVi,
    });

    return NextResponse.json({ message: "Please check your email to confirm subscription" });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.newsletter.subscribe",
    });
  }
}
