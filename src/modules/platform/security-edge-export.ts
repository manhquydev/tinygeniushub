import type { AdminSecurityControls } from "@/modules/platform/security-policy";

export type AdminRateLimitPolicyRow = {
  key: string;
  label: string;
  description: string;
  keyStrategy: string;
  defaultLimit: number;
  defaultWindowMs: number;
  minLimit: number;
  maxLimit: number;
  minWindowMs: number;
  maxWindowMs: number;
  currentLimit: number;
  currentWindowMs: number;
  effectiveLimit: number;
  effectiveWindowMs: number;
};

type EdgeRouteTemplate = {
  routeId: string;
  pathPattern: string;
  method: string;
  policyKey: string;
  riskTier: "critical" | "high" | "medium";
  cloudflareExpression: string;
};

const edgeRouteTemplates: EdgeRouteTemplate[] = [
  {
    routeId: "auth_login",
    pathPattern: "/api/auth/login",
    method: "POST",
    policyKey: "auth.login.ip",
    riskTier: "critical",
    cloudflareExpression: '(http.request.uri.path eq "/api/auth/login" and http.request.method eq "POST")',
  },
  {
    routeId: "auth_signup",
    pathPattern: "/api/auth/signup",
    method: "POST",
    policyKey: "auth.signup.ip",
    riskTier: "critical",
    cloudflareExpression: '(http.request.uri.path eq "/api/auth/signup" and http.request.method eq "POST")',
  },
  {
    routeId: "auth_logout",
    pathPattern: "/api/auth/logout",
    method: "POST",
    policyKey: "auth.logout.ip",
    riskTier: "medium",
    cloudflareExpression: '(http.request.uri.path eq "/api/auth/logout" and http.request.method eq "POST")',
  },
  {
    routeId: "admin_security_rate_limits_mutation",
    pathPattern: "/api/admin/security/rate-limits",
    method: "PATCH",
    policyKey: "admin.mutation.ip",
    riskTier: "high",
    cloudflareExpression:
      '(http.request.uri.path eq "/api/admin/security/rate-limits" and http.request.method eq "PATCH")',
  },
  {
    routeId: "admin_trial_flag_mutation",
    pathPattern: "/api/admin/lessons/*/trial-flag",
    method: "PATCH",
    policyKey: "admin.mutation.ip",
    riskTier: "high",
    cloudflareExpression:
      '(starts_with(http.request.uri.path, "/api/admin/lessons/") and ends_with(http.request.uri.path, "/trial-flag") and http.request.method eq "PATCH")',
  },
  {
    routeId: "admin_payment_reconcile_mutation",
    pathPattern: "/api/admin/payments/*/reconcile",
    method: "POST",
    policyKey: "admin.mutation.ip",
    riskTier: "critical",
    cloudflareExpression:
      '(starts_with(http.request.uri.path, "/api/admin/payments/") and ends_with(http.request.uri.path, "/reconcile") and http.request.method eq "POST")',
  },
  {
    routeId: "children_mutation",
    pathPattern: "/api/children*",
    method: "POST|PATCH|DELETE",
    policyKey: "children.mutation.ip",
    riskTier: "high",
    cloudflareExpression:
      '((http.request.uri.path eq "/api/children" and http.request.method eq "POST") or (starts_with(http.request.uri.path, "/api/children/") and (http.request.method eq "PATCH" or http.request.method eq "DELETE")))',
  },
  {
    routeId: "referrals_claim",
    pathPattern: "/api/referrals/claim",
    method: "POST",
    policyKey: "referrals.claim.ip",
    riskTier: "medium",
    cloudflareExpression: '(http.request.uri.path eq "/api/referrals/claim" and http.request.method eq "POST")',
  },
  {
    routeId: "watch_session",
    pathPattern: "/api/lessons/*/watch/session",
    method: "POST",
    policyKey: "learning.watch.session.ip",
    riskTier: "high",
    cloudflareExpression:
      '(starts_with(http.request.uri.path, "/api/lessons/") and ends_with(http.request.uri.path, "/watch/session") and http.request.method eq "POST")',
  },
  {
    routeId: "watch_heartbeat",
    pathPattern: "/api/lessons/*/watch/heartbeat",
    method: "POST",
    policyKey: "learning.watch.heartbeat.ip",
    riskTier: "high",
    cloudflareExpression:
      '(starts_with(http.request.uri.path, "/api/lessons/") and ends_with(http.request.uri.path, "/watch/heartbeat") and http.request.method eq "POST")',
  },
  {
    routeId: "watch_complete",
    pathPattern: "/api/lessons/*/watch",
    method: "POST",
    policyKey: "learning.watch.complete.ip",
    riskTier: "high",
    cloudflareExpression:
      '(starts_with(http.request.uri.path, "/api/lessons/") and ends_with(http.request.uri.path, "/watch") and http.request.method eq "POST")',
  },
  {
    routeId: "lesson_complete",
    pathPattern: "/api/lessons/*/complete",
    method: "POST",
    policyKey: "learning.watch.complete.ip",
    riskTier: "high",
    cloudflareExpression:
      '(starts_with(http.request.uri.path, "/api/lessons/") and ends_with(http.request.uri.path, "/complete") and http.request.method eq "POST")',
  },
  {
    routeId: "billing_webhook",
    pathPattern: "/api/billing/webhooks/mock",
    method: "POST",
    policyKey: "billing.webhook.mock.ip",
    riskTier: "critical",
    cloudflareExpression: '(http.request.uri.path eq "/api/billing/webhooks/mock" and http.request.method eq "POST")',
  },
  {
    routeId: "billing_webhook_stripe",
    pathPattern: "/api/billing/webhooks/stripe",
    method: "POST",
    policyKey: "billing.webhook.stripe.ip",
    riskTier: "critical",
    cloudflareExpression: '(http.request.uri.path eq "/api/billing/webhooks/stripe" and http.request.method eq "POST")',
  },
  {
    routeId: "billing_webhook_payos",
    pathPattern: "/api/billing/webhooks/payos",
    method: "POST",
    policyKey: "billing.webhook.payos.ip",
    riskTier: "critical",
    cloudflareExpression: '(http.request.uri.path eq "/api/billing/webhooks/payos" and http.request.method eq "POST")',
  },
  {
    routeId: "billing_checkout",
    pathPattern: "/api/billing/checkout",
    method: "POST",
    policyKey: "billing.checkout.ip",
    riskTier: "high",
    cloudflareExpression: '(http.request.uri.path eq "/api/billing/checkout" and http.request.method eq "POST")',
  },
  {
    routeId: "courses_checkout_return",
    pathPattern: "/api/courses/checkout/return",
    method: "GET",
    policyKey: "courses.checkout.return.ip",
    riskTier: "high",
    cloudflareExpression:
      '(http.request.uri.path eq "/api/courses/checkout/return" and http.request.method eq "GET")',
  },
  {
    routeId: "reports_generate",
    pathPattern: "/api/reports/generate",
    method: "POST",
    policyKey: "reports.generate.ip",
    riskTier: "medium",
    cloudflareExpression: '(http.request.uri.path eq "/api/reports/generate" and http.request.method eq "POST")',
  },
  {
    routeId: "reports_send_email",
    pathPattern: "/api/reports/send-email",
    method: "POST",
    policyKey: "reports.sendEmail.ip",
    riskTier: "medium",
    cloudflareExpression: '(http.request.uri.path eq "/api/reports/send-email" and http.request.method eq "POST")',
  },
  {
    routeId: "evidence_upload_url",
    pathPattern: "/api/evidence/media/upload-url",
    method: "POST",
    policyKey: "evidence.uploadUrl.ip",
    riskTier: "high",
    cloudflareExpression: '(http.request.uri.path eq "/api/evidence/media/upload-url" and http.request.method eq "POST")',
  },
  {
    routeId: "storage_mock_upload",
    pathPattern: "/api/storage/mock-upload",
    method: "PUT",
    policyKey: "storage.mockUpload.ip",
    riskTier: "high",
    cloudflareExpression: '(http.request.uri.path eq "/api/storage/mock-upload" and http.request.method eq "PUT")',
  },
  {
    routeId: "health_ready",
    pathPattern: "/api/health/ready",
    method: "GET",
    policyKey: "health.ready.ip",
    riskTier: "critical",
    cloudflareExpression: '(http.request.uri.path eq "/api/health/ready" and http.request.method eq "GET")',
  },
];

function toPeriodSeconds(windowMs: number) {
  return Math.max(10, Math.ceil(windowMs / 1000));
}

function resolveMitigationAction(input: {
  ddosMode: AdminSecurityControls["ddosMode"];
  riskTier: EdgeRouteTemplate["riskTier"];
}) {
  if (input.ddosMode === "emergency") {
    if (input.riskTier === "critical") {
      return "block";
    }
    return "managed_challenge";
  }

  if (input.ddosMode === "elevated") {
    if (input.riskTier === "critical" || input.riskTier === "high") {
      return "managed_challenge";
    }
    return "js_challenge";
  }

  if (input.riskTier === "critical") {
    return "managed_challenge";
  }
  return "log";
}

export function buildSecurityEdgePolicyExport(input: {
  controls: AdminSecurityControls;
  policies: AdminRateLimitPolicyRow[];
}) {
  const policyByKey = new Map(input.policies.map((item) => [item.key, item]));

  const routePolicies = edgeRouteTemplates
    .map((template) => {
      const policy = policyByKey.get(template.policyKey);
      if (!policy) {
        return null;
      }

      const periodSeconds = toPeriodSeconds(policy.effectiveWindowMs);
      return {
        routeId: template.routeId,
        pathPattern: template.pathPattern,
        method: template.method,
        riskTier: template.riskTier,
        policyKey: policy.key,
        appPolicy: {
          limit: policy.currentLimit,
          windowMs: policy.currentWindowMs,
        },
        runtimePolicy: {
          limit: policy.effectiveLimit,
          windowMs: policy.effectiveWindowMs,
        },
        edgeRecommendation: {
          requestsPerPeriod: policy.effectiveLimit,
          periodSeconds,
          mitigationTimeoutSeconds: Math.max(periodSeconds, 60),
          action: resolveMitigationAction({
            ddosMode: input.controls.ddosMode,
            riskTier: template.riskTier,
          }),
          cloudflareExpression: template.cloudflareExpression,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    version: "2026-02-21",
    generatedAt: new Date().toISOString(),
    profile: {
      ddosMode: input.controls.ddosMode,
      globalLimitMultiplier: input.controls.globalLimitMultiplier,
    },
    ipControls: {
      blockedIpCidrs: input.controls.blockedIpCidrs,
      readinessAllowlistCidrs: input.controls.readinessAllowlistCidrs,
    },
    providerHints: {
      cloudflare: {
        notes: [
          "Apply route policies as custom WAF/rate-limit rules.",
          "Sync blockedIpCidrs and readinessAllowlistCidrs with edge IP lists/rules.",
          "Prefer managed_challenge before block outside emergency mode.",
        ],
      },
    },
    routes: routePolicies,
  };
}
