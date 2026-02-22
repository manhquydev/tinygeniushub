# Backend Security + DDoS Readiness Review

## Executive Summary
Current backend has a good baseline (schema validation, CSRF checks on state-changing routes, signed tokens for watch sessions, webhook signature validation), but DDoS and abuse resilience is not production-ready. The largest risks are request-amplification write paths, non-distributed rate limiting, and missing endpoint-level protections on high-frequency learning/video routes.

## Implementation Update (2026-02-21)
- Resolved: webhook signature fail-fast before DB operations at route layer (`src/app/api/billing/webhooks/mock/route.ts:24`).
- Resolved: webhook payload size guard to reduce body-based abuse (`src/app/api/billing/webhooks/mock/route.ts:24`).
- Resolved: distributed Redis-backed limiter foundation with in-memory fallback (`src/lib/rate-limit.ts:90`, `src/lib/rate-limit.ts:133`).
- Resolved: sensitive mutation endpoints now fail-closed when distributed limiter store is unavailable (`src/lib/rate-limit.ts:129` and route-level `storeFailureMode: "deny"` usage).
- Resolved: auth + watch + checkout + report + upload-url + readiness endpoints now have explicit throttling.
- Resolved: admin-configurable rate-limit policy layer with safe bounds and audit logging (`src/app/api/admin/security/rate-limits/route.ts:1`, `src/modules/platform/security-policy-service.ts:121`).
- Resolved: admin-configurable DDoS controls (`ddosMode`, `globalLimitMultiplier`, `blockedIpCidrs`, `readinessAllowlistCidrs`) with runtime enforcement on sensitive endpoints.
- Resolved: Better Auth trusted origins now use static env allowlist (`src/lib/auth/better-auth.ts:8`, `src/lib/env.ts:11`).
- Resolved: security headers baseline added in Next config (`next.config.ts:4`).
- Resolved: login/signup now enforce CSRF origin checks before auth mutations (`src/app/api/auth/login/route.ts:14`, `src/app/api/auth/signup/route.ts:13`).
- Resolved: CSRF layer now enforces Fetch Metadata (`Sec-Fetch-Site`) and referer fallback compatibility for unsafe methods (`src/lib/security/csrf.ts:52`).
- Resolved: CSRF behavior is covered by dedicated unit tests (`src/lib/security/__tests__/csrf.test.ts:1`).
- Resolved: CSP no longer enables `unsafe-eval` in production (`next.config.ts:5`, `next.config.ts:38`).
- Resolved: request IP extraction no longer trusts spoofable `x-real-ip` when proxy trust is disabled (`src/lib/rate-limit.ts:217`).
- Resolved: readiness allowlist now fails closed when source IP cannot be resolved (`src/modules/platform/security-access-guard.ts:43`).
- Resolved: readiness checks are short-window cached to reduce DB/Redis amplification risk (`src/app/api/health/ready/route.ts:66`).
- Remaining: edge/WAF policy rollout and strict production network isolation for readiness probes.

## Critical Findings

### SBP-001: Public webhook path allows database write amplification before signature rejection
- Severity: Critical
- Location: `src/app/api/billing/webhooks/mock/route.ts:20`, `src/modules/billing/webhook-service.ts:63`, `src/modules/billing/webhook-service.ts:94`, `src/modules/billing/webhook-service.ts:140`
- Evidence: Requests with invalid signatures still enter transaction flow and can create/update `webhookEvent` records before failing at signature check.
- Impact: An unauthenticated attacker can flood the webhook endpoint with random event IDs to create persistent DB churn and storage growth (availability and cost risk).
- Fix direction: Fail fast at edge and app entry before DB writes (WAF rule + signature precheck gate + strict body limit + route rate limit).
- Status: App-layer fixed in current code; edge-level controls remain required for full mitigation.

## High Findings

### SBP-002: Rate limiting is in-memory only and not safe for horizontal scale
- Severity: High
- Location: `src/lib/rate-limit.ts:9`, `src/lib/rate-limit.ts:11`, `src/app/api/auth/login/route.ts:12`, `src/app/api/auth/signup/route.ts:11`
- Evidence: Limiter uses process-local `Map` with no distributed coordination, no global quotas, and no eviction strategy.
- Impact: Attack traffic can bypass limits across multiple app instances; high-cardinality keys can increase memory pressure.
- Fix direction: Move all API throttling to Redis-backed token bucket/sliding-window with per-IP + per-account + per-route keys and TTL.

### SBP-003: High-frequency learning/video APIs have no route-level throttling
- Severity: High
- Location: `src/app/api/lessons/[lessonId]/watch/heartbeat/route.ts:8`, `src/app/api/lessons/[lessonId]/watch/session/route.ts:8`, `src/app/api/lessons/[lessonId]/watch/route.ts:8`
- Evidence: Watch endpoints do not call `enforceRateLimit` and rely only on business constraints.
- Impact: Authenticated abuse can create DB/Redis hot spots and degrade learning experience for normal users.
- Fix direction: Add per-parent and per-child quotas tuned for heartbeat cadence, plus abuse circuit-breakers.

### SBP-004: Expensive readiness probe is publicly callable and fans out to DB + Redis each request
- Severity: High
- Location: `src/app/api/health/ready/route.ts:65`, `src/app/api/health/ready/route.ts:66`
- Evidence: Every call triggers database query and a fresh Redis client connect/ping cycle.
- Impact: Probe flooding can become an application-layer DDoS vector against core dependencies.
- Fix direction: Restrict readiness endpoint to internal network/allowlist and cache readiness result for short TTL.

### SBP-005: Better Auth trusted origin list expands dynamically from request headers
- Severity: High
- Location: `src/lib/auth/better-auth.ts:9`, `src/lib/auth/better-auth.ts:17`, `src/lib/auth/better-auth.ts:31`
- Evidence: `resolveTrustedOrigins()` appends request-provided `origin`/`referer` to trusted origins.
- Impact: Auth origin policy can be loosened by request context instead of strict operator-controlled allowlist.
- Fix direction: Replace with static env allowlist (`AUTH_TRUSTED_ORIGINS`) and explicit reject on mismatch.

## Medium Findings

### SBP-006: Security headers and CSP are missing at framework boundary
- Severity: Medium
- Location: `next.config.ts:3`
- Evidence: No `headers()` configuration or middleware-based security header enforcement.
- Impact: Reduced browser-side hardening (clickjacking, content-type sniffing, CSP bypass surface).
- Fix direction: Add baseline headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

### SBP-007: Abuse-sensitive mutation endpoints lack throttling and idempotency guards
- Severity: Medium
- Location: `src/app/api/reports/generate/route.ts:8`, `src/app/api/reports/send-email/route.ts:8`, `src/app/api/evidence/media/upload-url/route.ts:8`, `src/app/api/billing/checkout/route.ts:8`
- Evidence: No route-level quotas or dedupe tokens on endpoints with queue/storage/cost impact.
- Impact: Authenticated abuse can trigger unnecessary workload and operational cost spikes.
- Fix direction: Add per-user burst/window controls and idempotency keys for expensive operations.

### SBP-008: Dependency gate and advisories status
- Severity: Medium
- Location: `scripts/security-baseline.mjs:12`, `reports/security/latest-summary.md:4`, `reports/security/latest-summary.md:18`
- Evidence: Gate now fails on `high` for `prod` scope, supports `all` scope, and current baseline reports zero vulnerabilities for both scopes.
- Impact: Dependency-related release risk is currently controlled in both runtime and tooling paths.
- Fix direction: Keep overrides and re-validate monthly; remove overrides once upstream ranges include patched versions.

### SBP-009: Detailed readiness error responses can leak internals if enabled
- Severity: Medium
- Location: `src/app/api/health/ready/route.ts:81`, `src/app/api/health/ready/route.ts:83`
- Evidence: `HEALTH_EXPOSE_DETAILS=true` returns dependency error details to clients.
- Impact: Environment/service internals may leak in production misconfiguration.
- Fix direction: Enforce `HEALTH_EXPOSE_DETAILS=false` in production and expose detailed probe only on private network.

## Existing Controls Observed
- CSRF origin checks on non-safe methods: `src/lib/security/csrf.ts:5`
- Generic 500 handling (no raw stack/message leak): `src/lib/route-error.ts:39`
- Watch-session token signing and timing-safe verify: `src/modules/learning/video-watch-service.ts:127`, `src/modules/learning/video-watch-service.ts:146`
- Webhook signature verification implementation exists: `src/modules/billing/webhook-service.ts:29`

## Recommended Execution Order
1. SBP-001 webhook pre-DB rejection + edge protection.
2. SBP-002 distributed rate limiting foundation in Redis.
3. SBP-003 protect watch/session/heartbeat with tuned quotas.
4. SBP-004 readiness endpoint isolation/caching.
5. SBP-005 strict auth trusted origins.
6. SBP-006 header/CSP hardening.
7. SBP-007 endpoint-specific abuse controls.
8. SBP-008 periodic dependency revalidation.
9. SBP-009 production probe exposure policy.
