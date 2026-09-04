# Slice: ccom
# Agent: ccom
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
51/100 — Course catalog + PayOS/mock checkout and Stripe/mock subscription webhooks exist; B2B landing is a redirect, 20% subscriber discount is absent, monthly Stripe cannot complete, 30-day refund is copy-only.

## Quality score
58/100 — Subscription webhook idempotency/audit is real; gift redeem races, bulk-enroll auth is broken, certificate worker is a no-op upload, and commerce e2e tests mock the APIs they claim to prove.

## What is actually implemented
- Subscription plan table: `MONTHLY_STANDARD` 149_000 / 3 children, `YEARLY_STANDARD` 799_000 / 3, `YEARLY_FAMILY_PLUS` 1_199_000 / 5. `src/modules/billing/plan-config.ts:4-36`
- Signup trial: `PlanCode.TRIAL` + `TRIALING`, `currentPeriodEnd = addDays(..., 7)`. `src/modules/identity/service.ts:64-75`
- Subscription checkout API: `POST /api/billing/checkout` → adapter `mock_gateway` | `stripe`. `src/app/api/billing/checkout/route.ts:12-50`, `src/modules/billing/providers/index.ts:7-22`
- Stripe adapter: one-shot Checkout Session `mode=payment`, VND `unit_amount`. `src/modules/billing/providers/stripe-provider.ts:41-86`
- Mock adapter: success-URL query params, no money movement. `src/modules/billing/providers/mock-provider.ts:15-38`
- Subscription webhooks: mock (non-prod), Stripe, shared `processBillingWebhook`. `src/app/api/billing/webhooks/mock/route.ts:13-16`, `src/app/api/billing/webhooks/stripe/route.ts:14-112`, `src/modules/billing/webhook-service.ts:73-293`
- Webhook idempotency: `@@unique([provider, eventId])`, advisory lock, duplicate short-circuit, `auditTrail` + `createAuditLog`. `prisma/schema.prisma:555-567`, `src/modules/billing/webhook-service.ts:79-96,256-283`
- Stripe refund event maps to `payment_refunded`; processor sets `SubscriptionStatus.REFUNDED`, `autoRenew=false`. `src/modules/billing/stripe-webhook-service.ts:117-173`, `src/modules/billing/webhook-service.ts:221-228`
- Course catalog: published storefront + sale-window pricing. `src/modules/courses/course-service.ts:75-167`, `src/modules/courses/course-pricing.ts:11-21`
- Course checkout: `mock_gateway` | `payos` | `free_temporary`; PayOS payment links. `src/modules/courses/course-checkout-service.ts:45-47,470-575`, `src/modules/billing/payos-client.ts:106-166`
- PayOS webhook enrolls course/bundle, amount match, `WebhookEvent` duplicate check. `src/app/api/billing/webhooks/payos/route.ts:10-73`, `src/modules/courses/course-payment-webhook-service.ts:49-362`
- Course reviews + moderation. `src/modules/courses/course-review-service.ts:21-117`
- Gift codes: admin generate (plan-bound), parent redeem page + API. `src/app/api/admin/gift-codes/route.ts:13-88`, `src/app/api/gift-codes/redeem/route.ts:10-41`, `src/app/(main)/gift-code/page.tsx:16-32`
- Certificates: pdf-lib on GET; complete-course enqueues worker. `src/modules/courses/certificate-service.ts:5-130`, `src/app/api/certificates/[enrollmentId]/route.ts:10-51`, `src/modules/courses/course-service.ts:201-210`
- Orgs: `Organization` + `OrganizationMember` (`TEACHER_ADMIN` / `STUDENT_PARENT`), admin CRUD, member APIs. `prisma/schema.prisma:1295-1326`, `src/modules/organizations/organization-service.ts:18-127`
- Teacher dashboard + at-risk flag + PDF class report. `src/app/(main)/teacher/dashboard/page.tsx:11-154`, `src/modules/organizations/class-report-service.ts:6-118`
- Bulk enroll: CSV parser + row processor; teacher route sync; org route queues BullMQ. `src/modules/organizations/bulk-enroll-service.ts:22-136`, `src/app/api/teacher/bulk-enroll/route.ts:13-48`, `src/app/api/organizations/[orgId]/bulk-enroll/route.ts:14-40`
- Class skill heatmap / skill-gap wrappers. `src/modules/organizations/class-skill-heatmap-service.ts:21-38`
- Refund policy page + email channel copy. `src/app/(main)/refund-policy/page.tsx:17-75`, `locales/en/translation.json:5131-5178`
- Parent billing history (PayOS/mock labels, REFUNDED badge). `src/app/(main)/parent/billing/page.tsx:15-67`
- Renewal eligibility helper only (no charger). `src/modules/billing/renewal-service.ts:11-40`

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
| Stripe + PayOS + mock_gateway adapters | README.md:240-241; docs/codebase-summary.md:175 | Two rails: `BILLING_PROVIDER` = mock/stripe; `COURSE_PAYMENT_PROVIDER` = mock/payos. No PayOS subscription adapter. `src/modules/billing/providers/index.ts:7-10` | Partial |
| Monthly / Yearly / Family+ sellable | docs/project-overview-pdr.md:32-34; README.md:13 | Config exists. `/pricing` redirects to `/courses`. `CheckoutPlanButton` unused. `src/app/(main)/pricing/page.tsx:3-5` | Partial |
| Monthly 99,000đ | PDR.md:32; README child-limit copy vs prices | Charged amount is 149_000. Analytics button still 99_000. `plan-config.ts:16-17`, `checkout-plan-button.tsx:9-12` | Doc-lie |
| 7-day free trial | PDR.md:32 | Signup trial 7 days. `identity/service.ts:72-73` | Done |
| Course catalog + checkout | PDR.md:94-96; README.md:152 | Storefront + PayOS/mock checkout implemented | Done |
| 20% subscriber discount | PDR.md:97; docs/project-roadmap.md:133 | `discountApplied` is list>sale only. No subscription lookup in checkout. `course-checkout-service.ts:563-566` | Missing |
| Gift codes | PDR.md:99; codebase-summary.md:134 | Subscription plan codes only, not course SKUs. `prisma/schema.prisma:1149-1158` | Partial |
| Certificates (pdf-lib) | PDR.md:98; system-architecture.md:146 | On-demand PDF works. Worker does not upload bytes. Certificate has no child/parent name. `generate-certificate.ts:33-56`, `certificate-service.ts:5-8` | Partial |
| Organizations / teacher bulk enroll / class reports | PDR.md:102-107 | Models + teacher UI + PDF exist. Teacher CSV is sync; org JSON is queued. Passwords not delivered. | Partial |
| B2B `/for-schools` | PDR.md:107; codebase-summary.md:38 | Page is `redirect("/courses")`. CSS leftover. `for-schools/page.tsx:3-5` | Scaffold |
| B2B annual contract / invoice billing | PDR.md:36; project-roadmap.md:134 | `billingStart`/`billingEnd` fields only. No invoice, seats, or contract checkout. `schema.prisma:1300-1308` | Missing |
| Webhook idempotency + audit trail | README.md:18 | True for subscription webhooks. PayOS has unique eventId but no advisory lock. | Partial |
| 30-day refund | PDR.md:32-33,243; homepage copy | Policy + email instructions. No claim API, no 30-day window check. Stripe refund webhook has no age gate. | Partial |
| Stripe course purchase flow | system-architecture.md:216-230 | Course checkout is PayOS/mock, not Stripe; does not set `Subscription.status`. | Doc-lie |
| Recurring Stripe subscriptions | codebase-summary.md:175 "renewals" | Stripe `mode=payment`. `listSubscriptionsDueForAutoCharge` never charges. `stripe-provider.ts:50`, `renewal-service.ts:24-40` | Missing |
| Coupon codes | admin coupon API | `CouponCode` + admin CRUD. Unused by billing/course checkout. | Scaffold |
| Abeka package checkout | `package-config.ts` / `package-service.ts` | Separate Abeka SKU catalog + checkout helper. Not the PDR Monthly/Yearly/Family+ product. | Partial |

## Findings
### Critical
- [Monthly Stripe checkout cannot activate] `src/modules/billing/stripe-webhook-service.ts:111-136` — mapper only accepts `YEARLY_STANDARD` \| `YEARLY_FAMILY_PLUS`. Checkout still sends `MONTHLY_STANDARD` (`checkout-service.ts:9-10`, `stripe-provider.ts:56`). Webhook throws `STRIPE_WEBHOOK_UNMAPPABLE`. Paid monthly never activates. Fix: accept monthly, set period with `addMonths` not `addYears` (`webhook-service.ts:182-183`).
- [Advertised 99k vs charged 149k] `plan-config.ts:16-17` vs PDR.md:32 and `checkout-plan-button.tsx:10` — source of truth split. Parents would be charged 149k if monthly checkout is wired. Fix: one price constant used by config, UI, analytics, emails.
- [Bulk-enroll parents cannot log in] `bulk-enroll-service.ts:59-75` — creates `ParentAccount` + `passwordHash` from `Math.random()`, no Better Auth `User` (signup does `tx.user.upsert`, `identity/service.ts:78-92`), password never emailed. Fix: create auth user, send invite with set-password; do not invent unused hashes.

### High
- [Gift redeem race + burn-then-validate] `gift-code-service.ts:53-86` — check `usedAt` then update, no transaction/unique unused constraint. Plan parse happens after mark-used; invalid plan burns the code (`:67` then `:83-85`). Fix: single transaction, `UPDATE ... WHERE usedAt IS NULL`, validate plan first.
- [No 20% subscriber discount] PDR.md:97 vs `course-checkout-service.ts:563-566` — sale windows only. Fix: if claimed, apply after confirming active subscription; else unclaim docs/UI.
- [30-day refund is not a product] `locales/en/translation.json:5143-5163` vs no `/api/refund*` — Stripe `charge.refunded` marks REFUNDED with no 30-day check (`webhook-service.ts:221-228`). Course PayOS has no refund event. Fix: claim ticket + window + provider refund, or stop marketing “100% refund within 30 days” (`section-pricing-preview.tsx` claim).
- [Stripe is not a subscription] `stripe-provider.ts:50` `mode=payment`; display name maps monthly to “Standard (Yearly)” (`:15-20`). `autoRenew` is set true on success (`webhook-service.ts:197`) with no recapture. Fix: Stripe Billing subscriptions or disable autoRenew + UI.
- [B2B landing is a stub] `for-schools/page.tsx:3-5` — docs list `/for-schools` as public B2B page. CSS unused (`for-schools.css:1-151`). Fix: restore landing or drop the claim.
- [Certificate worker does not persist PDF] `generate-certificate.ts:33-56` — both branches set URL to `/api/certificates/...`; `pdfBytes` only logged. Architecture claims R2 upload (`system-architecture.md:146`). GET regenerates without child name (`certificate-service.ts:5-8`).

### Medium
- [PayOS webhook weaker than billing webhook] `course-payment-webhook-service.ts:68-83` — no `pg_advisory_xact_lock`. Concurrent PayOS retries can double-enroll races before unique enrollment. Billing path has the lock (`webhook-service.ts:79-81`).
- [Two bulk-enroll contracts] teacher CSV sync `{ result }` (`teacher/bulk-enroll/route.ts:47-48`) vs org JSON 202 `{ jobId }` (`organizations/.../bulk-enroll/route.ts:39-40`). E2E expects `{ queued: 3 }` (`teacher-bulk-enroll.spec.ts:70-72`).
- [Teacher “Active (30 days)” is wrong] `teacher/dashboard/page.tsx:77-41` — label 30 days, computation is `lessonsCompleted > 0` with no date filter.
- [Class PDF single page] `class-report-service.ts:16-105` — one A4 page, `rowHeight=20`, no overflow page. Large classes clip.
- [Pricing page gone] `pricing/page.tsx:3-5` — lifecycle emails still link `/pricing` (`docs/marketing/email-sequences.md:127`).
- [`BILLING_PROVIDER=mock_gateway` not env-blocked in production] `env.ts:210-211` blocks course mock; subscription mock only throws at `resolveBillingProvider` (`providers/index.ts:13-14`). Asymmetric fail-closed.
- [Webhook success always +1 year] `webhook-service.ts:182-183` — even if monthly were accepted, entitlement would be yearly.
- [CouponCode unused in checkout] `schema.prisma:692` + `api/admin/coupons` vs no use in `src/modules/billing` or `src/modules/courses`.

### Low
- [Gift / purchase e2e are route stubs] `gift-code-redeem.spec.ts:6-47` fulfills `{ subscriptionActivated }` but API returns `{ redeemed: true }` (`gift-codes/redeem/route.ts:41`). `course-purchase-flow.spec.ts:56-108` mocks checkout. Zero payment-provider proof.
- [CheckoutPlanButton dead] no imports; stale 99k amounts (`checkout-plan-button.tsx:8-12`).
- [Webhook test amount 1_299_000] does not match any plan (`webhook-service.test.ts:55-56`).
- [Org domain/logo unused in teacher UX] schema fields `logoUrl`/`primaryColor`/`domain` (`schema.prisma:1304-1306`) not applied on dashboard.

## Tests covering this slice
- `src/modules/billing/__tests__/webhook-service.test.ts` — HMAC + processBillingWebhook mocks. Proves signature helper and control flow. Hole: no real DB uniqueness; amount not a real plan.
- `src/modules/billing/__tests__/webhook-service.transaction.test.ts` — refund → REFUNDED + autoRenew false. Hole: monthly plan not in schema.
- `src/modules/billing/__tests__/stripe-webhook-service.test.ts` — `charge.refunded` mapping. Hole: no MONTHLY_STANDARD case (would fail).
- `src/modules/billing/providers/stripe-provider.test.ts` — session create happy/error. Hole: no monthly display-name assertion.
- `src/modules/billing/__tests__/checkout-service.test.ts` — checkout session create.
- `src/modules/billing/__tests__/payos-client.test.ts` — signature payload. Hole: not full webhook enroll.
- `src/modules/billing/__tests__/renewal-service.test.ts` — eligibility boolean only. Hole: no charge job.
- `src/modules/courses/course-pricing.test.ts` — sale windows / free-temporary. Hole: no subscriber 20% case (feature missing).
- `src/app/api/courses/checkout/{return,status,mock-success}/route.test.ts` — return/status helpers.
- `src/app/api/billing/webhooks/{mock,stripe}/route.test.ts` — route auth/signature.
- `tests/e2e/course-purchase-flow.spec.ts` — mocked catalog/checkout/certificate. Does not hit PayOS or DB.
- `tests/e2e/gift-code-redeem.spec.ts` — mocked redeem contract that does not match API.
- `tests/e2e/teacher-bulk-enroll.spec.ts` — mocked org bulk-enroll `queued`. Does not match teacher CSV or org `{ jobId }`.
- Missing: gift-code-service unit tests, organization/bulk-enroll/class-report unit tests, certificate-service tests, PayOS enroll integration, refund-window tests.

## Production-readiness blockers
- Do not sell `MONTHLY_STANDARD` via Stripe until webhook accepts it and period is monthly.
- Do not advertise 99k/month or 20% subscriber discount or `/for-schools` or 30-day in-product refund until code matches.
- Do not run teacher bulk-enroll in production until invite/login works (Better Auth user + password delivery).
- Do not treat `autoRenew` as billed recurrence; Stripe is one-shot.
- Commerce e2e must hit real redeem/checkout/enroll, not `page.route` stubs, before calling the slice tested.

## Unresolved questions
- Is subscription retail intentionally retired (`/pricing` → `/courses`), with PayOS courses as the only live money path?
- Canonical monthly price: 99_000 (docs/analytics) or 149_000 (`plan-config`)?
- Should gift codes ever redeem courses, or only subscription days?
- Is `/for-schools` redirect a temporary kill, or is B2B out of MVP?
- Who processes `billing@tinygeniushubvn.tech` refunds, and is Stripe Dashboard the only refund tool?
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/plan.md` is missing from this tree (README still links it).
