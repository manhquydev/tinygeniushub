# Phase 11 - MVP Gap Closure & Production Readiness

## Objective
Close the documented gaps between current MVP implementation and handover in-scope requirements so the project can move from "foundation-complete" to "launch-ready MVP".

## Why This Phase Exists
Review snapshot indicates core foundation is stable (`pnpm release:check` and `pnpm test:e2e:p0` pass), but several in-scope or near-term operational items remain incomplete:
- Real payment provider adapter and checkout path are not implemented yet.
- Admin and referral modules are still scaffold placeholders.
- Media upload pipeline (R2 signed URL flow) is missing.
- Observability is baseline-only (no full stack with Sentry/tracing/alerts).
- Branch protection and security debt closure are not fully enforced.

## Scope
### In Scope
1. Production payment integration and checkout lifecycle.
2. Admin operations MVP for users/content/payments.
3. Referral attribution and payout-ledger baseline.
4. R2 signed-upload pipeline for evidence media.
5. Observability hardening (Sentry, traces/metrics, alerts, runbooks).
6. Security/testing/release policy hardening for launch gate.

### Out Of Scope
1. Caregiver full role model (post-MVP).
2. Native mobile app.
3. Advanced adaptive learning personalization.

## Workstreams & Deliverables
### WS1 - Payment Provider Productionization (P0)
- Implement provider adapter abstraction (`billing/providers/*`).
- Add checkout session API (`POST /api/billing/checkout`).
- Add signature verification strategy per provider.
- Add subscription transition test matrix (success/fail/refund/duplicate webhook).
- Deliver migration/runbook for rotating webhook secrets.

### WS2 - Admin + Referral Operational MVP (P1)
- Replace placeholders with working admin read/write endpoints for:
  - parent account overview + subscription state,
  - content publish flags (trial/full),
  - payment record search and webhook audit inspection.
- Implement referral attribution write path and payout-ledger schema + service.
- Add admin authz guardrails and audit logging for mutating actions.

### WS3 - Media Pipeline (R2) (P1)
- Implement signed upload URL endpoint for evidence media.
- Store immutable object metadata and checksum.
- Add async cleanup for orphan media and retention-expired objects.
- Add upload constraints: type, size, duration, ownership checks.

### WS4 - Observability + Ops Hardening (P1)
- Integrate Sentry for API and worker processes.
- Add request/trace correlation ID propagation.
- Define metrics/alerts for:
  - readiness failures,
  - webhook failure rate,
  - email delivery bounce rate,
  - queue lag and retry spikes.
- Add incident response runbook and rollback checklist.

### WS5 - Quality, Security, and Release Governance (P0)
- Expand test portfolio:
  - API integration tests for auth/children/billing/reports.
  - Browser e2e for signup -> checkout -> renewal edge cases.
- Raise security gate policy to block high severity after dependency remediation window.
- Configure repository branch protection with required checks:
  - `release-check`
  - `test:e2e:p0`
- Add release evidence template for launch sign-off.

## Acceptance Criteria
1. Trial-to-paid journey includes real checkout + verified webhook path end-to-end in staging.
2. Admin page no longer uses placeholder services.
3. Referral attribution and payout ledger produce auditable records.
4. Evidence media upload works with signed URLs and retention cleanup.
5. Sentry + alert policies active with test incident drill evidence.
6. Launch gate blocks merge when quality/security thresholds are not met.

## Execution Order (Recommended)
1. WS1 Payment Provider Productionization
2. WS5 Governance + Security Baseline Hardening (in parallel after WS1 starts)
3. WS2 Admin + Referral Operational MVP
4. WS3 Media Pipeline (R2)
5. WS4 Observability + Ops Hardening
6. Full regression + launch rehearsal

## Skill Mapping For Implementation
### Skills available in this Codex session
1. `find-skills` - discover/install missing domain skills quickly.
2. `gh-fix-ci` - debug failing GitHub Action checks when CI breaks.
3. `security-best-practices` - targeted hardening review (JS/TS paths).
4. `security-threat-model` - threat model for billing/media/admin boundaries.

### Skills available in `C:/Users/manhquy/.claude/skills` (recommended per workstream)
1. `payment-integration` -> WS1 checkout + webhook/provider adapters.
2. `better-auth` -> WS2 admin authz and session hardening.
3. `devops` -> WS3 R2 workflow + WS4 deployment/ops workflows.
4. `web-testing` -> WS5 integration/e2e expansion and CI testing strategy.

### Additional discovered ecosystem skills (via `npx skills find`)
1. `dodopayments/skills@webhook-integration`
2. `shipshitdev/library@stripe-implementer`
3. `getsentry/sentry-agent-skills@sentry-setup-ai-monitoring`
4. `jezweb/claude-skills@cloudflare-r2`

## Estimated Effort
- Total: 24h (engineering-only estimate; excludes external provider onboarding lead time).
- Suggested split:
  - WS1: 8h
  - WS2: 5h
  - WS3: 4h
  - WS4: 3h
  - WS5: 4h

## Verification Commands
```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:e2e:p0
pnpm release:check
```
