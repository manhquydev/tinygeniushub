import { createHash } from "node:crypto";
import { EmailStatus, WebhookStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { logWarn } from "@/lib/observability/logger";
import { handleRouteError } from "@/lib/route-error";

type BrevoEventPayload = Record<string, unknown>;

function normalizeEvents(payload: unknown): BrevoEventPayload[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is BrevoEventPayload =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.events)) {
      return normalizeEvents(record.events);
    }

    return [record];
  }

  return [];
}

function parseTagStrings(event: BrevoEventPayload) {
  const tags = event.tags;
  const tag = event.tag;
  const result: string[] = [];

  if (typeof tags === "string" && tags.trim().length > 0) {
    result.push(...tags.split(",").map((item) => item.trim()).filter(Boolean));
  } else if (Array.isArray(tags)) {
    for (const value of tags) {
      if (typeof value === "string" && value.trim().length > 0) {
        result.push(value.trim());
      }
    }
  }

  if (typeof tag === "string" && tag.trim().length > 0) {
    result.push(tag.trim());
  }

  return result;
}

function toTagMap(tags: string[]) {
  const map = new Map<string, string>();

  for (const entry of tags) {
    const separator = entry.includes(":") ? ":" : entry.includes("=") ? "=" : null;
    if (!separator) {
      continue;
    }

    const [rawKey, ...rest] = entry.split(separator);
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(separator).trim();
    if (key.length === 0 || value.length === 0) {
      continue;
    }
    map.set(key, value);
  }

  return map;
}

function normalizeBrevoEventType(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function isAuthorizedWebhookRequest(request: Request) {
  const secret = env.REPORT_EMAIL_BREVO_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    return true;
  }

  const normalizedSecret = secret.trim();
  const authorization = request.headers.get("authorization");
  const tokenFromHeader = request.headers.get("x-webhook-token");
  const tokenFromQuery = new URL(request.url).searchParams.get("token");

  const bearerToken = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice("bearer ".length).trim()
    : null;

  return (
    tokenFromHeader === normalizedSecret ||
    tokenFromQuery === normalizedSecret ||
    bearerToken === normalizedSecret
  );
}

function buildEventId(event: BrevoEventPayload, index: number, eventType: string) {
  const rawEventId =
    event["message-id"] ??
    event.messageId ??
    event.event_id ??
    event.id ??
    event.uuid;

  if (typeof rawEventId === "string" && rawEventId.trim().length > 0) {
    return rawEventId.trim();
  }

  const stableSource = JSON.stringify(event);
  const hash = createHash("sha256").update(stableSource).digest("hex").slice(0, 24);
  return `${eventType || "unknown"}:${index}:${hash}`;
}

async function updateWeeklyReportEngagement(eventType: string, tags: Map<string, string>) {
  const weeklyReportId = tags.get("weekly_report_id");
  if (!weeklyReportId) {
    return false;
  }

  if (eventType === "click" || eventType === "clicked") {
    const updated = await prisma.weeklyReport.updateMany({
      where: {
        id: weeklyReportId,
        emailStatus: {
          in: [EmailStatus.SENT, EmailStatus.OPENED, EmailStatus.CLICKED],
        },
      },
      data: {
        emailStatus: EmailStatus.CLICKED,
      },
    });
    return updated.count > 0;
  }

  if (eventType === "open" || eventType === "opened") {
    const updated = await prisma.weeklyReport.updateMany({
      where: {
        id: weeklyReportId,
        emailStatus: {
          in: [EmailStatus.SENT, EmailStatus.OPENED],
        },
      },
      data: {
        emailStatus: EmailStatus.OPENED,
      },
    });
    return updated.count > 0;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    if (env.REPORT_EMAIL_PROVIDER !== "brevo") {
      return ok({
        provider: env.REPORT_EMAIL_PROVIDER,
        processed: 0,
        ignored: 0,
        failed: 0,
      });
    }

    const signatureValid = isAuthorizedWebhookRequest(request);
    if (!signatureValid) {
      return fail("Unauthorized", 401);
    }

    const payload = await request.json();
    const events = normalizeEvents(payload);

    if (events.length === 0) {
      return ok({ processed: 0, ignored: 0, failed: 0, total: 0 });
    }

    let processed = 0;
    let ignored = 0;
    let failed = 0;

    for (const [index, event] of events.entries()) {
      const eventType = normalizeBrevoEventType(event.event ?? event.type);
      const eventId = buildEventId(event, index, eventType);
      const tags = toTagMap(parseTagStrings(event));

      let status: WebhookStatus = WebhookStatus.IGNORED;
      let errorMessage: string | null = null;

      try {
        const applied = await updateWeeklyReportEngagement(eventType, tags);
        if (applied) {
          status = WebhookStatus.PROCESSED;
          processed += 1;
        } else {
          ignored += 1;
        }
      } catch (error) {
        failed += 1;
        status = WebhookStatus.FAILED;
        errorMessage = error instanceof Error ? error.message : "Unknown error";
        logWarn("brevo.webhook.event_failed", {
          eventId,
          eventType,
          message: errorMessage,
        });
      }

      await prisma.webhookEvent.upsert({
        where: {
          provider_eventId: {
            provider: "brevo_email",
            eventId,
          },
        },
        create: {
          provider: "brevo_email",
          eventId,
          signatureValid,
          status,
          processedAt: new Date(),
          errorMessage,
          payload: event as Prisma.InputJsonValue,
        },
        update: {
          signatureValid,
          status,
          processedAt: new Date(),
          errorMessage,
          payload: event as Prisma.InputJsonValue,
        },
      });
    }

    return ok({
      provider: "brevo",
      total: events.length,
      processed,
      ignored,
      failed,
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "webhooks.brevo",
    });
  }
}
