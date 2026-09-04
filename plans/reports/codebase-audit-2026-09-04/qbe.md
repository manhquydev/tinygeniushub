# Slice: qbe
# Agent: qbe
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
62/100 — Watch/complete/webhook/report/checkout APIs exist and are wired, but advertised plan 3/5 child caps, weekly-email opt-in as a product control, and Stripe `MONTHLY_STANDARD` activation are not implemented.

## Quality score
70/100 — Lesson completion and subscription webhooks use real uniques + transactions; child-limit, weekly-report freeze, gift-code redeem, and email claim/opt-in are correctness defects.

## What is actually implemented
- Parent signup creates trial `Subscription` (`childProfileLimit: 3`) + prefs in one tx: `src/modules/identity/service.ts:45-76`
- Child create: Serializable count+insert, P2034 retry x3, hard delete: `src/modules/progress/children-service.ts:31-71,112-128`
- POST `/api/children` and `/api/onboarding/complete` call `createChildProfile`: `src/app/api/children/route.ts:65`, `src/app/api/onboarding/complete/route.ts:69-82`
- Watch session HMAC+Redis, heartbeat seq/gap/elapsed cap, complete-watch audit: `src/modules/learning/video-watch-service.ts:320-613`
- Lesson complete tx: existing `LessonCompletion` → `{idempotent:true}`; else completion + evidence + `RewardGrant` + progress; P2002 fallback: `src/modules/learning/completion-service.ts:184-372`
- Uniques: `LessonCompletion @@unique([childId, lessonId])` `prisma/schema.prisma:437`; `RewardGrant @@unique([childId, lessonId, type])` `:491`
- Billing checkout adapter `mock_gateway|stripe`, mock blocked in production: `src/modules/billing/checkout-service.ts:32-87`, `src/modules/billing/providers/index.ts:7-22`
- Subscription webhook: advisory lock + `WebhookEvent @@unique([provider, eventId])` + payment upsert + PROCESSED short-circuit: `src/modules/billing/webhook-service.ts:78-292`, `prisma/schema.prisma:567,551`
- PayOS course webhook: signature, amount check, enrollment upsert, PROCESSED/SUCCEEDED short-circuit: `src/modules/courses/course-payment-webhook-service.ts:49-362`
- Weekly report `@@unique([childId, weekStart])` + P2002 return existing: `src/modules/reports/weekly-report-service.ts:100-218`, `prisma/schema.prisma:531`
- Email claim `QUEUED→PROCESSING` via `updateMany`, opt-out/child flag skip: `src/modules/reports/email-delivery-service.ts:86-267`
- Shared API errors: Zod 400, `DomainError.status`, else 500: `src/lib/route-error.ts:16-67`, `{ok,error}` `src/lib/http.ts:24-45`
- 9 BullMQ queues; enqueue helpers match processors 1:1 (no blog-newsletter queue): `src/worker/queue.ts:10-44`, `src/worker/index.ts:13-21`

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
| Plan-based child limit 3 default, 5 Family+ | `README.md:13` | Create path hardcodes `CHILD_PROFILE_LIMIT = 1` and never reads `Subscription.childProfileLimit`. Family+ webhook still writes 5. | Doc-lie |
| Idempotent lesson complete + one reward per child per lesson | `README.md:15` | Sequential + concurrent complete protected by uniques + P2002. Watch-complete audit is not unique; 24h window can revoke watch proof. | Partial |
| Weekly report generation (in-app + API) | `README.md:16` | Generate exists, but first create freezes metrics for the week (no regenerate). Worker bootstrap generates immediately, not Sunday. | Partial |
| Weekly report email pipeline, opt-in aware | `README.md:17` | Dispatch + claim exist. Signup defaults email on. No parent write path to disable weekly email. Marketing unsubscribe keeps `weeklyReportEmailEnabled: true`. Null prefs → send. | Partial |
| Billing webhook idempotency + audit | `README.md:18` | Same `provider+eventId` is idempotent (lock + unique). Distinct Stripe event IDs for one payment are not. PayOS course path has uniques but no advisory lock. | Partial |
| Checkout adapter `mock_gateway` default, `stripe` available | `README.md:19` | Implemented. Schema also accepts `MONTHLY_STANDARD`; Stripe maps only yearly planCodes. | Partial |
| 10 BullMQ queues including `blog-newsletter` | `docs/codebase-summary.md:211-224` | 9 queues in `src/worker/queue.ts`. No blog-newsletter queue or processor. | Doc-lie |
| Course purchase: Stripe webhook updates Subscription | `docs/system-architecture.md:216-231` | Course PayOS webhook enrolls `CourseEnrollment`. Subscription billing is a separate mock/stripe webhook. | Partial |
| Lesson complete enqueues certificate + weekly-reports | `docs/system-architecture.md:234-247` | `completeLesson` does not enqueue those jobs. Certificate enqueue is course-enrollment complete. | Doc-lie |

## Findings
### Critical
- [Stripe monthly checkout cannot activate plan] `src/modules/billing/checkout-service.ts:9-10` + `src/modules/billing/providers/stripe-provider.ts:15-21,58-59` + `src/modules/billing/stripe-webhook-service.ts:111-136` — API accepts `MONTHLY_STANDARD`; Stripe session is labeled yearly and charged in VND; mapper `z.enum(["YEARLY_STANDARD","YEARLY_FAMILY_PLUS"])` throws `STRIPE_WEBHOOK_UNMAPPABLE` (400). Stripe will not retry 400. Impact: charge without subscription update. Suggested fix: either reject monthly at checkout or map monthly metadata + webhook eventType.

### High
- [Create path ignores paid plan child limits] `src/modules/progress/children-service.ts:6,38-44` vs `src/modules/billing/plan-config.ts:18-32` and `src/modules/identity/service.ts:69` — always cap 1. Family+ payment writes `childProfileLimit: 5` (`webhook-service.ts:48-54,189-196`) but create never reads it. Paid Family+ still 409 after one child. Suggested fix: enforce `Subscription.childProfileLimit` inside the Serializable tx; add a DB check/unique strategy that matches the product rule.
- [Bulk enroll bypasses child cap] `src/modules/organizations/bulk-enroll-service.ts:78-89` — `childProfile.create` with nickname `findFirst` only; no count, no Serializable, no `createChildProfile`. Unlimited children per parent. Suggested fix: reuse `createChildProfile` / same limit+tx.
- [Weekly report frozen on first insert] `src/modules/reports/weekly-report-service.ts:103-114,197-214` — existing `(childId, weekStart)` returned unchanged. Worker bootstrap enqueues generate immediately (`src/worker/index.ts:138,145-151`, no `jobId` at `queue.ts:69-79`). Mid-week deploy/restart can freeze partial/empty week; Sunday cron then returns that snapshot. Suggested fix: upsert/recompute until weekEnd, and do not generate on worker boot; use a stable weekly `jobId`.
- [Weekly email opt-in is not a user control] `src/modules/identity/service.ts:54-61` defaults enabled; `canSendWeeklyEmail` treats null prefs as send (`email-delivery-service.ts:86-103`); marketing unsubscribe upserts `weeklyReportEmailEnabled: true` (`src/app/api/email/marketing/unsubscribe/route.ts:70-76`). No `src` writer sets weekly email false except tests. Claimed opt-in is fail-open + no settings API. Suggested fix: parent PATCH prefs; fail closed when prefs missing; marketing unsubscribe must not re-enable weekly mail.
- [Watch proof expires in 24h] `src/modules/learning/video-watch-service.ts:13,99-123,590-612` — `assertLessonVideoWatchCompleted` requires `AuditLog` `learning.lesson.video.watch.completed` within 24h. Redis session already deleted on watch-ready (`:557-558`). Watched-but-not-completed after 24h → `VIDEO_WATCH_REQUIRED`. Suggested fix: persist watch-complete on `LessonProgress` (or drop the time window).
- [Gift code redeem TOCTOU] `src/modules/courses/gift-code-service.ts:53-112` — read `usedAt` then update, no tx/lock; `GiftCode.code` unique does not serialize unused→used. Concurrent redeem can activate/extend two subscriptions. Suggested fix: update-where `usedAt IS NULL` in a tx, abort if count=0.
- [Caregiver accept does not create caregiver] `src/modules/caregivers/service.ts:249-300` — only `accepted: true`. No `CaregiverAccount` row. Limit check on invite create (`:157-159`) is bypassable (no tx) and unused after accept. Suggested fix: create caregiver in the same tx as accept; unique+tx on invite.
- [Webhook idempotency is eventId-only; payment status is not monotonic] `src/modules/billing/stripe-webhook-service.ts:117-173` + `src/modules/billing/webhook-service.ts:92-96,188-254` — `checkout.session.completed` and `checkout.session.async_payment_succeeded` are both `payment_succeeded` with different `event.id`s, so both run. Each resets `currentPeriodStart/End` to event time + 1 year. A later `async_payment_failed` overwrites `PaymentRecord` to FAILED and subscription to GRACE after a SUCCEEDED event. Suggested fix: idempotency key on `provider+transactionId` with monotonic status (SUCCEEDED/REFUNDED beat FAILED); ignore failed after success unless refund.
- [Package upgrade checkout cannot fulfill] `src/modules/billing/package-service.ts:305-324` + `src/modules/billing/providers/stripe-provider.ts:49-60` — upgrade passes `planCode: targetPackage.code` and `metadata` (upgrade/targetPackageId). Stripe adapter only sends `parentId/parentEmail/planCode` and drops `input.metadata`. Webhook mapper requires yearly planCodes and `processBillingWebhook` never writes `PackageSubscription`. Impact: charge without package grant. Suggested fix: persist pending upgrade intent; Stripe metadata must include mappable fields; webhook must upsert `PackageSubscription`.

### Medium
- [PayOS course webhook has no advisory lock] `src/modules/courses/course-payment-webhook-service.ts:68-103` vs billing `webhook-service.ts:79-81`. Concurrent distinct `eventId`s for one `orderCode` can both see non-SUCCEEDED and double-run enrollment side effects (`trackPilotPurchaseSucceeded`). Enrollment upsert is unique `courseId_parentId`. Suggested fix: lock on orderCode like billing `pg_advisory_xact_lock`.
- [Email duplicate after send-then-crash] `email-delivery-service.ts:211-254` — send, then mark SENT. Crash after provider send leaves PROCESSING; stale claim (15 min, `:7,123-136`) requeues QUEUED and resends. Provider tags include `weekly_report_id` but send is not idempotent. Suggested fix: persist provider message id before send, or mark SENT with a send-attempt token first.
- [Cron generate does not enqueue email] `src/app/api/cron/weekly-reports/route.ts:52-53` vs worker `generate-weekly-reports.ts:13-14`. Vercel cron (`README.md:266`) only generates. Emails depend on worker 30-min interval (`worker/index.ts:161-167`). Suggested fix: cron should enqueue `dispatch-weekly-report-emails` or share one scheduler.
- [Generate API re-notifies existing reports] `src/app/api/reports/generate/route.ts:53-86` — `generateWeeklyReportsForParent` returns existing rows; every POST creates another `NotificationType.REPORT`. No notification unique. Suggested fix: notify only when `idempotent`/newly created.
- [Worker generate is unfiltered] `weekly-report-service.ts:264-269` loads every `ChildProfile`. Cron filters active subscriptions (`cron/weekly-reports/route.ts:10-16,27-53`). Expired accounts still get queued email rows. Suggested fix: same subscription filter as cron.
- [Caregiver invite check-then-create] `caregivers/service.ts:105-169` — no tx; `@@unique([parentId, email])` exists (`schema.prisma:273`) but uncaught P2002 → `handleRouteError` 500 (`route-error.ts:50-58`). Suggested fix: catch P2002 → 409; wrap count+insert.
- [Unhandled Prisma unique → 500] `src/lib/route-error.ts:16-58` maps Zod/DomainError only. Services that do not catch P2002 leak 500. Suggested fix: map P2002/P2025 in `handleRouteError` or at each mutation.
- [Heartbeat RMW is not Lua/WATCH] `video-watch-service.ts:423-468`. Same-sequence concurrent writes compute from one snapshot so credit does not double; fail-closed on seq. Residual lost-update on `lastHeartbeatAtMs`. Suggested fix: Redis WATCH or Lua CAS on `lastSequence`.

### Low
- [No ChildProfile unique on parentId] `prisma/schema.prisma:294-329` — cap is app-only Serializable. Pooler/isolation miss → two children. Suggested fix: if product is 1 child, unique partial index; if 3/5, keep count in tx plus check constraint is not enough — keep Serializable.
- [Watch session del before audit insert] `video-watch-service.ts:557-577` — crash between `redis.del` and `COMPLETED_WATCH` forces re-watch. Fail-closed. Suggested fix: write audit first, then del.
- [completeLesson skill attempts fire-and-forget] `completion-service.ts:305-325` — un-awaited `Promise.all`. Adaptive state can miss. Suggested fix: await or enqueue a job.
- [Docs claim 10 queues] `docs/codebase-summary.md:211-224` — code has 9; `blog-newsletter` absent. Suggested fix: update docs.
- [Certificate worker discards PDF bytes] [INFERENCE from scout] `src/worker/jobs/generate-certificate.ts` — out of core lesson path; course complete still sets a URL. Suggested fix: persist or stop claiming PDF generation.

## Tests covering this slice
- `src/modules/progress/__tests__/children-service.test.ts` — 409 when count=1, one P2034 retry. Holes: does not read `Subscription.childProfileLimit`; helper tests use limit=3 while production constant is 1; no bulk-enroll; no Family+ 5.
- `src/modules/identity/__tests__/service.test.ts` — signup writes `childProfileLimit: 3`. Hole: no child-create interaction.
- `src/modules/learning/__tests__/completion-service.test.ts` — sequential idempotent, mocked P2002 fallback, first complete creates reward mock, trial block. Holes: no parallel complete; reward unique not asserted against DB.
- `src/modules/learning/__tests__/video-watch-service.test.ts` — session/heartbeat/expiry/mismatch/replay. Holes: no parallel heartbeat; “once per window” does not call watch-complete twice; no 24h expiry test; no `WATCH_HEARTBEAT_TOO_FAST`.
- `src/modules/billing/__tests__/webhook-service.test.ts` + `webhook-service.transaction.test.ts` — PROCESSED duplicate short-circuit, signature, plan fields. Holes: no live advisory-lock integration; Stripe monthly unmapped; dual Stripe event IDs; PayOS concurrent orderCode; package upgrade fulfill.
- `src/modules/billing/__tests__/checkout-service.test.ts` — Family+ config `childProfileLimit: 5`. Hole: does not assert create-child uses it.
- `src/modules/reports/__tests__/weekly-report-service.test.ts` — sequential existing return. Holes: no freeze-of-stale-metrics; no P2002 concurrent; no worker-boot generate.
- `src/modules/reports/__tests__/email-delivery-service.test.ts` — claim skip, SENT, child opt-out → BOUNCED, stale requeue; documents null prefs → send. Holes: no send-then-crash resend; no missing settings API.
- `src/app/api/reports/send-email/route.test.ts` — auth/rate-limit. Hole: no opt-in assertion.
- `src/worker/queue.test.ts` — 3 enqueue smokes. Hole: no processor/jobId matrix.
- `scripts/e2e-data-integrity.mjs` — sequential complete retry, 1 completion + 1 reward. Hole: not concurrent.

## Production-readiness blockers
- Do not sell Family+ (5 children) or Standard (3 children) until `createChildProfile` reads `Subscription.childProfileLimit` and bulk-enroll cannot bypass it.
- Do not enable Stripe `MONTHLY_STANDARD` checkout until webhook mapping and Stripe product name match; otherwise payments settle without plan activation.
- Do not use package-upgrade checkout against Stripe until metadata is forwarded and webhook writes `PackageSubscription`; current path can charge without granting the package.
- Stop generating weekly reports on every worker bootstrap; first-create freeze plus boot enqueue will ship incomplete weeks and then email them.
- Weekly report email is not opt-in in product terms (default on, no disable API). Do not claim opt-in / do not send in production until a real preference write path exists.
- Gift-code redeem must be atomic before using codes as paid entitlement.

## Unresolved questions
- Is production `BILLING_PROVIDER` actually `stripe`, and is `MONTHLY_STANDARD` exposed in UI or only the Zod schema?
- How often does the production worker process restart (each restart enqueues generate+email with no `jobId`)?
- Is the intended child cap 1 (current API/UI) or 3/5 (README + Subscription + billing config)? Code and docs disagree; product must pick one.
- Should caregiver accept create a `CaregiverAccount`, or is invite-accepted-only the intended model?
