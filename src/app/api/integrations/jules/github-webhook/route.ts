import { z } from "zod";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/http";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import { getJulesRuntimeConfig, resolveJulesSource } from "@/lib/jules/config";
import { createJulesSession } from "@/lib/jules/jules-client";
import {
  getNonSensitiveGuardrailText,
  hasSensitiveOptInLabel,
  evaluateJulesSensitivity,
} from "@/lib/jules/security-boundary";
import {
  hasFailedCiPriorityLock,
  recordJulesAuditEvent,
  setFailedCiPriorityLock,
} from "@/lib/jules/audit-store";

const failedCiSchema = z.object({
  trigger: z.literal("failed_ci"),
  repo: z.string().min(3),
  workflowName: z.string().min(1),
  runId: z.union([z.number().int(), z.string().min(1)]),
  runUrl: z.string().url(),
  branch: z.string().min(1),
  sha: z.string().min(7),
  conclusion: z.string().default("failure"),
  failureSummary: z.string().optional(),
});

const issueLabelSchema = z.object({
  trigger: z.literal("issue_label"),
  repo: z.string().min(3),
  issueNumber: z.number().int().positive(),
  issueUrl: z.string().url(),
  issueTitle: z.string().min(1),
  issueBody: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

const webhookPayloadSchema = z.discriminatedUnion("trigger", [failedCiSchema, issueLabelSchema]);

function normalizeAuthorizationToken(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  if (!headerValue.startsWith("Bearer ")) {
    return null;
  }

  return headerValue.slice("Bearer ".length).trim();
}

function buildFailedCiPrompt(payload: z.infer<typeof failedCiSchema>) {
  const extraSummary = payload.failureSummary?.trim()
    ? `Failure summary from CI logs:\n${payload.failureSummary.trim()}`
    : "Failure summary: not provided by trigger payload.";

  return [
    "You are operating in automated CI remediation mode.",
    `Repository: ${payload.repo}`,
    `Workflow: ${payload.workflowName}`,
    `Run URL: ${payload.runUrl}`,
    `Branch: ${payload.branch}`,
    `Commit: ${payload.sha}`,
    "",
    "Primary objective:",
    "- Fix failing tests, lint, type-check, or build failures with the smallest safe patch.",
    "",
    extraSummary,
    "",
    getNonSensitiveGuardrailText(),
    "",
    "Execution constraints:",
    "- Keep changes scoped to failure remediation.",
    "- Include tests when necessary to prevent regression.",
    "- If blocked by restricted scopes, stop and explain in PR notes.",
  ].join("\n");
}

function buildIssuePrompt(input: {
  payload: z.infer<typeof issueLabelSchema>;
  sensitive: ReturnType<typeof evaluateJulesSensitivity>;
}) {
  const header = [
    "You are operating in issue-driven remediation mode.",
    `Repository: ${input.payload.repo}`,
    `Issue: #${input.payload.issueNumber} - ${input.payload.issueTitle}`,
    `Issue URL: ${input.payload.issueUrl}`,
    "",
    "Issue body:",
    input.payload.issueBody?.trim() || "(empty)",
    "",
  ];

  if (!input.sensitive.requiresExplicitOptIn) {
    return [
      ...header,
      getNonSensitiveGuardrailText(),
      "",
      "Primary objective:",
      "- Implement only what is required to resolve this issue.",
      "- Keep public APIs unchanged unless issue explicitly requires a change.",
      "- If sensitive scope is required, stop and report clearly.",
    ].join("\n");
  }

  return [
    ...header,
    "Sensitive scope has explicit opt-in approval for this task.",
    `Sensitivity reason: ${input.sensitive.reason}`,
    "",
    "Hard constraints:",
    "- Produce a conservative, reviewable plan before code execution.",
    "- Do not broaden scope beyond issue requirements.",
    "- Focus only on approved sensitive areas and required tests.",
  ].join("\n");
}

export async function POST(request: Request) {
  const routeName = "jules.github_webhook";

  try {
    const config = getJulesRuntimeConfig();
    const token = normalizeAuthorizationToken(request.headers.get("authorization"));
    if (token !== config.webhookToken) {
      await recordJulesAuditEvent(
        {
          repo: "unknown",
          trigger: "manual",
          outcome: "blocked",
          detail: { reason: "unauthorized_webhook_access" },
        },
        config.auditMaxEvents,
      );
      return fail("Unauthorized", 401);
    }

    const payload = webhookPayloadSchema.parse(await request.json());
    const clientIp = getRequestIp(request);
    const rateIdentity = buildRateLimitIdentity(`${payload.trigger}:${payload.repo}:${clientIp}`);
    const limit = payload.trigger === "failed_ci" ? config.failedCiRateLimit : config.labelRateLimit;
    const rateResult = await enforceRateLimit({
      key: `jules:webhook:${rateIdentity}`,
      limit,
      windowMs: config.rateLimitWindowMs,
      storeFailureMode: "deny",
    });

    if (!rateResult.allowed) {
      logWarn(`${routeName}.rate_limited`, { trigger: payload.trigger, repo: payload.repo, rateResult });
      await recordJulesAuditEvent(
        {
          repo: payload.repo,
          trigger: payload.trigger,
          outcome: "blocked",
          detail: { reason: "rate_limited", rateResult },
        },
        config.auditMaxEvents,
      );
      return fail("Rate limited", 429, rateResult);
    }

    if (payload.trigger === "failed_ci") {
      if (payload.conclusion.toLowerCase() !== "failure") {
        return ok({ status: "ignored", reason: "workflow_conclusion_not_failure" }, { status: 202 });
      }

      if (
        config.workflowAllowlist.length > 0 &&
        !config.workflowAllowlist.includes(payload.workflowName)
      ) {
        return ok(
          {
            status: "ignored",
            reason: "workflow_not_in_allowlist",
            workflowName: payload.workflowName,
          },
          { status: 202 },
        );
      }

      const session = await createJulesSession({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        title: `CI Auto-Remediation: ${payload.workflowName} #${payload.runId}`,
        prompt: buildFailedCiPrompt(payload),
        source: resolveJulesSource(payload.repo, config.sourceOverride),
        startingBranch: payload.branch,
        requirePlanApproval: true,
        automationMode: "AUTO_CREATE_PR",
      });

      await setFailedCiPriorityLock(payload.repo, config.failedCiPriorityLockSeconds);
      await recordJulesAuditEvent(
        {
          repo: payload.repo,
          trigger: "failed_ci",
          outcome: "created",
          sessionId: session.id,
          sessionUrl: session.url,
          detail: {
            workflowName: payload.workflowName,
            runId: payload.runId,
            runUrl: payload.runUrl,
            branch: payload.branch,
          },
        },
        config.auditMaxEvents,
      );

      logInfo(`${routeName}.session_created`, {
        trigger: payload.trigger,
        repo: payload.repo,
        sessionId: session.id,
      });

      return ok({ status: "created", session });
    }

    if (await hasFailedCiPriorityLock(payload.repo)) {
      await recordJulesAuditEvent(
        {
          repo: payload.repo,
          trigger: "issue_label",
          outcome: "skipped",
          detail: { reason: "failed_ci_priority_lock_active" },
        },
        config.auditMaxEvents,
      );
      return ok({ status: "skipped", reason: "failed_ci_priority_lock_active" }, { status: 202 });
    }

    const sensitivity = evaluateJulesSensitivity({
      labels: payload.labels,
      title: payload.issueTitle,
      body: payload.issueBody,
    });
    const sensitiveOptIn = hasSensitiveOptInLabel(payload.labels);

    if (sensitivity.requiresExplicitOptIn && !sensitiveOptIn) {
      await recordJulesAuditEvent(
        {
          repo: payload.repo,
          trigger: "issue_label",
          outcome: "blocked",
          detail: {
            reason: "sensitive_scope_requires_opt_in",
            sensitivityReason: sensitivity.reason,
            issueNumber: payload.issueNumber,
          },
        },
        config.auditMaxEvents,
      );
      return fail("Sensitive scope requires explicit opt-in label", 403, {
        requiredLabel: "jules:sensitive-opt-in",
        sensitivityReason: sensitivity.reason,
      });
    }

    const session = await createJulesSession({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      title: `Issue Auto-Remediation: #${payload.issueNumber}`,
      prompt: buildIssuePrompt({ payload, sensitive: sensitivity }),
      source: resolveJulesSource(payload.repo, config.sourceOverride),
      startingBranch: "main",
      requirePlanApproval: true,
      automationMode: sensitivity.requiresExplicitOptIn ? undefined : "AUTO_CREATE_PR",
    });

    await recordJulesAuditEvent(
      {
        repo: payload.repo,
        trigger: "issue_label",
        outcome: "created",
        sessionId: session.id,
        sessionUrl: session.url,
        detail: {
          issueNumber: payload.issueNumber,
          issueUrl: payload.issueUrl,
          labels: payload.labels,
          sensitivityReason: sensitivity.reason,
        },
      },
      config.auditMaxEvents,
    );

    logInfo(`${routeName}.session_created`, {
      trigger: payload.trigger,
      repo: payload.repo,
      sessionId: session.id,
      sensitive: sensitivity.requiresExplicitOptIn,
    });

    return ok({ status: "created", session, sensitivity });
  } catch (error) {
    logError(`${routeName}.failed`, { error });
    try {
      const config = getJulesRuntimeConfig();
      await recordJulesAuditEvent(
        {
          repo: "unknown",
          trigger: "manual",
          outcome: "error",
          detail: {
            reason: "exception",
            message: error instanceof Error ? error.message : String(error),
          },
        },
        config.auditMaxEvents,
      );
    } catch {}
    return fail("Failed to process Jules webhook", 500, {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

