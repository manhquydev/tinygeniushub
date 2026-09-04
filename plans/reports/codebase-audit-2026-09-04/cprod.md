# Slice: C-PROD
# Agent: cprod
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
64/100 — All eight claimed flows have real API+module code, but the two revenue-critical contracts (plan child limits 3/5, subscription checkout UI) are unwired, and the live kid-today path is not the English+Math trial mission README describes.

## Quality score
72/100 — Domain services are substantial (idempotent completion, webhook advisory locks, opt-in email dispatch, Better Auth session), with unit tests on the happy paths; quality drops where UI/module contracts diverge (hardcoded limit=1, dead checkout button, dual mission sources).

## What is actually implemented

### Parent signup / login / logout
- Signup UI `/auth/signup` → `AuthForm` POST `/api/auth/signup` → `registerParent`. Creates `ParentAccount`, trial `Subscription` (7 days, `childProfileLimit: 3`), Better Auth `User`/`Account`. No `Set-Cookie`. UI then routes to `/auth/login?verify=signup-success`. Evidence: `src/app/api/auth/signup/route.ts:80-135`, `src/modules/identity/service.ts:35-76`, `src/components/auth-form.tsx:201-211`.
- Login UI `/auth/login` → POST `/api/auth/login` → `authenticateParent` then `auth.api.signInEmail`; copies Better Auth cookies (`ccth_session`, 30d). Evidence: `src/app/api/auth/login/route.ts:141-185`, `src/lib/auth/better-auth.ts:89-99`.
- Logout: nav `fetch POST /api/auth/logout` → `auth.api.signOut`; JSON or 303 `/`. No `/auth/logout` page. Evidence: `src/components/app-nav-client.tsx:242`, `src/app/api/auth/logout/route.ts:56-64`.
- Catch-all `/api/auth/[...all]` and native aliases `/api/auth/sign-in/email`, `/sign-up/email`, `/sign-out` all 404. Better Auth `disableSignUp: true`. Evidence: `src/app/api/auth/[...all]/route.ts:7-24`, `src/lib/auth/better-auth.ts:53`.
- Post-login setup `/setup` + `POST /api/onboarding/complete` creates the first child. Evidence: `src/app/(main)/setup/page.tsx:9-15`, `src/app/api/onboarding/complete/route.ts:78-84`.

### Child profile CRUD + plan limits
- UI `/parent/children` + `ChildrenManager` POST/PATCH/DELETE `/api/children`. Evidence: `src/components/children-manager.tsx:335-441`, `src/app/api/children/route.ts:11-67`, `src/app/api/children/[childId]/route.ts:44-91`.
- Module CRUD in `src/modules/progress/children-service.ts` with serializable create.
- **Enforced limit is 1**, hardcoded in UI and service. Subscription row still stores `childProfileLimit: 3` at signup; billing plan-config has 3/5. Evidence: `src/modules/progress/children-service.ts:6,39-43`, `src/app/(main)/parent/children/page.tsx:45`, `src/app/(main)/parent/dashboard/page.tsx:42`, `src/modules/billing/plan-config.ts:16-35`, `src/modules/identity/service.ts:64-69`.

### Trial lesson English+Math + completion
- Seed: ENGLISH + MATH tracks; several lessons `trialEnabled: true`. Evidence: `prisma/seed.ts:326-351,96-219`.
- `getTodayMission` returns next ENGLISH + MATH lesson, filters `trialEnabled` when `TRIALING`. Evidence: `src/modules/content/service.ts:87-129`.
- Live `/kid/today` and `GET /api/lessons/today` use `getRealKidGardenMission` (enrolled `CourseLesson` window), not EN+MATH tracks. Kid root redirects to `/kid/garden`. Evidence: `src/app/(kid-app)/kid/today/page.tsx:85`, `src/app/api/lessons/today/route.ts:20-25`, `src/app/(kid-app)/kid/page.tsx:4`.
- `/kid/garden/[zone]` uses `getTodayMission` via `getGardenLessons`, but `onSelectLesson={undefined}` so cards do not start a player. Evidence: `src/app/(kid-app)/kid/garden/[zone]/page.tsx:54-78`.
- Completion: `POST /api/lessons/:id/complete` → `completeLesson`. Unique `LessonCompletion(childId,lessonId)`; early `idempotent: true`; unique-constraint fallback; `RewardGrant` `@@unique([childId,lessonId,type])`; TRIALING blocked unless `lesson.trialEnabled`. Watch session/heartbeat/watch routes exist. Evidence: `src/modules/learning/completion-service.ts:179-246,350-367`, `prisma/schema.prisma:437,491`, `src/app/api/lessons/[lessonId]/complete/route.ts:71-77`.
- Player overlay POSTs complete. Evidence: `src/components/lesson-player/LessonPlayerScene.tsx:464`.
- Admin `PATCH /api/admin/lessons/:lessonId/trial-flag` exists. Evidence: `src/app/api/admin/lessons/[lessonId]/trial-flag/route.ts:10-31`.

### Weekly report in-app + email
- In-app: `/parent/reports` + `ReportsPanel` generate/list; dashboard report cards. Persist `WeeklyReport` unique `(childId, weekStart)`, `emailStatus: QUEUED`. Evidence: `src/app/(main)/parent/reports/page.tsx:41-58`, `src/modules/reports/weekly-report-service.ts:100-193`.
- APIs: `GET /api/reports/weekly`, `POST /api/reports/generate` (also creates in-app notifications), `POST /api/reports/send-email` (inline dispatch, not BullMQ). Evidence: those route files.
- Cron `GET /api/cron/weekly-reports` (secret-gated) generates + notifies; does not enqueue email jobs. Evidence: `src/app/api/cron/weekly-reports/route.ts:18-53`.
- Worker: `weekly-reports` (7d interval) then `enqueueWeeklyReportEmails`; `weekly-report-emails` every 30m. Evidence: `src/worker/index.ts:138-167`, `src/worker/jobs/generate-weekly-reports.ts:13-14`.
- Opt-in gate `canSendWeeklyEmail` (prefs + per-child opt-in). Signup defaults email ON. No parent UI/API to change weekly-report email prefs. Evidence: `src/modules/reports/email-delivery-service.ts:86-103`, `src/modules/identity/service.ts:54-59`.
- `/api/reports/:id/pdf` returns `text/html` print sheet, not PDF bytes. Evidence: `src/app/api/reports/[reportId]/pdf/route.ts:342-345`.

### Billing checkout + webhooks
- `POST /api/billing/checkout` → provider adapter `mock_gateway|stripe`, audit `billing.checkout.created`. Mock disabled in production. Evidence: `src/app/api/billing/checkout/route.ts:12-50`, `src/modules/billing/checkout-service.ts:32-86`, `src/modules/billing/providers/index.ts:7-14`.
- Webhooks: mock (non-prod), stripe → `processBillingWebhook` (idempotent `provider+eventId`, advisory lock, `PaymentRecord` upsert, `WebhookEvent.auditTrail`, audit log). Evidence: `src/modules/billing/webhook-service.ts:78-97,256-283`.
- PayOS route exists but calls **course** `processPayosCourseWebhook`, not subscription billing. Evidence: `src/app/api/billing/webhooks/payos/route.ts:51`.
- Webhook `planCode` enum is only `YEARLY_STANDARD|YEARLY_FAMILY_PLUS` (no monthly). Period always `addYears`. Evidence: `src/modules/billing/webhook-service.ts:23,182-183`.
- UI: `/pricing` 308-redirects to `/courses`. `CheckoutPlanButton` (POST `/api/billing/checkout`) has **zero importers**. `/parent/billing` is payment history. Live paid UI is course checkout `POST /api/courses/:slug/checkout`. Evidence: `src/app/(main)/pricing/page.tsx:3-4`, `src/components/checkout-plan-button.tsx:21-40`.

### Referral
- Pages `/referral`, `/gioi-thieu-ban` → `/referral`. Dashboard `DashboardReferralSection` + `ReferralClaimForm`. APIs `GET|POST /api/referrals/me`, `POST /api/referrals/claim`. Module generates codes, claims with idempotency. Evidence: `src/modules/referral/service.ts:51-77,152-193`, `src/components/parent/dashboard-referral-section.tsx:90`.
- Share builder supports Zalo/Facebook/WhatsApp; referral page only prints a facebook-UTM signup URL. Signup ignores `?ref=`. `paidAt` / `rewardGranted` are counted, never written. Evidence: `src/modules/sharing/share-link-builder.ts:43-53`, `src/app/(main)/referral/page.tsx:35`, `src/components/auth-form.tsx` (no `ref` handling).

### Notifications
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`. Bell UI `ParentNotificationCenter` in nav. Created from report generate/cron and streak-alerts cron. Evidence: `src/app/api/notifications/route.ts:8-43`, `src/components/parent-notification-center.tsx:110,187`, `src/components/app-nav-client.tsx:326`.
- Empty list if `resolveUserIdForParent` fails. Evidence: `src/app/api/notifications/route.ts:20-21`.

### Health / ready
- `GET /api/health`: liveness (status, service, env, version, uptime). No deps. Evidence: `src/app/api/health/route.ts:4-12`.
- `GET /api/health/ready`: DB `SELECT 1` + Redis PING, allowlist, rate limit, cache. Check details only if `HEALTH_EXPOSE_DETAILS`. Evidence: `src/app/api/health/ready/route.ts:80-150`.

### README Core Endpoints vs `src/app/api`
Every README Core Endpoint has a `route.ts`. Extra undocumented product routes exist (`/api/onboarding/complete`, `/api/courses/*/checkout`, `/api/adaptive/*`, reader auth, etc.). Not missing-listed; catalog is incomplete, not false.

## Gaps vs claimed docs

| Claim | Source | Reality | Status |
| Parent signup/login/logout with Better Auth signed session cookie | README Implemented Scope | Login/logout set/clear `ccth_session`. Signup creates User/Account but does not issue a session cookie; UI forces login. | Partial |
| `/api/auth/[...all]` blocked; canonical auth only | README Core Endpoints | GET/POST/PATCH/PUT/DELETE 404. Aliases also 404. | Done |
| Better Auth catch-all + sign-in/sign-up/sign-out | `docs/codebase-summary.md:55` | Those routes 404; canonical `/api/auth/{signup,login,logout}` only. | Doc-lie |
| Auth MFA ready | PDR `docs/project-overview-pdr.md:157` | No twoFactor/MFA plugin or routes. | Doc-lie |
| Child profile management with plan limits 3 default / 5 Family+ | README Implemented Scope | CRUD exists. Create+UI enforce 1. Plan-config 3/5 and `Subscription.childProfileLimit` unused on create. Tests lock in limit=1. | Doc-lie |
| Trial lesson mission (English + Math) | README Implemented Scope | Seed + `getTodayMission` EN+MATH. Live `/kid/today` + `/api/lessons/today` use course enrollments. Garden zone uses EN+MATH but cannot start a lesson. | Partial |
| Idempotent completion + one reward per child per lesson | README Implemented Scope | Unique completion + RewardGrant unique + idempotent return. Covered by unit + `scripts/e2e-data-integrity.mjs`. | Done |
| Weekly report generation (in-app data model + API) | README Implemented Scope | Model + generate/list UI/API + cron. | Done |
| Weekly report email pipeline (queue + worker + opt-in aware dispatch) | README Implemented Scope | Worker+opt-in exist. Vercel cron does not enqueue emails. UI send-email bypasses queue. No parent opt-in writer. | Partial |
| Billing webhook ingestion with idempotency and audit trail | README Implemented Scope | Stripe/mock subscription path yes. PayOS path is course payments. | Partial |
| Billing checkout session API (`mock_gateway` default, `stripe` available) | README Implemented Scope | API+adapters exist. No mounted UI. Pricing redirects to courses. | Partial |
| Pricing page with 30-day refund; Monthly 99,000đ | PDR business model | `/pricing` redirects `/courses`. `plan-config` monthly is 149_000đ; unused button still says 99_000. | Doc-lie |
| Referral system (Zalo/Facebook share) | PDR Phase 01 | Code/claim/summary exist. No Zalo/FB share buttons. Signup ignores `ref`. Rewards never granted. | Partial |
| Notifications list + mark-read | README Core Endpoints | API + nav bell + producers. No dedicated tests. | Done |
| Health + readiness APIs | README Implemented Scope | Both exist. Liveness is not a dependency probe. | Done |
| 7-day free trial | PDR Monthly tier | Signup creates `TRIALING` 7-day subscription. | Done |

## Findings

### Critical
- [Family+ / Standard child limits not enforced] `src/modules/progress/children-service.ts:6` — `CHILD_PROFILE_LIMIT = 1`; UI hardcodes `childLimit = 1` (`src/app/(main)/parent/children/page.tsx:45`). Billing `YEARLY_FAMILY_PLUS.childProfileLimit = 5` (`src/modules/billing/plan-config.ts:30-32`) and signup writes `childProfileLimit: 3` (`src/modules/identity/service.ts:69`) are unused. Impact: Family+ cannot add 2nd–5th child; README 3/5 is false. Suggested fix: create path must read `Subscription.childProfileLimit` (or plan-config) and pass it to UI.
- [Subscription checkout has no product UI] `src/components/checkout-plan-button.tsx:21` unused; `src/app/(main)/pricing/page.tsx:3-4` redirects to `/courses`. Impact: advertised Monthly/Yearly/Family+ cannot be purchased from the app; live money path is course PayOS. Suggested fix: mount checkout on pricing/billing or stop claiming subscription checkout as an implemented product flow.

### High
- [Live today mission is not English+Math trial] `src/app/api/lessons/today/route.ts:20-25` and `src/app/(kid-app)/kid/today/page.tsx:85` call `getRealKidGardenMission`. Trial parents with no `CourseEnrollment` get an empty today list despite seeded EN+MATH trial lessons. Garden zone uses the real mission but `onSelectLesson={undefined}` (`src/app/(kid-app)/kid/garden/[zone]/page.tsx:78`). Suggested fix: point today (or an explicit trial mission) at `getTodayMission`, and wire garden card click to the player.
- [Monthly subscription cannot be fulfilled by webhook] Checkout accepts `MONTHLY_STANDARD` (`src/modules/billing/plan-config.ts:4`); webhook schema excludes it (`src/modules/billing/webhook-service.ts:23`) and always sets period end +1 year (`:183`). Impact: monthly checkout, if ever wired, would fail or grant a year. Suggested fix: add monthly to webhook schema and period math.
- [Referral share loop is broken] Share URLs put `ref=` on `/auth/signup` (`src/modules/sharing/share-link-builder.ts:22-23`); signup does not claim it. `paidAt`/`rewardGranted` never written (only counted). PDR Zalo/Facebook share buttons are absent. Suggested fix: persist `ref` through signup→login→claim; grant rewards on paid conversion.
- [PayOS under `/api/billing/webhooks/payos` is course checkout, not plan billing] `src/app/api/billing/webhooks/payos/route.ts:51`. README lists it beside stripe/mock as billing webhooks. Suggested fix: document as course webhook or split routes.

### Medium
- [Signup does not establish a session] `src/app/api/auth/signup/route.ts:116-135` vs login cookie copy `src/app/api/auth/login/route.ts:185`. Extra login step; e2e `tests/e2e/learning-flow-integration.spec.ts:84-90` expects `/setup` immediately after signup (stale vs current AuthForm).
- [Weekly email pipeline is split] Cron generate does not enqueue BullMQ (`src/app/api/cron/weekly-reports/route.ts`). UI `send-email` bypasses the queue. Relies on worker 30m poll if worker is running. No parent control for `weeklyReportEmailEnabled`.
- [PDF endpoint is HTML] `src/app/api/reports/[reportId]/pdf/route.ts:345` `text/html`. Browser print, not pdf-lib.
- [PDR monthly price 99k vs plan-config 149k vs dead button 99k] three sources disagree (`docs/project-overview-pdr.md:32`, `src/modules/billing/plan-config.ts:16-17`, `src/components/checkout-plan-button.tsx:10`).
- [Notifications silently empty without User row] `src/app/api/notifications/route.ts:20-21`.

### Low
- [No `/auth/logout` page] logout is nav POST only. Analytics href `/auth/logout` [INFERENCE] would 404 if still referenced.
- [Health liveness does not check DB/Redis] by design; ready does. Docs that call `/api/health` a readiness probe would overclaim.
- [`docs/codebase-summary.md` cron list omits weekly-reports and streak-alerts] (`docs/codebase-summary.md:69` vs `src/app/api/cron/`).

## Tests covering this slice
- `src/app/api/auth/{signup,login,logout,[...all],sign-in/email,sign-up/email,sign-out}/route.test.ts` — route behavior, catch-all 404. Hole: signup cookie not asserted (correctly absent).
- `scripts/e2e-auth-session-lifecycle.mjs` — live cookie hardening/rotation/logout. Hole: Playwright `tests/e2e/auth-flow.spec.ts` mocks login/logout so cookie is not proven.
- `src/modules/identity/__tests__/service.test.ts` — registerParent trial sub `childProfileLimit: 3` (contradicts create-path limit=1).
- `src/modules/progress/__tests__/children-service.test.ts` — CRUD + **limit=1** (`:93-107`). Helper tests use generic 3. No Family+ test.
- `src/modules/learning/__tests__/completion-service.test.ts` — idempotent complete, trial restriction, unique race. Hole: does not assert `rewardGrant.create`.
- `scripts/e2e-data-integrity.mjs` — complete retry `idempotent=true`, rewardCount===1.
- `src/modules/reports/__tests__/weekly-report-service.test.ts`, `email-delivery-service.test.ts`, `email-delivery-resend.test.ts` — generate + opt-in skip. `src/app/api/reports/send-email/route.test.ts` — route. Hole: no e2e cron→queue→worker→inbox.
- `src/modules/billing/__tests__/{checkout-service,webhook-service,webhook-service.transaction,stripe-webhook-service}.test.ts` + mock/stripe route tests. Hole: no UI checkout e2e (button unused). Course purchase has `tests/e2e/course-purchase-flow.spec.ts`.
- `src/modules/referral/__tests__/service.test.ts`, `src/app/api/referrals/me/route.test.ts`, `src/modules/sharing/__tests__/share-link-builder.test.ts`. Hole: no signup-`ref` claim test; rewards never written so unpaid.
- Notifications: no dedicated route/component tests found.
- Health/ready: no `src/app/api/health/**` tests found.

## Production-readiness blockers
- Do not ship Family+ / multi-child as documented until create+UI use `Subscription.childProfileLimit`.
- Do not claim subscription billing as a parent-facing flow until a live checkout surface exists (or docs are rewritten to “course PayOS only”).
- Do not claim English+Math trial mission as the kid today experience until `/kid/today` (or garden) actually launches those lessons.
- Monthly plan must not be sold until webhook schema/period handling includes it.

## Unresolved questions
- Is production intentionally course-PayOS-only, with subscription checkout left as unused MVP? Live UI says yes; README/PDR say no.
- Does production run the BullMQ worker process, or only Vercel GET crons? Email delivery depends on the worker 30m loop unless a parent hits send-email.
- Is `HEALTH_EXPOSE_DETAILS` on in production? Ready payload otherwise has no check breakdown.
- Should signup auto-login (`autoSignIn: true` is set on Better Auth but unused because signup never calls `signInEmail`)?
