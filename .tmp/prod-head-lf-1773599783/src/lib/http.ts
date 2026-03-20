import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

function toRetryAfterSeconds(details: unknown) {
  if (!details || typeof details !== "object") {
    return null;
  }

  const maybeRetryAfterMs = (details as { retryAfterMs?: unknown }).retryAfterMs;
  if (typeof maybeRetryAfterMs !== "number" || !Number.isFinite(maybeRetryAfterMs)) {
    return null;
  }

  if (maybeRetryAfterMs < 0) {
    return null;
  }

  return Math.ceil(maybeRetryAfterMs / 1000);
}

export function fail(message: string, status = 400, details?: unknown) {
  const headers = new Headers();
  if (status === 429) {
    const retryAfterSeconds = toRetryAfterSeconds(details);
    if (retryAfterSeconds !== null) {
      headers.set("Retry-After", String(retryAfterSeconds));
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        message,
        details,
      },
    },
    {
      status,
      headers,
    },
  );
}
