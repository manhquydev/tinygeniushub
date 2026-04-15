const SENSITIVE_LABEL_AUTH = "scope:auth";
const SENSITIVE_LABEL_BILLING = "scope:billing";
export const SENSITIVE_OPT_IN_LABEL = "jules:sensitive-opt-in";

const AUTH_KEYWORDS = [
  "auth",
  "login",
  "logout",
  "session",
  "token",
  "cookie",
  "password",
  "oauth",
  "better auth",
];

const BILLING_KEYWORDS = [
  "billing",
  "payment",
  "checkout",
  "invoice",
  "stripe",
  "payos",
  "webhook",
  "refund",
  "subscription",
];

const NON_SENSITIVE_GUARDRAIL = [
  "Hard guardrails:",
  "- Do not edit authentication/session/cookie code.",
  "- Do not edit billing/payment/checkout/webhook logic.",
  "- Do not edit prisma migrations or schema.",
  "- Do not edit deployment workflows or environment files.",
  "- If a fix requires any restricted scope, stop and report why.",
].join("\n");

function lowerCaseList(values: string[]) {
  return values.map((value) => value.trim().toLowerCase());
}

function hasKeyword(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export type JulesSensitivity = {
  mentionsAuth: boolean;
  mentionsBilling: boolean;
  requiresExplicitOptIn: boolean;
  reason: string;
};

export function evaluateJulesSensitivity(input: {
  labels: string[];
  title?: string;
  body?: string;
}): JulesSensitivity {
  const labels = lowerCaseList(input.labels);
  const combinedText = `${input.title ?? ""}\n${input.body ?? ""}`.trim();

  const labelAuth = labels.includes(SENSITIVE_LABEL_AUTH);
  const labelBilling = labels.includes(SENSITIVE_LABEL_BILLING);
  const textAuth = combinedText.length > 0 && hasKeyword(combinedText, AUTH_KEYWORDS);
  const textBilling = combinedText.length > 0 && hasKeyword(combinedText, BILLING_KEYWORDS);

  const mentionsAuth = labelAuth || textAuth;
  const mentionsBilling = labelBilling || textBilling;

  if (mentionsAuth && mentionsBilling) {
    return {
      mentionsAuth: true,
      mentionsBilling: true,
      requiresExplicitOptIn: true,
      reason: "Issue touches both auth and billing scopes",
    };
  }

  if (mentionsAuth) {
    return {
      mentionsAuth: true,
      mentionsBilling: false,
      requiresExplicitOptIn: true,
      reason: "Issue touches auth scope",
    };
  }

  if (mentionsBilling) {
    return {
      mentionsAuth: false,
      mentionsBilling: true,
      requiresExplicitOptIn: true,
      reason: "Issue touches billing scope",
    };
  }

  return {
    mentionsAuth: false,
    mentionsBilling: false,
    requiresExplicitOptIn: false,
    reason: "Issue is non-sensitive",
  };
}

export function hasSensitiveOptInLabel(labels: string[]) {
  return lowerCaseList(labels).includes(SENSITIVE_OPT_IN_LABEL);
}

export function getNonSensitiveGuardrailText() {
  return NON_SENSITIVE_GUARDRAIL;
}

