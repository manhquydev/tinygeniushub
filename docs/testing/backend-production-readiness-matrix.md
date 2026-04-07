# Backend Production Readiness Matrix (As Of 2026-02-21)

## Scope And Evidence
- Source of truth: `docs/handover/handover-master-agent-ready.md`
- Implementation snapshot: `docs/implementation-plan.md`
- Automated evidence from this run:
  - `pnpm test` -> 37 files, 197 tests passed.
  - `pnpm test -- --coverage` -> statements `81.65%` (handover target: `>=80%` for API/business met).
  - `pnpm test:local:full` -> smoke + P0 + auth-timing + auth-session + integrity + full + security all passed.
  - `pnpm test:e2e:auth-session:https` -> HTTPS-like auth session lifecycle passed with explicit `Secure` cookie assertion.
  - `pnpm test:e2e:staging-providers` -> checkout + webhook transition matrix (succeeded/failed/refunded) + duplicate-idempotency + admin payment/webhook visibility + weekly email provider contract checks passed (mock override mode).
  - `pnpm test:obs:drills` -> auth/webhook/report failure-path structured signals emitted and verified.
  - `pnpm security:baseline` -> prod/dev vulnerabilities `0`.
  - `pnpm perf:sanity` -> p95 for `/` and `/pricing` well below threshold.

Status legend:
- `Met`: implemented and validated by automated checks.
- `Partial`: implemented baseline, but missing production-grade requirement.
- `Not Met`: requirement not implemented yet.

## 1) Functional Scope Alignment (Handover Section 7.1)

| Requirement | Status | Evidence |
|---|---|---|
| Parent authentication and onboarding | Met | `src/app/api/auth/signup/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/signup/route.test.ts`, `src/app/api/auth/login/route.test.ts`, `src/app/api/auth/logout/route.test.ts` |
| Child profile management | Met | `src/modules/progress/children-service.ts`, `src/app/api/children/route.ts`, `src/app/api/children/[childId]/route.ts`, `scripts/e2e-full-local.mjs` |
| Track -> Level -> Unit -> Lesson hierarchy | Met | `prisma/schema.prisma`, `src/modules/content/service.ts` |
| Lesson flow (watch + interact + complete) | Partial | Watch + complete APIs are live (`src/app/api/lessons/[lessonId]/watch*/route.ts`, `src/app/api/lessons/[lessonId]/complete/route.ts`), but richer activity enforcement is still minimal. |
| Progress and gamification (streak, stars, badges) | Partial | Streak + completion reward are live (`src/modules/learning/completion-service.ts`), but stars/badges progression is not fully productized. |
| Parent dashboard + weekly report | Partial | Weekly report and in-app flow are live (`src/modules/reports/weekly-report-service.ts`), email provider supports `mock_email|resend|brevo` with provider contract checks (`src/modules/reports/email-delivery-service.ts`), but real-provider delivery evidence is still pending. |
| Trial to paid conversion + webhook reconciliation | Partial | Webhook integrity is strong and tested, checkout provider supports `mock_gateway|stripe` (`src/modules/billing/providers/index.ts`), Stripe callback route and signature verification are live (`src/app/api/billing/webhooks/stripe/route.ts`, `src/modules/billing/stripe-webhook-service.ts`), but real-provider callback evidence is still pending. |
| Admin operations for users/content/payments | Partial | Admin overview/payments/webhooks/trial-flag exist (`src/app/api/admin/*`), full CMS/moderation workflows are not complete. |

## 2) Locked Business Rules Alignment (Handover Section 8)

| Rule | Status | Evidence |
|---|---|---|
| Child profile limit is plan-dependent | Met | Enforced with serializable transaction + retry on concurrency conflicts in `src/modules/progress/children-service.ts` (covered by `src/modules/progress/__tests__/children-service.test.ts`). |
| Evidence retention default 90d, premium 365d | Met | `src/modules/learning/completion-service.ts` |
| Trial users only access trial-enabled lessons | Met | `src/modules/learning/completion-service.ts` |
| One reward per child per lesson | Met | unique constraint in `prisma/schema.prisma` + `src/modules/learning/completion-service.ts` |
| One provider transaction id -> one payment record | Met | unique constraint + upsert in `src/modules/billing/webhook-service.ts`; validated by `scripts/e2e-data-integrity.mjs` |
| Auto-charge only for eligible subscriptions | Partial | Eligibility logic exists (`src/modules/billing/renewal-service.ts`), scheduler flow is not fully wired to production payment provider. |
| Webhook idempotent and auditable | Met | `src/modules/billing/webhook-service.ts`, `scripts/e2e-data-integrity.mjs` |

## 3) Core Flow Acceptance (Handover Section 9)

| Flow acceptance | Status | Evidence |
|---|---|---|
| Signup -> first lesson <= 3 minutes median | Partial | Full flow runs in E2E, but median KPI is not tracked as a formal metric yet. |
| Lesson completion endpoint idempotent and retry-safe | Met | `src/modules/learning/completion-service.ts`, `scripts/e2e-p0-journey.mjs`, `scripts/e2e-data-integrity.mjs` |
| Payment webhook signature verification mandatory | Met | `src/app/api/billing/webhooks/mock/route.ts`, `src/app/api/billing/webhooks/stripe/route.ts`, `src/modules/billing/stripe-webhook-service.ts`, `src/modules/billing/webhook-service.ts` |
| No duplicate charge for same billing cycle | Partial | Transaction uniqueness is enforced; real provider cycle semantics are pending until provider integration. |
| Full audit trail for billing transitions | Met | `src/modules/billing/webhook-service.ts`, `src/modules/platform/audit-service.ts`, `scripts/e2e-data-integrity.mjs` |
| Weekly report includes minutes/lessons/streak and rerun-safe generation | Met | `src/modules/reports/weekly-report-service.ts`, `scripts/e2e-data-integrity.mjs` |

## 4) QA And Release Gate Alignment (Handover Section 13)

| Gate | Status | Evidence |
|---|---|---|
| `pnpm lint` | Met | Passed on 2026-02-21 |
| `pnpm type-check` | Met | Passed on 2026-02-21 |
| `pnpm test` | Met | Passed on 2026-02-21 |
| `pnpm test:e2e` (minimum smoke) | Met | Included in `pnpm test:local:full` |
| Security baseline | Met | `pnpm security:baseline` passed (0 findings) |
| Performance sanity | Met | `pnpm perf:sanity` passed |
| Coverage target (API/business >=80%) | Met | Current statements `81.65%` |

## 5) Backend Test Matrix (Professional Baseline -> Advanced)

### P0 Auth Cases (Register/Login) - Must Pass
- [x] `AUTH-BASIC-001` Invalid signup payload returns `400` with clear issue details.
- [x] `AUTH-BASIC-002` Invalid login payload returns `400` with clear issue details.
- [x] `AUTH-BASIC-003` Duplicate signup email returns `409` with stable code.
- [x] `AUTH-BASIC-004` Invalid credentials return normalized message (`Invalid credentials`).
- [x] `AUTH-BASIC-005` Signup/login rate limits return `429` + `Retry-After`.
- [x] `AUTH-BASIC-006` Successful signup/login set session cookie.
- [x] `AUTH-BASIC-007` Logout invalidates auth session.
- [x] `AUTH-BASIC-008` CSRF origin guard blocks unsafe cross-site writes.
- [x] `AUTH-BASIC-009` Non-canonical Better Auth credential endpoints are blocked.

Evidence:
- `src/app/api/auth/signup/route.test.ts`
- `src/app/api/auth/login/route.test.ts`
- `src/app/api/auth/logout/route.test.ts`
- `src/app/api/auth/sign-in/email/route.test.ts`
- `src/app/api/auth/sign-up/email/route.test.ts`
- `src/app/api/auth/sign-out/route.test.ts`
- `src/app/api/auth/[...all]/route.test.ts`
- `src/lib/security/__tests__/csrf.test.ts`
- `scripts/e2e-security-abuse.mjs`

### P0 Data Integrity Cases - Must Pass
- [x] `DATA-P0-001` Signup creates parent + preferences + subscription + auth user/account atomically.
- [x] `DATA-P0-002` Lesson completion is idempotent under retries.
- [x] `DATA-P0-003` Reward uniqueness per child/lesson/type is preserved.
- [x] `DATA-P0-004` Weekly report upsert keeps single row per child/week.
- [x] `DATA-P0-005` Webhook same event is idempotent; no duplicate records.
- [x] `DATA-P0-006` One transaction id maps to one payment row through status transitions.

Evidence:
- `scripts/e2e-data-integrity.mjs`

### P1 Hardening Cases - Next Iteration
- [x] `AUTH-P1-001` Lockout/backoff effectiveness under distributed attempts.
Evidence:
- `src/app/api/auth/login/route.test.ts` (email bucket across rotating IPs)
- `scripts/e2e-security-abuse.mjs` (distributed login abuse scenario)
- [x] `AUTH-P1-002` Statistical timing harness for enumeration resistance.
Evidence:
- `scripts/e2e-auth-timing.mjs`
- [x] `AUTH-P1-004` Session lifecycle hardening (rotation/invalidation/multi-session isolation).
Evidence:
- `scripts/e2e-auth-session-lifecycle.mjs`
- `src/lib/auth/__tests__/session.test.ts`
- [x] `AUTH-P1-005` Auth audit/security logging quality (failure + rate-limit events, structured and secret-safe metadata).
Evidence:
- `src/app/api/auth/login/route.test.ts`
- `src/app/api/auth/signup/route.test.ts`
- `src/app/api/auth/logout/route.test.ts`
- [x] `AUTH-P1-003` HTTPS environment assertion for `Secure` session cookies.
Evidence:
- `scripts/e2e-auth-session-https.mjs`
- `scripts/e2e-auth-session-lifecycle.mjs` (`E2E_EXPECT_SECURE_COOKIE=1`, `E2E_REQUEST_ORIGIN=https://...`)
- [ ] `BILLING-P1-001` Real payment provider integration tests (checkout + callback + signature rotation).
- [ ] `EMAIL-P1-001` Real email provider delivery and retry/bounce integration tests.
- [ ] `STAGING-P1-001` Run `pnpm test:e2e:staging-providers` with real providers only (`E2E_STAGING_REQUIRE_REAL_PROVIDERS=1`) and no mock override.
Latest attempts (2026-02-21):
- fail-fast preflight blocks run when required real-provider secrets are missing (for example `STRIPE_SECRET_KEY` with `BILLING_PROVIDER=stripe`).
- with placeholder credentials present, checkout reaches Stripe adapter and fails as `BILLING_PROVIDER_REQUEST_FAILED` (expected until valid staging credentials are configured).
- staging-provider E2E baseline now validates webhook transition matrix (`SUCCEEDED -> REFUNDED`, independent `FAILED`) and duplicate-event idempotency in one run.
- [ ] `OBS-P1-001` Production alerting test drills for auth/webhook/report failure paths.
Baseline in place:
- `scripts/e2e-obs-alert-drills.mjs` + `pnpm test:obs:drills` (verifies structured failure signals for auth/webhook/report).
Remaining gap:
- wire these signals to production alert sinks/policies (e.g. pager/on-call rules) and run staging/prod drill with incident evidence.

## 6) Critical Gaps Before Production
1. Configure valid staging credentials for `stripe` + real callback path evidence (including signature rotation drill).
2. Configure valid staging credentials for `brevo` (or `resend`) and collect delivery/retry/bounce evidence.
3. Add HTTPS staging assertion for `Secure` session cookie and keep it in release gating.
4. Complete advanced admin workflows (content moderation/CMS operations and operational runbooks).

## 7) Immediate Execution Plan
1. Payment workstream:
   - Run `stripe` staging flow with valid keys and webhook callback contract.
   - Add webhook secret rotation runbook and tests.
   - Execute transition matrix checks (success/fail/refund/duplicate) against real Stripe callbacks in staging.
2. Report delivery workstream:
   - Run `brevo` staging flow with validated sender domain + delivery telemetry.
   - Add bounce/retry/idempotent send tests.
3. Coverage workstream:
   - Keep API/business statements above `80%`.
   - Add targeted tests for low-coverage utility modules (`lib/prisma-error.ts`, `lib/redis-client.ts`, billing provider adapters).
4. Security hardening workstream:
   - Keep auth timing + auth session lifecycle harnesses in CI/local full regression.
   - Add HTTPS `Secure` cookie assertions in staging-like environment.
