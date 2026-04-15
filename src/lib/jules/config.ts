const DEFAULT_JULES_BASE_URL = "https://jules.googleapis.com";
const DEFAULT_FAILED_CI_RATE_LIMIT = 10;
const DEFAULT_LABEL_RATE_LIMIT = 20;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_FAILED_CI_PRIORITY_LOCK_SECONDS = 20 * 60;
const DEFAULT_AUDIT_MAX_EVENTS = 300;

function parseNumberEnv(
  rawValue: string | undefined,
  fallbackValue: number,
  options: { min: number; max: number },
) {
  if (!rawValue) {
    return fallbackValue;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return Math.min(Math.max(parsed, options.min), options.max);
}

function sanitizeSourceOverride(sourceOverride: string | undefined) {
  const trimmed = sourceOverride?.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("sources/github/")) {
    throw new Error("JULES_SOURCE must follow format: sources/github/<owner>/<repo>");
  }

  return trimmed;
}

function parseAllowlist(rawValue: string | undefined) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export type JulesRuntimeConfig = {
  baseUrl: string;
  apiKey: string;
  sourceOverride: string | null;
  webhookToken: string;
  failedCiRateLimit: number;
  labelRateLimit: number;
  rateLimitWindowMs: number;
  failedCiPriorityLockSeconds: number;
  auditMaxEvents: number;
  workflowAllowlist: string[];
};

export function getJulesRuntimeConfig(): JulesRuntimeConfig {
  const apiKey = process.env.JULES_API_KEY?.trim() ?? "";
  const webhookToken = process.env.JULES_ORCHESTRATOR_WEBHOOK_TOKEN?.trim() ?? "";

  if (!apiKey) {
    throw new Error("JULES_API_KEY is required for Jules integration routes");
  }

  if (!webhookToken) {
    throw new Error("JULES_ORCHESTRATOR_WEBHOOK_TOKEN is required for Jules webhook routes");
  }

  const baseUrl = process.env.JULES_BASE_URL?.trim() || DEFAULT_JULES_BASE_URL;

  return {
    baseUrl,
    apiKey,
    sourceOverride: sanitizeSourceOverride(process.env.JULES_SOURCE),
    webhookToken,
    failedCiRateLimit: parseNumberEnv(process.env.JULES_WEBHOOK_FAILED_CI_LIMIT, DEFAULT_FAILED_CI_RATE_LIMIT, {
      min: 1,
      max: 500,
    }),
    labelRateLimit: parseNumberEnv(process.env.JULES_WEBHOOK_LABEL_LIMIT, DEFAULT_LABEL_RATE_LIMIT, {
      min: 1,
      max: 1000,
    }),
    rateLimitWindowMs:
      parseNumberEnv(process.env.JULES_WEBHOOK_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_WINDOW_SECONDS, {
        min: 10,
        max: 3600,
      }) * 1000,
    failedCiPriorityLockSeconds: parseNumberEnv(
      process.env.JULES_FAILED_CI_PRIORITY_LOCK_SECONDS,
      DEFAULT_FAILED_CI_PRIORITY_LOCK_SECONDS,
      {
        min: 30,
        max: 86400,
      },
    ),
    auditMaxEvents: parseNumberEnv(process.env.JULES_AUDIT_MAX_EVENTS, DEFAULT_AUDIT_MAX_EVENTS, {
      min: 20,
      max: 5000,
    }),
    workflowAllowlist: parseAllowlist(process.env.JULES_FAILED_CI_WORKFLOW_ALLOWLIST),
  };
}

export function resolveJulesSource(repoFullName: string, sourceOverride: string | null) {
  if (sourceOverride) {
    return sourceOverride;
  }

  const trimmed = repoFullName.trim();
  if (!trimmed.includes("/")) {
    throw new Error(`Invalid repository full name: ${repoFullName}`);
  }

  return `sources/github/${trimmed}`;
}

