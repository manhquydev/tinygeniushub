import { z } from "zod";
import { NextResponse } from "next/server";
import { logInfo } from "@/lib/observability/logger";
import { getRequestIp, enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";

const schema = z.object({
  email: z.string().email().max(254),
  childAge: z.coerce.number().int().min(1).max(8).optional(),
});

// 3 submissions per IP per hour
const WAITLIST_WINDOW_MS = 60 * 60 * 1000;
const WAITLIST_LIMIT = 3;

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    await enforceRateLimit({ key: `waitlist:${ip}`, limit: WAITLIST_LIMIT, windowMs: WAITLIST_WINDOW_MS });

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
        { status: 422 }
      );
    }

    const { email, childAge } = parsed.data;

    // Log entry — migrate to DB table when waitlist exceeds 500 entries
    logInfo("waitlist_signup", {
      email: email.toLowerCase().trim(),
      childAge: childAge ?? null,
      ip,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
