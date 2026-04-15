import { z } from "zod";
import { fail, ok } from "@/lib/http";
import { logError, logInfo } from "@/lib/observability/logger";
import { getJulesRuntimeConfig } from "@/lib/jules/config";
import { recordJulesAuditEvent } from "@/lib/jules/audit-store";

const sessionFeedbackSchema = z.object({
  repo: z.string().min(3),
  sessionId: z.string().min(1),
  sessionUrl: z.string().url().optional(),
  state: z.string().min(1),
  trigger: z.enum(["failed_ci", "issue_label", "feedback", "manual"]).default("feedback"),
  note: z.string().optional(),
});

function normalizeAuthorizationToken(headerValue: string | null) {
  if (!headerValue || !headerValue.startsWith("Bearer ")) {
    return null;
  }

  return headerValue.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  const routeName = "jules.session_feedback";

  try {
    const config = getJulesRuntimeConfig();
    const token = normalizeAuthorizationToken(request.headers.get("authorization"));
    if (token !== config.webhookToken) {
      return fail("Unauthorized", 401);
    }

    const payload = sessionFeedbackSchema.parse(await request.json());
    const event = await recordJulesAuditEvent(
      {
        repo: payload.repo,
        trigger: payload.trigger,
        outcome: "updated",
        sessionId: payload.sessionId,
        sessionUrl: payload.sessionUrl,
        detail: {
          state: payload.state,
          note: payload.note,
        },
      },
      config.auditMaxEvents,
    );

    logInfo(`${routeName}.recorded`, {
      repo: payload.repo,
      sessionId: payload.sessionId,
      state: payload.state,
    });

    return ok({ status: "recorded", event });
  } catch (error) {
    logError(`${routeName}.failed`, { error });
    return fail("Failed to record session feedback", 500, {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

