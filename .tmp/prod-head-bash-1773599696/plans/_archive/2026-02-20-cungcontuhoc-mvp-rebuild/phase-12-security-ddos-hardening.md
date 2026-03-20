# Phase 12 - Security and DDoS Hardening

## Objective
Raise backend security posture from MVP baseline to production-safe operation for kid-learning workloads, with focus on API abuse resistance, availability under attack, and consistency across edge -> app -> DB/Redis.

## Trigger
This phase is driven by the current review findings in `security_best_practices_report.md`, especially public write amplification risk and missing distributed rate limiting.

## Scope
### In Scope
1. Distributed API rate limiting and endpoint protection matrix.
2. Public endpoint hardening (webhook, health, auth, watch, reports, upload-url).
3. Edge/WAF anti-DDoS integration and origin protection model.
4. Availability safeguards for DB/Redis under abuse traffic.
5. Security headers and browser hardening baseline.
6. Monitoring, alerts, and incident runbook for abuse spikes.

### Out Of Scope
1. Full SOC/SIEM platform rollout.
2. Advanced bot-management ML pipeline.
3. Multi-region active-active architecture.

## Workstreams

### WS1 - Edge Shielding and Origin Lockdown (P0)
1. Enforce CDN/WAF in front of origin (Cloudflare as documented in handover).
2. Add rate-limit and challenge rules for:
   - `/api/billing/webhooks/*`
   - `/api/auth/*`
   - `/api/lessons/*/watch/*`
   - `/api/health/ready`
3. Lock origin access to trusted reverse proxy/WAF only (block direct app-origin traffic).
4. Apply body-size limits and request anomaly rules for public POST endpoints.

Deliverables:
1. Edge ruleset export and runbook.
2. Endpoint-by-endpoint WAF policy table.

### WS2 - Distributed Rate Limiting Foundation (P0)
1. Replace in-memory limiter with Redis-backed limiter (token bucket/sliding window).
2. Standardize limiter dimensions:
   - `ip`
   - `account`
   - `route`
   - `resource` (for child/lesson watch flow)
3. Add structured limit response headers and consistent 429 payload schema.
4. Add limiter failover policy (`fail-open` only on low-risk read endpoints; `fail-closed` on sensitive mutation endpoints).

Deliverables:
1. `src/lib/rate-limit.ts` upgraded to Redis strategy.
2. Shared route middleware/util for limiter application.

### WS3 - Learning Video Path Protection (P0)
1. Protect watch APIs with cadence-aware quotas:
   - session create: low burst
   - heartbeat: strict interval + burst ceiling
   - watch complete: low burst
2. Add abuse controls for replay, sequence anomalies, and excessive concurrent sessions.
3. Add circuit breaker for repeated invalid session tokens per account/IP.
4. Cache or optimize validation order to reduce DB fan-out on bad heartbeat traffic.

Deliverables:
1. Policy matrix for watch endpoints.
2. Regression tests for abuse scenarios and expected 429/409 behavior.

### WS4 - Public Endpoint Cost Controls (P1)
1. Webhook hardening: verify signature before any DB writes.
2. Readiness hardening:
   - private/internal exposure
   - response caching for short interval
3. Add throttles/idempotency to:
   - `/api/reports/generate`
   - `/api/reports/send-email`
   - `/api/evidence/media/upload-url`
   - `/api/billing/checkout`

Deliverables:
1. Updated route handlers with cost-aware guardrails.
2. Test cases for abuse and retries.

### WS5 - App Security Baseline Completion (P1)
1. Replace dynamic auth trusted origins with static allowlist env config.
2. Add security headers via `next.config.ts` headers policy.
3. Enforce production-safe health detail policy.
4. Raise dependency gate target from `critical` to `high` after remediation sprint.

Deliverables:
1. Auth config hardening.
2. Header policy in Next config.
3. Updated security baseline policy and docs.

### WS6 - Detection and Incident Preparedness (P1)
1. Add security metrics:
   - 429 rate by route
   - webhook invalid-signature rate
   - watch heartbeat reject rate
   - readiness hit volume
2. Add alert thresholds and paging playbooks.
3. Create DDoS/abuse incident runbook (mitigation steps + rollback checklist).

Deliverables:
1. Alert catalog and thresholds.
2. Incident response checklist for on-call.

## Acceptance Criteria
1. No unauthenticated route can trigger high-cardinality DB writes before authentication/signature gate.
2. All mutation endpoints have explicit abuse policy (quota + keying strategy + behavior on limiter failure).
3. Watch API supports expected lesson traffic while rejecting abuse patterns with stable latency.
4. Readiness endpoint cannot be abused externally to pressure DB/Redis.
5. `pnpm security:baseline` policy and dependency posture align with release gate target.
6. Security and DDoS runbook is available and test-drilled.

## Suggested Skill Mapping
Primary:
1. `security-best-practices` (AppSec review and secure defaults)
2. `security-threat-model` (abuse-path prioritization)

From project-local skills (`D:/project/cungcontuhoc/.codex/skills`):
1. `devops` (WAF/origin hardening and deployment policy)
2. `backend-development` (route guards and limiter integration)
3. `better-auth` (trusted origins and session hardening)
4. `databases` (DB amplification controls and indexes)
5. `web-testing` (abuse/regression test coverage)
6. `planning` (execution tracking and phase checklists)

## Verification Checklist
1. `pnpm lint`
2. `pnpm type-check`
3. `pnpm test`
4. `pnpm test:e2e`
5. Targeted abuse tests for webhook/watch/auth/report endpoints
6. Load test replay with limiter thresholds and alert validation
